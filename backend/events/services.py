from django.db import transaction
from django.db.models import Q
from institutions.models import Event, Activity, Allocation, CourseBatch, Student, Enrolment, User, Guardian, StudentGuardian
from institutions.notification_service import NotificationService
from .broadcast import broadcast_calendar_update

# A day counts as "overloaded" — a scheduling conflict worth flagging — once
# this many events/activities land on it, even if none of them time-overlap
# (e.g. three same-day assignment due dates). Shared with activities/services.py
# so both Event and Activity creation trigger the same rule.
DAY_OVERLOAD_THRESHOLD = 3


def get_institution_id(user):
    """Resolve the institution the current user belongs to, based on role."""
    role = user.role.name.upper()

    if role == 'OWNER':
        inst = user.owned_institutions.filter(is_deleted=False).first()
        return inst.id if inst else None

    if role == 'MANAGER':
        try:
            return user.manager_profile.institution_id
        except Exception:
            return None

    if role == 'EDUCATOR':
        try:
            return user.educator_profile.institution_id
        except Exception:
            return None

    if role == 'STUDENT':
        try:
            batch = user.student_profile.batch
            return batch.institution_id if batch else None
        except Exception:
            return None

    return None


def _own_course_ids(user):
    """Course ids this educator teaches."""
    try:
        educator = user.educator_profile
    except Exception:
        return []
    return list(Allocation.objects.filter(educator=educator).values_list('course_id', flat=True))


def _enrolled_course_ids(user):
    """Course ids visible to this student, via their batch."""
    try:
        batch = user.student_profile.batch
    except Exception:
        return []
    if not batch:
        return []
    return list(batch.course_batches.values_list('course_id', flat=True))


def _children_course_ids(user):
    """Course ids visible to this parent, via every non-deleted child's batch."""
    try:
        guardian = Guardian.objects.get(user_id=user.id)
    except Guardian.DoesNotExist:
        return []

    links = StudentGuardian.objects.filter(guardian=guardian).select_related('student__batch')
    course_ids = set()
    for link in links:
        student = link.student
        if student.is_deleted or not student.batch:
            continue
        course_ids |= set(student.batch.course_batches.values_list('course_id', flat=True))
    return list(course_ids)


def _visible_course_ids(user):
    role = user.role.name.upper()
    if role == 'EDUCATOR':
        return _own_course_ids(user)
    if role == 'STUDENT':
        return _enrolled_course_ids(user)
    if role == 'PARENT':
        return _children_course_ids(user)
    return []


def _own_student_ids(user):
    """
    All student ids across every course this educator teaches — used to
    scope which students' personal calendar events an educator may see.
    Mirrors activities/services.py's _course_students (batch ∪ Enrolment).
    """
    course_ids = _own_course_ids(user)
    if not course_ids:
        return []

    batch_ids = CourseBatch.objects.filter(course_id__in=course_ids).values_list('batch_id', flat=True)
    batch_student_ids = set(
        Student.objects.filter(batch_id__in=batch_ids, is_deleted=False).values_list('id', flat=True)
    )
    enrolled_ids = set(
        Enrolment.objects.filter(course_id__in=course_ids).values_list('student_id', flat=True)
    )
    return list(batch_student_ids | enrolled_ids)


def _affected_user_ids(event):
    """Whose calendar will this event actually show up on?"""
    ids = {event.created_by_id}
    if event.course_id:
        batch_ids = CourseBatch.objects.filter(course_id=event.course_id).values_list('batch_id', flat=True)
        student_ids = set(
            Student.objects.filter(batch_id__in=batch_ids, is_deleted=False).values_list('id', flat=True)
        )
        student_ids |= set(
            Enrolment.objects.filter(course_id=event.course_id).values_list('student_id', flat=True)
        )
        ids |= set(
            Student.objects.filter(id__in=student_ids, user__isnull=False).values_list('user_id', flat=True)
        )
    return ids


def day_item_count(user, day):
    """Total events + activities visible to `user` on this calendar day —
    used to flag an overloaded day (DAY_OVERLOAD_THRESHOLD+ items) even when
    nothing literally time-overlaps, e.g. several same-day assignment due
    dates. Imported by activities/services.py so activity creation uses the
    same rule as event creation.
    """
    events = EventService.list_visible_events(user, day.year, day.month)
    count = sum(1 for e in events if e.start.date() == day)

    course_ids = _visible_course_ids(user)
    if course_ids:
        count += Activity.objects.filter(course_id__in=course_ids, due_date=day.isoformat()).count()
    return count


def _find_conflict(user_obj, event):
    """The first other event on user_obj's calendar that time-overlaps `event`, if any."""
    day = event.start.date()
    for other in EventService.list_visible_events(user_obj, event.start.year, event.start.month):
        if other.id == event.id or other.all_day or not other.end:
            continue
        if other.start.date() != day:
            continue
        if event.start < other.end and other.start < event.end:
            return other
    return None


