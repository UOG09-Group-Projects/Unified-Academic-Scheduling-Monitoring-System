import random
import string
from django.db import transaction
from django.db.models import Q
from .models import Institution, User
from .serializers import InstitutionCreateSerializer, InstitutionUpdateSerializer
from .models import ActivityLog
from .models import Institution, User, Role
from .notification_service import NotificationService
from .access import is_institution_allowed


def _generate_join_code() -> str:
    """8-char uppercase alphanumeric code, unique among institutions."""
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(alphabet, k=8))
        if not Institution.objects.filter(join_code=code).exists():
            return code


class InstitutionService:

    @staticmethod
    @transaction.atomic
    def create_institution(data: dict, logo=None, status: str = 'APPROVED', actor=None) -> Institution:

        serializer = InstitutionCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        # check duplicates (important)
        if User.objects.filter(email=validated['email']).exists():
            raise ValueError("Email already exists")

        if User.objects.filter(username=validated['username']).exists():
            raise ValueError("Username already exists")

        owner_role, _ = Role.objects.get_or_create(name='OWNER')

        user = User.objects.create(
            username=validated['username'],
            email=validated['email'],
            role=owner_role,
            is_active=True,
            is_email_verified=True,
        )
        user.set_password(validated['password'])
        user.save()

        institution = Institution.objects.create(
            name=validated['name'],
            owner=user,
            logo=logo,
            status=status,
            join_code=_generate_join_code(),
        )

        ActivityLog.objects.create(
            actor=actor,
            module='INSTITUTION',
            action='CREATE',
            description=f"Institution '{institution.name}' was created."
        )

        if status == 'PENDING':
            NotificationService.notify_super_admins(
                title='New institution registration',
                message=f"'{institution.name}' is awaiting approval.",
                link='/institutions',
            )

        return institution

    @staticmethod
    @transaction.atomic
    def set_status(institution: Institution, status: str, actor=None) -> Institution:
        valid_statuses = {choice[0] for choice in Institution.STATUS_CHOICES}
        if status not in valid_statuses:
            raise ValueError("Invalid status.")

        institution.status = status
        institution.save()

        ActivityLog.objects.create(
            actor=actor,
            module='INSTITUTION', action='UPDATE',
            description=f"Institution '{institution.name}' was {status.lower()}."
        )

        if status in ('APPROVED', 'REJECTED'):
            NotificationService.notify(
                institution.owner,
                title=f"Institution {status.lower()}",
                message=f"Your institution '{institution.name}' was {status.lower()}.",
                link='/dashboard/owner',
            )

        return institution

    @staticmethod
    @transaction.atomic
    def regenerate_join_code(institution: Institution, actor=None) -> Institution:
        institution.join_code = _generate_join_code()
        institution.save(update_fields=['join_code'])

        ActivityLog.objects.create(
            actor=actor,
            module='INSTITUTION', action='UPDATE',
            description=f"Institution '{institution.name}' join code was regenerated."
        )
        return institution

    @staticmethod
    @transaction.atomic
    def update_institution(institution: Institution, data: dict, logo=None, actor=None) -> Institution:
        """Update institution name/logo and owner credentials."""
        serializer = InstitutionUpdateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        # Update institution fields
        if 'name' in validated:
            institution.name = validated['name']
        if logo is not None:
            institution.logo = logo

        # Update owner fields
        owner = institution.owner
        if 'username' in validated:
            owner.username = validated['username']
        if 'email' in validated:
            owner.email = validated['email']
        if validated.get('password'):
            owner.set_password(validated['password'])

        owner.save()
        institution.save()
        ActivityLog.objects.create(
            actor=actor,
            module='INSTITUTION', action='UPDATE',
            description=f"Institution '{institution.name}' was updated."
        )
        return institution

    @staticmethod
    @transaction.atomic
    def soft_delete_institution(institution: Institution, actor=None):
        """
        Soft delete: mark as deleted, do NOT remove from DB.
        The owner user is also soft-deactivated (optional: you could keep them).
        """
        institution.is_deleted = True
        institution.save()
        # Optionally disable the owner too — here we just keep them
        # If you want, you could set owner.is_active = False

        ActivityLog.objects.create(
            actor=actor,
            module='INSTITUTION', action='DELETE',
            description=f"Institution '{institution.name}' was deleted."
        )

    @staticmethod
    @transaction.atomic
    def hard_delete_institution(institution: Institution, actor=None):
        """
        Hard delete: removes institution AND the owner user.
        Only use this for permanent removal (e.g. admin cleanup).
        """
        owner = institution.owner
        institution.delete()
        owner.delete()
        ActivityLog.objects.create(
        actor=actor,
        module='INSTITUTION', action='DELETE',
        description=f"Institution '{institution.name}' was deleted."
    )


class AnnouncementService:
    """
    OWNER/MANAGER broadcast tool: institution-wide (no batch_id) or scoped
    to one batch's students plus the educators teaching it. Delivery reuses
    NotificationService.notify_many — recipients see it through the same
    Notification bell / /notifications page every other notification
    already uses, no separate inbox.
    """

    @staticmethod
    @transaction.atomic
    def create_announcement(actor, data: dict):
        from .models import Announcement, Batch, Educator, Student

        title = (data.get('title') or '').strip()
        message = (data.get('message') or '').strip()
        institution_id = data.get('institution_id')
        batch_id = data.get('batch_id') or None

        if not title or not message:
            raise ValueError('Title and message are required.')
        if not institution_id:
            raise ValueError('institution_id is required.')
        if not is_institution_allowed(actor, institution_id):
            raise ValueError('You cannot send announcements for this institution.')

        batch = None
        if batch_id:
            try:
                batch = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                raise ValueError('Batch not found.')
            if str(batch.institution_id) != str(institution_id):
                raise ValueError('That batch belongs to a different institution.')

        announcement = Announcement.objects.create(
            institution_id=institution_id, batch=batch,
            title=title, message=message, created_by=actor,
        )

        students = Student.objects.filter(
            institution_id=institution_id, is_deleted=False, status='APPROVED',
        ).exclude(user=None)
        educators = Educator.objects.filter(institution_id=institution_id).exclude(user=None)

        if batch is not None:
            students = students.filter(batch_id=batch.id)
            educators = educators.filter(
                allocations__course__course_batches__batch_id=batch.id
            ).distinct()

        recipient_users = list(User.objects.filter(
            Q(id__in=students.values_list('user_id', flat=True)) |
            Q(id__in=educators.values_list('user_id', flat=True))
        ))

        NotificationService.notify_many(
            recipient_users,
            title=f"Announcement: {title}",
            message=message,
            link='/notifications',
        )

        scope_desc = f"batch '{batch.name}'" if batch else 'the whole institution'
        ActivityLog.objects.create(
            actor=actor, module='ANNOUNCEMENT', action='CREATE',
            description=(
                f"Announcement '{title}' sent to {scope_desc} "
                f"({len(recipient_users)} recipient(s))."
            ),
        )

        return announcement, len(recipient_users)

    @staticmethod
    def delete_announcement(announcement_id, actor):
        from .models import Announcement

        try:
            announcement = Announcement.objects.get(id=announcement_id)
        except Announcement.DoesNotExist:
            raise ValueError('Announcement not found.')

        if not is_institution_allowed(actor, announcement.institution_id):
            raise ValueError('You cannot delete this announcement.')

        announcement.delete()
        return True