from django.db import transaction
from django.db.models import Q
from institutions.models import Event, Allocation


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


def _visible_course_ids(user):
    role = user.role.name.upper()
    if role == 'EDUCATOR':
        return _own_course_ids(user)
    if role == 'STUDENT':
        return _enrolled_course_ids(user)
    return []


class EventService:

    @staticmethod
    def list_visible_events(user, year=None, month=None):
        course_ids = _visible_course_ids(user)

        events = Event.objects.filter(
            Q(created_by=user) | Q(course_id__in=course_ids)
        ).select_related('course', 'created_by', 'created_by__role').distinct()

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
        return event

    @staticmethod
    def delete_event(event, user):
        if event.created_by_id != user.id:
            raise ValueError("You can only delete events you created.")
        event.delete()
        return True
