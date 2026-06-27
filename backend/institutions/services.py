from django.db import transaction
from .models import Institution, User
from .serializers import InstitutionCreateSerializer, InstitutionUpdateSerializer


class InstitutionService:

    @staticmethod
    @transaction.atomic
    def create_institution(data: dict, logo=None) -> Institution:
        """
        Workflow:
        1. Validate input
        2. Create User (owner) with hashed password
        3. Create Institution with owner FK
        """
        serializer = InstitutionCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        # Step 1: Create the owner user
        user = User()
        user.username = validated['username']
        user.email = validated['email']
        user.set_password(validated['password'])  # hashes password + salt
        user.save()

        # Step 2: Create the institution
        institution = Institution()
        institution.name = validated['name']
        institution.owner = user
        if logo:
            institution.logo = logo
        institution.save()

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