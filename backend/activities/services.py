from datetime import date, timedelta
from django.db import transaction
from django.utils import timezone
from institutions.models import (
    Activity, Allocation, Event, Student, StudentGuardian, Progress, Enrolment, CourseBatch, DueSoonReminder,
)
from institutions.notification_service import NotificationService
from events.broadcast import broadcast_calendar_update
from events.services import day_item_count, DAY_OVERLOAD_THRESHOLD

# "Nearing" = due today or tomorrow. Checked every 30 min by
# institutions/scheduler.py; DueSoonReminder prevents re-notifying the same
# activity+student pair once a reminder has gone out.
DUE_SOON_WINDOW_DAYS = 2


def _educator_course_ids(user):
    try:
        educator = user.educator_profile
    except Exception:
        return []
    return list(Allocation.objects.filter(educator=educator).values_list('course_id', flat=True))


def _student(user):
    try:
        return user.student_profile
    except Exception:
        return None


def _student_course_ids(student):
    if not student or not student.batch:
        return []
    batch_course_ids = set(student.batch.course_batches.values_list('course_id', flat=True))
    enrolled_ids = set(Enrolment.objects.filter(student=student).values_list('course_id', flat=True))
    return list(batch_course_ids | enrolled_ids)


def _child_student_ids(user):
    try:
        guardian = user.guardian_profile
    except Exception:
        return []
    return list(StudentGuardian.objects.filter(guardian=guardian).values_list('student_id', flat=True))


def _child_course_ids(user):
    course_ids = set()
    students = Student.objects.filter(id__in=_child_student_ids(user)).select_related('batch')
    for student in students:
        course_ids.update(_student_course_ids(student))
    return list(course_ids)


def can_view_course_activities(user, course_id):
    """
    Only EDUCATOR has view_activity in the permissions table today; students
    and parents are allowed contextually (it's their own/their child's
    course) since a course-activities feature is meaningless to them
    otherwise — mirrors the same pattern used for educator detail views.
    """
    role = user.role.name.upper()
    course_id = int(course_id)

    if role == 'EDUCATOR':
        return course_id in _educator_course_ids(user)
    if role == 'STUDENT':
        return course_id in _student_course_ids(_student(user))
    if role == 'PARENT':
        return course_id in _child_course_ids(user)
    return False


def _course_students(course_id):
    batch_ids = CourseBatch.objects.filter(course_id=course_id).values_list('batch_id', flat=True)
    batch_student_ids = set(
        Student.objects.filter(batch_id__in=batch_ids, is_deleted=False).values_list('id', flat=True)
    )
    enrolled_ids = set(Enrolment.objects.filter(course_id=course_id).values_list('student_id', flat=True))
    ids = batch_student_ids | enrolled_ids
    return Student.objects.filter(id__in=ids, is_deleted=False).order_by('name')


def _courses_taken_by_course_students(course_id):
    """Every course id that any student enrolled in `course_id` is taking —
    not just `course_id` itself. Used for the workload heatmap: a student's
    "busy day" comes from all of their deadlines, not only the ones in the
    course an educator happens to be looking at."""
    course_ids = set()
    for student in _course_students(course_id):
        course_ids.update(_student_course_ids(student))
    return course_ids


def course_workload(user, course_id, year, month):
    """
    Per-day {assignment, exam} counts for `year`/`month`, aggregated across
    every course taken by any student enrolled in `course_id` — lets an
    educator see which days their students are already loaded up with
    deadlines (from any course) before picking a due date. Educator-only,
    own courses only.
    """
    if user.role.name.upper() != 'EDUCATOR' or int(course_id) not in _educator_course_ids(user):
        raise ValueError('You can only view workload for your own courses.')

    year, month = int(year), int(month)
    course_ids = _courses_taken_by_course_students(course_id)
    counts = {}

    if course_ids:
        activities = Activity.objects.filter(course_id__in=course_ids).exclude(due_date='')
        for a in activities:
            try:
                d = date.fromisoformat(a.due_date)
            except ValueError:
                continue
            if d.year != year or d.month != month:
                continue
            bucket = 'exam' if a.activity_type == 'EXAM' else 'assignment'
            counts.setdefault(a.due_date, {'assignment': 0, 'exam': 0})[bucket] += 1

        # Calendar-scheduled exam Events count too — an educator may schedule
        # an exam session directly on the calendar instead of as an Activity.
        exams = Event.objects.filter(course_id__in=course_ids, event_type='exam', start__year=year, start__month=month)
        for e in exams:
            key = e.start.date().isoformat()
            counts.setdefault(key, {'assignment': 0, 'exam': 0})['exam'] += 1

    return counts


