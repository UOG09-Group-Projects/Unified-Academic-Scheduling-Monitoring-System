from institutions.models import ActivityLog

from .models import Course, CourseBatch, Allocation
from django.db import transaction


class CourseService:

    @staticmethod
    @transaction.atomic
    def create_course(data):
        name = data.get('name')
        code = data.get('code')
        institution_id = data.get('institution')
        batch_ids = data.get('batch_ids', [])
        educator_ids = data.get('educator_ids', [])

        if Course.objects.filter(code=code, is_deleted=False).exists():
            raise ValueError(f"Course with code '{code}' already exists.")

        course = Course.objects.create(
            name=name,
            code=code,
            institution_id=institution_id
        )

        for batch_id in batch_ids:
            CourseBatch.objects.create(course=course, batch_id=batch_id)

        for educator_id in educator_ids:
            Allocation.objects.create(course=course, educator_id=educator_id)

        ActivityLog.objects.create(
        module='COURSE', action='CREATE',
        description=f"Course '{course.name} ({course.code})' was created."
    )

        return course

    @staticmethod
    @transaction.atomic
    def update_course(course_id, data):
        try:
            course = Course.objects.get(id=course_id, is_deleted=False)
        except Course.DoesNotExist:
            raise ValueError("Course not found.")

        course.name = data.get('name', course.name)
        course.code = data.get('code', course.code)
        course.institution_id = data.get('institution', course.institution_id)
        course.save()

        # Replace batches
        batch_ids = data.get('batch_ids', [])
        CourseBatch.objects.filter(course=course).delete()
        for batch_id in batch_ids:
            CourseBatch.objects.create(course=course, batch_id=batch_id)

        # Replace educators
        educator_ids = data.get('educator_ids', [])
        Allocation.objects.filter(course=course).delete()
        for educator_id in educator_ids:
            Allocation.objects.create(course=course, educator_id=educator_id)

        ActivityLog.objects.create(
        module='COURSE', action='UPDATE',
        description=f"Course '{course.name} ({course.code})' was updated."
    )
        return course

    @staticmethod
    @transaction.atomic
    def delete_course(course_id):
        try:
            course = Course.objects.get(id=course_id, is_deleted=False)
        except Course.DoesNotExist:
            raise ValueError("Course not found.")

        # Hard delete related records
        CourseBatch.objects.filter(course=course).delete()
        Allocation.objects.filter(course=course).delete()

        # Soft delete course
        course.is_deleted = True
        course.save()

        ActivityLog.objects.create(
            module='COURSE', action='DELETE',
            description=f"Course '{course.name}' was deleted."
        )

        return True