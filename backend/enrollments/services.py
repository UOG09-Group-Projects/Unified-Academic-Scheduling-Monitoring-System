from django.db import transaction
from institutions.models import Course, Enrolment, Student


def _student(user):
    try:
        return Student.objects.select_related('batch').get(user_id=user.id, is_deleted=False)
    except Student.DoesNotExist:
        return None


class EnrollmentService:

    @staticmethod
    def list_available_courses(user):
        """Every course offered by the student's institution, with enrollment state."""
        student = _student(user)
        if not student or not student.batch:
            return []

        institution_id = student.batch.institution_id
        enrolled_ids = set(
            Enrolment.objects.filter(student=student).values_list('course_id', flat=True)
        )

        courses = Course.objects.filter(
            institution_id=institution_id, is_deleted=False
        ).select_related('institution').order_by('name')

        return [
            {
                'id': c.id,
                'name': c.name,
                'code': c.code,
                'institution_name': c.institution.name,
                'is_enrolled': c.id in enrolled_ids,
            }
            for c in courses
        ]

    @staticmethod
    @transaction.atomic
    def enroll(user, course_id):
        student = _student(user)
        if not student or not student.batch:
            raise ValueError('No student profile found for this account.')
        if not course_id:
            raise ValueError('course_id is required.')

        try:
            course = Course.objects.get(id=course_id, is_deleted=False)
        except Course.DoesNotExist:
            raise ValueError('Course not found.')

        if course.institution_id != student.batch.institution_id:
            raise ValueError('This course is not offered by your institution.')

        if Enrolment.objects.filter(student=student, course=course).exists():
            raise ValueError('You are already enrolled in this course.')

        return Enrolment.objects.create(student=student, course=course)

    @staticmethod
    def unenroll(user, enrolment_id):
        student = _student(user)
        if not student:
            raise ValueError('No student profile found for this account.')

        try:
            enrolment = Enrolment.objects.get(id=enrolment_id, student=student)
        except Enrolment.DoesNotExist:
            raise ValueError('Enrollment not found.')

        enrolment.delete()
        return True