def _notify_activity_created(activity, course):
    """Fan out a "new activity" notification to every enrolled student and
    their guardians. Each group gets a link to the page relevant to them."""
    students = list(_course_students(course.id))
    student_users = [s.user for s in students if s.user_id]

    guardians = StudentGuardian.objects.filter(
        student_id__in=[s.id for s in students]
    ).select_related('guardian__user')
    guardian_users = {g.guardian.user for g in guardians if g.guardian.user_id}
    guardian_users = {u for u in guardian_users if NotificationService.wants(u, 'activity_updates')}

    due_suffix = f' · due {activity.due_date}' if activity.due_date else ''
    if activity.due_date and activity.due_time:
        due_suffix += f' {activity.due_time}'

    NotificationService.notify_many(
        student_users,
        title=f'New activity: {activity.name}',
        message=f'{course.name}{due_suffix}',
        link='/my-courses',
    )
    NotificationService.notify_many(
        list(guardian_users),
        title=f'New activity: {activity.name}',
        message=f'Added to {course.name}{due_suffix}',
        link='/dashboard/parent',
    )


def _notify_activity_day_overload(activity):
    """Warn each enrolled student (with a login) whose due-date day just
    reached DAY_OVERLOAD_THRESHOLD total events/activities — mirrors
    events/services.py's day-overload check so an activity due date can
    trigger a conflict just as an Event can."""
    if not activity.due_date:
        return
    try:
        day = date.fromisoformat(activity.due_date)
    except ValueError:
        return

    date_label = day.strftime('%b %d')
    for student in _course_students(activity.course_id):
        if not student.user_id:
            continue
        count = day_item_count(student.user, day)
        if count >= DAY_OVERLOAD_THRESHOLD:
            NotificationService.notify(
                student.user,
                title='Scheduling conflict',
                message=f'{count} events/activities are now due/scheduled on {date_label}.',
                link='/my-courses',
            )


def check_due_soon_activities():
    """
    Periodic job (see institutions/scheduler.py) — reminds every enrolled
    student once when their activity's due date enters the "nearing"
    window. Safe to call as often as you like: DueSoonReminder's
    unique_together makes the second-and-later call for the same
    activity+student a no-op.
    """
    window_dates = {
        (date.today() + timedelta(days=i)).isoformat() for i in range(DUE_SOON_WINDOW_DAYS)
    }

    activities = Activity.objects.filter(due_date__in=window_dates).select_related('course')
    for activity in activities:
        for student in _course_students(activity.course_id):
            if not student.user_id:
                continue
            _, created = DueSoonReminder.objects.get_or_create(activity=activity, student=student)
            if not created:
                continue
            NotificationService.notify(
                student.user,
                title=f'Due soon: {activity.name}',
                message=f'{activity.course.name} · due {activity.due_date}',
                link='/my-courses',
            )


