from django.db import transaction
from .models import Institution, User
from .serializers import InstitutionCreateSerializer, InstitutionUpdateSerializer
from .models import ActivityLog
from .models import Institution, User, Role

class InstitutionService:

    @staticmethod
    @transaction.atomic
    def create_institution(data: dict, logo=None) -> Institution:

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
            logo=logo
        )

        ActivityLog.objects.create(
            module='INSTITUTION',
            action='CREATE',
            description=f"Institution '{institution.name}' was created."
        )

        return institution

    @staticmethod
    @transaction.atomic
    def update_institution(institution: Institution, data: dict, logo=None) -> Institution:
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
            module='INSTITUTION', action='UPDATE',
            description=f"Institution '{institution.name}' was updated."
        )
        return institution

    @staticmethod
    @transaction.atomic
    def soft_delete_institution(institution: Institution):
        """
        Soft delete: mark as deleted, do NOT remove from DB.
        The owner user is also soft-deactivated (optional: you could keep them).
        """
        institution.is_deleted = True
        institution.save()
        # Optionally disable the owner too — here we just keep them
        # If you want, you could set owner.is_active = False

    @staticmethod
    @transaction.atomic
    def hard_delete_institution(institution: Institution):
        """
        Hard delete: removes institution AND the owner user.
        Only use this for permanent removal (e.g. admin cleanup).
        """
        owner = institution.owner
        institution.delete()
        owner.delete()
        ActivityLog.objects.create(
        module='INSTITUTION', action='DELETE',
        description=f"Institution '{institution.name}' was deleted."
    )