def _notify_conflicts(event, actor):
    """Notify anyone whose calendar now has a scheduling conflict because of
    this event — either a direct time overlap with another timed event, or
    their day reaching DAY_OVERLOAD_THRESHOLD total events/activities — plus
    the educator who added it, if the conflict lands on one of their students
    rather than their own calendar."""
    day = event.start.date()
    users = User.objects.filter(id__in=_affected_user_ids(event)).select_related('role')
    date_label = event.start.strftime('%b %d')

    for u in users:
        conflict = None
        if not event.all_day and event.end:
            conflict = _find_conflict(u, event)

        item_count = day_item_count(u, day)
        overloaded = item_count >= DAY_OVERLOAD_THRESHOLD

        if not conflict and not overloaded:
            continue

        # An educator sees this same conflict on their own calendar too
        # (they can see their students' personal events) whenever it's
        # really a student's event that clashes — skip the generic notice
        # for them in that case so they only get the more specific one below,
        # not both for the same conflict.
        conflicts_with_someone_elses_event = bool(conflict) and conflict.created_by_id != u.id
        skip_generic = u.id == actor.id and event.course_id and conflicts_with_someone_elses_event
        if not skip_generic:
            message = (
                f'"{event.title}" overlaps with "{conflict.title}" on {date_label}.' if conflict else
                f'{item_count} events/activities are now scheduled on {date_label}.'
            )
            NotificationService.notify(u, title='Scheduling conflict', message=message, link='/calendar')

        if u.id != actor.id and u.role.name.upper() == 'STUDENT':
            actor_message = (
                f'Your event "{event.title}" conflicts with a student\'s existing schedule on {date_label}.'
                if conflict else
                f'Your event "{event.title}" adds to a student\'s already busy {date_label} ({item_count} items).'
            )
            NotificationService.notify(actor, title='Scheduling conflict', message=actor_message, link='/calendar')


class EventService:

    @staticmethod
    def list_visible_events(user, year=None, month=None):
        role = user.role.name.upper()
        course_ids = _visible_course_ids(user)
        query = Q(created_by=user) | Q(course_id__in=course_ids)

        if role == 'EDUCATOR':
            student_ids = _own_student_ids(user)
            if student_ids:
                query |= Q(event_type='personal', created_by__student_profile__id__in=student_ids)

        events = Event.objects.filter(query).select_related(
            'course', 'created_by', 'created_by__role'
        ).distinct()

        if year:
            events = events.filter(start__year=year)
        if month:
            events = events.filter(start__month=month)

        return events.order_by('start')

    @staticmethod
    @transaction.atomic
    def create_event(data, user):
        if not user:
            raise ValueError("Authentication required")

        role = user.role.name.upper()
        if role not in ('STUDENT', 'EDUCATOR'):
            raise ValueError("Only students and educators can create calendar events.")

        title = (data.get('title') or '').strip()
        start = data.get('start')
        if not title or not start:
            raise ValueError("Title and start date/time are required.")

        institution_id = get_institution_id(user)
        if not institution_id:
            raise ValueError("No institution found for this user.")

        course_id = data.get('course_id') or None
        event_type = data.get('event_type') or 'personal'

        if role == 'STUDENT':
            if course_id:
                raise ValueError("Students can only create personal events.")
            event_type = 'personal'
        else:  # EDUCATOR
            if course_id and int(course_id) not in _own_course_ids(user):
                raise ValueError("You can only create events for your own courses.")
            if not course_id:
                event_type = 'personal'

        event = Event.objects.create(
            title=title,
            description=data.get('description', ''),
            event_type=event_type,
            start=start,
            end=data.get('end') or None,
            all_day=bool(data.get('all_day', False)),
            course_id=course_id,
            institution_id=institution_id,
            created_by=user,
        )
        broadcast_calendar_update(institution_id, 'events_changed')
        event.refresh_from_db()
        _notify_conflicts(event, user)
        return event

    @staticmethod
    @transaction.atomic
    def update_event(event, data, user):
        if event.created_by_id != user.id:
            raise ValueError("You can only edit events you created.")

        role = user.role.name.upper()

        if 'title' in data:
            title = (data.get('title') or '').strip()
            if not title:
                raise ValueError("Title is required.")
            event.title = title
        if 'description' in data:
            event.description = data.get('description', '')
        if 'start' in data and data.get('start'):
            event.start = data['start']
        if 'end' in data:
            event.end = data.get('end') or None
        if 'all_day' in data:
            event.all_day = bool(data.get('all_day'))

        if role == 'EDUCATOR':
            if 'course_id' in data:
                course_id = data.get('course_id') or None
                if course_id and int(course_id) not in _own_course_ids(user):
                    raise ValueError("You can only assign your own courses.")
                event.course_id = course_id
            if 'event_type' in data:
                event.event_type = data.get('event_type') or ('personal' if not event.course_id else event.event_type)

        event.save()
        broadcast_calendar_update(event.institution_id, 'events_changed')
        event.refresh_from_db()
        _notify_conflicts(event, user)
        return event

    @staticmethod
    def delete_event(event, user):
        if event.created_by_id != user.id:
            raise ValueError("You can only delete events you created.")
        institution_id = event.institution_id
        event.delete()
        broadcast_calendar_update(institution_id, 'events_changed')
        return True