class ActivityService:

    @staticmethod
    def list_for_course(user, course_id):
        if not can_view_course_activities(user, course_id):
            return None
        return Activity.objects.filter(course_id=course_id).order_by('id')

    @staticmethod
    def list_roster(user, course_id):
        """Students visible in this course — educator (own course) only."""
        if user.role.name.upper() != 'EDUCATOR' or not can_view_course_activities(user, course_id):
            return None
        return _course_students(course_id)

    @staticmethod
    def workload(user, course_id, year, month):
        return course_workload(user, course_id, year, month)

    @staticmethod
    @transaction.atomic
    def create(user, data):
        course_id = data.get('course_id')
        if not course_id or int(course_id) not in _educator_course_ids(user):
            raise ValueError('You can only add activities to your own courses.')

        name = (data.get('name') or '').strip()
        if not name:
            raise ValueError('Activity name is required.')

        activity_type = data.get('activity_type', 'ASSIGNMENT')
        if activity_type not in dict(Activity.TYPE_CHOICES):
            raise ValueError('Invalid activity_type.')

        activity = Activity.objects.create(
            name=name,
            course_id=course_id,
            activity_type=activity_type,
            due_date=data.get('due_date', ''),
            due_time=data.get('due_time', ''),
            description=data.get('description', ''),
            optional=bool(data.get('optional', False)),
        )
        broadcast_calendar_update(activity.course.institution_id, 'activities_changed')
        _notify_activity_created(activity, activity.course)
        _notify_activity_day_overload(activity)
        return activity

    @staticmethod
    @transaction.atomic
    def update(user, activity_id, data):
        try:
            activity = Activity.objects.select_related('course').get(id=activity_id)
        except Activity.DoesNotExist:
            raise ValueError('Activity not found.')
        if activity.course_id not in _educator_course_ids(user):
            raise ValueError('You can only edit activities for your own courses.')

        if 'name' in data:
            name = (data.get('name') or '').strip()
            if not name:
                raise ValueError('Activity name is required.')
            activity.name = name
        if 'activity_type' in data:
            activity_type = data.get('activity_type')
            if activity_type not in dict(Activity.TYPE_CHOICES):
                raise ValueError('Invalid activity_type.')
            activity.activity_type = activity_type
        if 'due_date' in data:
            activity.due_date = data.get('due_date', '')
        if 'due_time' in data:
            activity.due_time = data.get('due_time', '')
        if 'description' in data:
            activity.description = data.get('description', '')
        if 'optional' in data:
            activity.optional = bool(data.get('optional'))

        activity.save()
        broadcast_calendar_update(activity.course.institution_id, 'activities_changed')
        if 'due_date' in data:
            _notify_activity_day_overload(activity)
        return activity

    @staticmethod
    def delete(user, activity_id):
        try:
            activity = Activity.objects.select_related('course').get(id=activity_id)
        except Activity.DoesNotExist:
            raise ValueError('Activity not found.')
        if activity.course_id not in _educator_course_ids(user):
            raise ValueError('You can only delete activities for your own courses.')
        institution_id = activity.course.institution_id
        activity.delete()
        broadcast_calendar_update(institution_id, 'activities_changed')
        return True


class ProgressService:

    @staticmethod
    def list_for_student(user, student_id):
        """Progress records visible to the requester for the given student, or None if not allowed."""
        role = user.role.name.upper()

        try:
            student = Student.objects.select_related('batch').get(id=student_id, is_deleted=False)
        except Student.DoesNotExist:
            return None

        if role == 'STUDENT':
            me = _student(user)
            if not me or me.id != student.id:
                return None
        elif role == 'PARENT':
            if student.id not in _child_student_ids(user):
                return None
        elif role == 'EDUCATOR':
            if not set(_educator_course_ids(user)) & set(_student_course_ids(student)):
                return None
        else:
            return None

        return Progress.objects.filter(student=student).select_related('activity', 'activity__course')

    @staticmethod
    @transaction.atomic
    def set_progress(user, student_id, activity_id, value):
        try:
            activity = Activity.objects.select_related('course').get(id=activity_id)
        except Activity.DoesNotExist:
            raise ValueError('Activity not found.')
        if activity.course_id not in _educator_course_ids(user):
            raise ValueError('You can only set progress for your own courses.')

        try:
            student = Student.objects.get(id=student_id, is_deleted=False)
        except Student.DoesNotExist:
            raise ValueError('Student not found.')

        if activity.course_id not in _student_course_ids(student):
            raise ValueError('This student is not enrolled in this course.')

        try:
            value = float(value)
        except (TypeError, ValueError):
            raise ValueError('Progress value must be a number.')
        if not (0 <= value <= 1):
            raise ValueError('Progress value must be between 0 and 1.')

        progress, _ = Progress.objects.update_or_create(
            student=student, activity=activity, defaults={'value': value},
        )
        return progress

    @staticmethod
    @transaction.atomic
    def set_status(user, student_id, activity_id, status):
        """
        Student self-report: not started / in progress / completed.
        Independent of `value` (the educator's grade) — never touches it, so
        a student updating this can't overwrite a grade they've already
        been given.
        """
        me = _student(user)
        if not me or me.id != int(student_id):
            raise ValueError('You can only update your own task status.')

        if status not in dict(Progress.STATUS_CHOICES):
            raise ValueError('Invalid status.')

        try:
            activity = Activity.objects.select_related('course').get(id=activity_id)
        except Activity.DoesNotExist:
            raise ValueError('Activity not found.')

        if activity.course_id not in _student_course_ids(me):
            raise ValueError('You are not enrolled in this course.')

        progress, _ = Progress.objects.update_or_create(
            student=me, activity=activity,
            defaults={
                'status': status,
                'status_updated_at': timezone.now(),
            },
        )
        return progress
