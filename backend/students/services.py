import datetime
from django.db import transaction
from institutions.models import Student, Guardian, StudentGuardian
from institutions.models import User
from institutions.models import ActivityLog
from institutions.models import Role
from institutions.models import Institution
from institutions.notification_service import NotificationService
from institutions.access import is_institution_allowed
from institutions.email_utils import send_otp_email, OTP_RESEND_SECONDS

class StudentService:

    @staticmethod
    def _next_registration_no(institution):
        """
        <SHORT_NAME>-0001, incrementing per institution (e.g. "SLIIT-0007").
        Called with the institution row already locked by the caller
        (select_for_update), so the count-then-check below can't race with
        another concurrent signup at the same institution.
        """
        prefix = institution.short_name
        seq = Student.objects.filter(institution=institution).count() + 1
        registration_no = f"{prefix}-{seq:04d}"
        while Student.objects.filter(registration_no=registration_no).exists():
            seq += 1
            registration_no = f"{prefix}-{seq:04d}"
        return registration_no

    @staticmethod
    @transaction.atomic
    def register_student(data):
        """
        Self-service signup: a prospective student creates their own login
        account, proving institution membership with a join code (issued by
        that institution's OWNER/MANAGER) instead of freely picking from a
        list. The account can't log in yet — it must clear email OTP
        verification (see verify_student_otp) and then institution approval
        (see approve_student) first. No batch yet either — a manager assigns
        one after approval.
        """
        name       = (data.get('name') or '').strip()
        email      = (data.get('email') or '').strip().lower()
        password   = data.get('password') or ''
        join_code  = (data.get('join_code') or '').strip().upper()

        if not all([name, email, password, join_code]):
            raise ValueError('name, email, password, and join_code are all required.')

        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters.')

        try:
            # Locks the institution row for the duration of this transaction
            # so two concurrent signups against the same institution can't
            # compute the same next sequence number (see
            # _next_registration_no below).
            institution = Institution.objects.select_for_update().get(
                join_code=join_code, is_deleted=False
            )
        except Institution.DoesNotExist:
            raise ValueError('Invalid institution join code.')

        if User.objects.filter(email=email).exists():
            raise ValueError('An account with this email already exists.')
        if Student.objects.filter(email=email, is_deleted=False).exists():
            raise ValueError('A student with this email already exists.')

        student_role, _ = Role.objects.get_or_create(name='STUDENT')
        user = User(
            username=email,
            email=email,
            role=student_role,
            is_active=True,
            is_email_verified=False,
        )
        user.set_password(password)
        user.save()

        registration_no = StudentService._next_registration_no(institution)

        student = Student.objects.create(
            name=name,
            email=email,
            registration_no=registration_no,
            institution=institution,
            user=user,
            status='PENDING',
        )

        ActivityLog.objects.create(
            module='STUDENT', action='CREATE',
            description=f"Student '{student.name}' self-registered at {institution.name}."
        )

        send_otp_email(user)

        return student, user

    @staticmethod
    @transaction.atomic
    def verify_student_otp(email, code):
        email = (email or '').strip().lower()
        code  = (code or '').strip()

        try:
            user = User.objects.select_related('role').get(email=email)
        except User.DoesNotExist:
            raise ValueError('No account found for this email.')

        if user.is_email_verified:
            raise ValueError('This email is already verified.')

        # Configurable via the SUPER_ADMIN settings page — see
        # institutions/models.py::PlatformSettings. OTP_MAX_ATTEMPTS (email_utils.py)
        # is only the model default.
        from institutions.models import PlatformSettings
        max_attempts = PlatformSettings.load().otp_max_attempts

        if user.otp_attempts >= max_attempts:
            raise ValueError('Too many incorrect attempts. Please request a new code.')

        now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
        if not user.otp_code or not user.otp_expiry or now > user.otp_expiry:
            raise ValueError('Code has expired. Please request a new one.')

        if code != user.otp_code:
            user.otp_attempts += 1
            user.save(update_fields=['otp_attempts'])
            remaining = max_attempts - user.otp_attempts
            raise ValueError(f'Incorrect code. {max(remaining, 0)} attempt(s) remaining.')

        user.is_email_verified = True
        user.otp_code     = None
        user.otp_expiry   = None
        user.otp_sent_at  = None
        user.otp_attempts = 0
        user.save()

        try:
            student = user.student_profile
        except Student.DoesNotExist:
            student = None

        if student and student.institution_id:
            NotificationService.notify_institution_staff(
                student.institution_id,
                title='Student awaiting approval',
                message=f"'{student.name}' verified their email and is awaiting approval to join {student.institution.name}.",
                link='/students',
            )

        return user

    @staticmethod
    def resend_student_otp(email):
        email = (email or '').strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValueError('No account found for this email.')

        if user.is_email_verified:
            raise ValueError('This email is already verified.')

        if user.otp_sent_at:
            now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
            elapsed = (now - user.otp_sent_at).total_seconds()
            if elapsed < OTP_RESEND_SECONDS:
                wait = int(OTP_RESEND_SECONDS - elapsed)
                raise ValueError(f'Please wait {wait}s before requesting another code.')

        send_otp_email(user)

    @staticmethod
    @transaction.atomic
    def approve_student(student_id, actor, batch_id=None):
        """
        batch_id is optional — a manager can assign the batch right here
        while approving, or leave it for later via the regular student edit
        form (StudentDetailView). Either way, approval doesn't require one.
        """
        try:
            student = Student.objects.select_related('user', 'institution').get(
                id=student_id, is_deleted=False
            )
        except Student.DoesNotExist:
            raise ValueError('Student not found.')

        if not is_institution_allowed(actor, student.institution_id):
            raise ValueError('You cannot approve students for this institution.')

        update_fields = ['status']
        student.status = 'APPROVED'

        if batch_id:
            from institutions.models import Batch
            try:
                batch = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                raise ValueError('Batch not found.')
            if batch.institution_id != student.institution_id:
                raise ValueError('That batch belongs to a different institution.')
            student.batch = batch
            update_fields.append('batch')

        student.save(update_fields=update_fields)

        if student.user:
            NotificationService.notify(
                student.user,
                title='Account approved',
                message=f"Your account has been approved by {student.institution.name}. You can now log in.",
                link='/login',
            )

        ActivityLog.objects.create(
            actor=actor, module='STUDENT', action='UPDATE',
            description=f"Student '{student.name}' was approved."
        )

        return student

    @staticmethod
    @transaction.atomic
    def reject_student(student_id, actor):
        try:
            student = Student.objects.select_related('user', 'institution').get(
                id=student_id, is_deleted=False
            )
        except Student.DoesNotExist:
            raise ValueError('Student not found.')

        if not is_institution_allowed(actor, student.institution_id):
            raise ValueError('You cannot reject students for this institution.')

        student.status = 'REJECTED'
        student.save(update_fields=['status'])

        if student.user:
            NotificationService.notify(
                student.user,
                title='Account rejected',
                message=f"Your registration with {student.institution.name} was rejected. Contact them for details.",
            )

        ActivityLog.objects.create(
            actor=actor, module='STUDENT', action='UPDATE',
            description=f"Student '{student.name}' was rejected."
        )

        return student

    @staticmethod
    def list_guardians_for_student(student):
        return [
            link.guardian
            for link in StudentGuardian.objects
                .filter(student=student)
                .select_related('guardian')
        ]

    @staticmethod
    @transaction.atomic
    def add_guardian_for_student(student, data):
        """
        Self-service: a student adds a guardian's details from their own
        dashboard. If a guardian with this email already exists (e.g. a
        sibling already added them), we link the existing record instead
        of creating a duplicate — that's what makes both siblings show up
        on the same parent dashboard.
        """
        name  = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        phone = (data.get('phone') or '').strip()

        if not name or not email:
            raise ValueError('Guardian name and email are required.')

        guardian = Guardian.objects.filter(email__iexact=email).first()

        if guardian is None:
            password = data.get('password') or ''
            if len(password) < 8:
                raise ValueError(
                    "This guardian doesn't have an account yet — a password "
                    "(min 8 characters) is required to create one."
                )

            parent_role, _ = Role.objects.get_or_create(name='PARENT')
            user = User(
                username=email,
                email=email,
                role=parent_role,
                is_active=True,
                is_email_verified=True,
            )
            user.set_password(password)
            user.save()

            guardian = Guardian.objects.create(
                name=name, email=email, phone=phone, user=user,
            )
            created = True
        else:
            created = False

        _, linked = StudentGuardian.objects.get_or_create(
            student=student, guardian=guardian,
        )

        ActivityLog.objects.create(
            module='STUDENT', action='UPDATE',
            description=f"Guardian '{guardian.name}' linked to student '{student.name}'."
        )

        return guardian, created, linked

    @staticmethod
    @transaction.atomic
    def create_student(data, guardian_ids=None, notify=True):
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

        # The login account's email/username must also be globally unique
        # (User.email has a DB-level unique constraint) — without this
        # check, an email that collides with some other, non-student
        # account (e.g. a manager who happens to share it) would pass the
        # check above and then blow up with an uncaught IntegrityError on
        # user.save() below instead of a clean, catchable error.
        if User.objects.filter(email=data.get('email')).exists():
            raise ValueError(
                f"An account with email '{data.get('email')}' already exists."
            )

        # Create login user account for the student
        student_role, _ = Role.objects.get_or_create(name='STUDENT')
        user = User(
            username=data.get('email'),
            email=data.get('email'),
            role=student_role,
            is_active=True,
            is_email_verified=True,
        )
        user.set_password(data.get('password', data.get('registration_no')))
        user.save()

        # Keep institution in sync with the assigned batch, so every
        # student (regardless of creation path) can be scoped by
        # institution_id directly, without a batch join.
        batch_id = data.get('batch_id')
        institution_id = data.get('institution_id')
        if batch_id and not institution_id:
            from institutions.models import Batch
            institution_id = Batch.objects.filter(id=batch_id).values_list('institution_id', flat=True).first()

        # Create student
        student = Student.objects.create(
            name            = data.get('name'),
            email           = data.get('email'),
            phone           = data.get('phone', ''),
            registration_no = data.get('registration_no'),
            batch_id        = batch_id,
            institution_id  = institution_id,
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

        if notify:
            NotificationService.notify_institution_staff(
                institution_id,
                title='Student added',
                message=f"'{student.name}' was added as a student.",
                link='/students',
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

        new_batch_id = data.get('batch_id', student.batch_id)
        if new_batch_id != student.batch_id:
            from institutions.models import Batch
            student.institution_id = Batch.objects.filter(
                id=new_batch_id
            ).values_list('institution_id', flat=True).first()
        student.batch_id = new_batch_id
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
        # create_guardian — fix
        parent_role, _ = Role.objects.get_or_create(name='PARENT')
        user = User(
            username=data.get('email', data.get('name')),
            email=data.get('email', ''),
            role=parent_role,
            is_active=True,
            is_email_verified=True,
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