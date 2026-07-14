from django.db import transaction
from institutions.models import ActivityLog, Course, CourseBatch, Allocation


def get_institution_id(user):
    """
    Resolve the institution the current user belongs to.
    Queries the correct profile table based on role.
    """
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


class CourseService:

    @staticmethod
    @transaction.atomic
    def create_course(data, user):
        if not user:
            raise ValueError("Authentication required")

        name = data.get('name')
        code = data.get('code')

        if not name or not code:
            raise ValueError("Name and code are required")

        institution_id = get_institution_id(user)

        if not institution_id:
            raise ValueError("No institution found for this user.")

        batch_ids    = data.get('batch_ids', [])
        educator_ids = data.get('educator_ids', [])

        if Course.objects.filter(code=code, is_deleted=False).exists():
            raise ValueError(f"Course with code '{code}' already exists.")

        course = Course.objects.create(
            name=name,
            code=code,
            institution_id=institution_id,
        )

        for batch_id in batch_ids:
            CourseBatch.objects.create(course=course, batch_id=batch_id)

        for educator_id in educator_ids:
            Allocation.objects.create(course=course, educator_id=educator_id)

        ActivityLog.objects.create(
            module='COURSE',
            action='CREATE',
            description=f"Course '{course.name} ({course.code})' was created.",
        )

        return course

    @staticmethod
    @transaction.atomic
    def update_course(course_id, data, user):
        if not user:
            raise ValueError("Authentication required")

        try:
            course = Course.objects.get(id=course_id, is_deleted=False)
        except Course.DoesNotExist:
            raise ValueError("Course not found.")

        name = data.get('name')
        code = data.get('code')

        if name:
            course.name = name
        if code:
            course.code = code

        course.save()

        batch_ids = data.get('batch_ids', [])
        CourseBatch.objects.filter(course=course).delete()
        for batch_id in batch_ids:
            CourseBatch.objects.create(course=course, batch_id=batch_id)

        educator_ids = data.get('educator_ids', [])
        Allocation.objects.filter(course=course).delete()
        for educator_id in educator_ids:
            Allocation.objects.create(course=course, educator_id=educator_id)

        ActivityLog.objects.create(
            module='COURSE',
            action='UPDATE',
            description=f"Course '{course.name} ({course.code})' was updated.",
        )

        return course

    @staticmethod
    @transaction.atomic
    def delete_course(course_id):
        try:
            course = Course.objects.get(id=course_id, is_deleted=False)
        except Course.DoesNotExist:
            raise ValueError("Course not found.")

        CourseBatch.objects.filter(course=course).delete()
        Allocation.objects.filter(course=course).delete()

        course.is_deleted = True
        course.save()

        ActivityLog.objects.create(
            module='COURSE',
            action='DELETE',
            description=f"Course '{course.name}' was deleted.",
        )

        return True