from django.db import transaction
from institutions.models import Manager
from institutions.models import Institution, User
from institutions.models import Role

class ManagerService:

    @staticmethod
    @transaction.atomic
    def create_manager(validated_data):
        """
        Creates a User account and Manager profile.
        """

        email = validated_data.pop("email")
        password = validated_data.pop("password")
        institution_id = validated_data.pop("institution_id")

        # Prevent duplicate emails
        if User.objects.filter(email=email).exists():
            raise ValueError("A user with this email already exists.")

        # Get institution
        try:
            institution = Institution.objects.get(id=institution_id)
        except Institution.DoesNotExist:
            raise ValueError("Institution does not exist.")

        # Create login user
        manager_role, _ = Role.objects.get_or_create(name='MANAGER')
        user = User(
            username=email,
            email=email,
            role=manager_role,
            is_active=True,
            is_email_verified=True,
        )
        user.set_password(password)
        user.save()

        # Create manager profile
        manager = Manager.objects.create(
            name=validated_data["name"],
            institution=institution,
            user=user
        )

        return manager

    @staticmethod
    @transaction.atomic
    def update_manager(manager, validated_data):

        if "name" in validated_data:
            manager.name = validated_data["name"]

        if "institution_id" in validated_data:
            try:
                institution = Institution.objects.get(
                    id=validated_data["institution_id"]
                )
                manager.institution = institution
            except Institution.DoesNotExist:
                raise ValueError("Institution does not exist.")

        if "email" in validated_data:
            email = validated_data["email"]

            if User.objects.filter(email=email).exclude(id=manager.user.id).exists():
                raise ValueError("Email already exists.")

            manager.user.email = email
            manager.user.username = email

        if "password" in validated_data:
            manager.user.set_password(validated_data["password"])

        manager.user.save()
        manager.save()

        return manager

    @staticmethod
    @transaction.atomic
    def delete_manager(manager):
        """
        Deletes both the manager profile and login account.
        """

        user = manager.user

        manager.delete()

        user.delete()