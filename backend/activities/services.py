from django.db import transaction
from institutions.models import Activity, Allocation, Student, StudentGuardian, Progress, Enrolment, CourseBatch


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
    @transaction.atomic
    def create(user, data):
        course_id = data.get('course_id')
        if not course_id or int(course_id) not in _educator_course_ids(user):
            raise ValueError('You can only add activities to your own courses.')

        name = (data.get('name') or '').strip()
        if not name:
            raise ValueError('Activity name is required.')

        return Activity.objects.create(
            name=name,
            course_id=course_id,
            due_date=data.get('due_date', ''),
            description=data.get('description', ''),
            optional=bool(data.get('optional', False)),
        )

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
        if 'due_date' in data:
            activity.due_date = data.get('due_date', '')
        if 'description' in data:
            activity.description = data.get('description', '')
        if 'optional' in data:
            activity.optional = bool(data.get('optional'))

        activity.save()
        return activity

    @staticmethod
    def delete(user, activity_id):
        try:
            activity = Activity.objects.get(id=activity_id)
        except Activity.DoesNotExist:
            raise ValueError('Activity not found.')
        if activity.course_id not in _educator_course_ids(user):
            raise ValueError('You can only delete activities for your own courses.')
        activity.delete()
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
