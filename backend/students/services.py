from django.db import transaction
from .models import Student, Guardian, StudentGuardian
from institutions.models import User
from institutions.models import ActivityLog

class StudentService:

    @staticmethod
    @transaction.atomic
    def create_student(data, guardian_ids=None):
        # Validate unique registration_no
        if Student.objects.filter(
            registration_no=data.get('registration_no'),
            is_deleted=False
        ).exists():
            raise ValueError(
                f"Registration number '{data.get('registration_no')}' already exists."
            )

        # Validate unique email
        if Student.objects.filter(
            email=data.get('email'),
            is_deleted=False
        ).exists():
            raise ValueError(
                f"A student with email '{data.get('email')}' already exists."
            )

        # Create login user account for the student
        user = User(
            username=data.get('email'),
            email=data.get('email'),
            role='STUDENT',
        )
        user.set_password(data.get('password', data.get('registration_no')))
        user.save()

        # Create student
        student = Student.objects.create(
            name            = data.get('name'),
            email           = data.get('email'),
            phone           = data.get('phone', ''),
            registration_no = data.get('registration_no'),
            batch_id        = data.get('batch_id'),
            user            = user,
        )

        # Link guardians
        if guardian_ids:
            for guardian_id in guardian_ids:
                StudentGuardian.objects.create(
                    student_id  = student.id,
                    guardian_id = guardian_id,
                )

        ActivityLog.objects.create(
            module='STUDENT', action='CREATE',
            description=f"Student '{student.name}' was registered."
        )

        return student

    @staticmethod
    @transaction.atomic
    def update_student(student_id, data, guardian_ids=None):
        try:
            student = Student.objects.get(id=student_id, is_deleted=False)
        except Student.DoesNotExist:
            raise ValueError('Student not found.')

        # Check registration_no uniqueness (excluding current student)
        if Student.objects.filter(
            registration_no=data.get('registration_no', student.registration_no),
            is_deleted=False
        ).exclude(id=student_id).exists():
            raise ValueError('Registration number already in use.')

        # Check email uniqueness (excluding current student)
        if Student.objects.filter(
            email=data.get('email', student.email),
            is_deleted=False
        ).exclude(id=student_id).exists():
            raise ValueError('Email already in use by another student.')

        # Update fields
        student.name            = data.get('name',            student.name)
        student.email           = data.get('email',           student.email)
        student.phone           = data.get('phone',           student.phone)
        student.registration_no = data.get('registration_no', student.registration_no)
        student.batch_id        = data.get('batch_id',        student.batch_id)
        student.save()

        # Update linked user email/username too
        if student.user:
            student.user.email    = student.email
            student.user.username = student.email
            student.user.save()

        # Replace guardian links
        if guardian_ids is not None:
            StudentGuardian.objects.filter(student=student).delete()
            for guardian_id in guardian_ids:
                StudentGuardian.objects.create(
                    student_id  = student.id,
                    guardian_id = guardian_id,
                )

        ActivityLog.objects.create(
            module='STUDENT', action='UPDATE',
            description=f"Student '{student.name}' was updated."
        )

        return student

    @staticmethod
    @transaction.atomic
    def delete_student(student_id):
        try:
            student = Student.objects.get(id=student_id, is_deleted=False)
        except Student.DoesNotExist:
            raise ValueError('Student not found.')

        # Soft delete student
        student.is_deleted = True
        student.save()

        # Deactivate login account
        if student.user:
            student.user.is_active = False  # we'll add is_active to User model
            student.user.save()

        ActivityLog.objects.create(
            module='STUDENT', action='DELETE',
            description=f"Student '{student.name}' was deleted."
        )

        return True

    @staticmethod
    @transaction.atomic
    def create_guardian(data):
        # Create login user account for the guardian
        user = User(
            username = data.get('email', data.get('name')),
            email    = data.get('email', ''),
            role     = 'PARENT',
        )
        user.set_password(data.get('password', 'guardian123'))
        user.save()

        guardian = Guardian.objects.create(
            name  = data.get('name'),
            email = data.get('email', ''),
            phone = data.get('phone', ''),
            user  = user,
        )
        return guardian

    @staticmethod
    def list_guardians():
        return Guardian.objects.all().order_by('name')