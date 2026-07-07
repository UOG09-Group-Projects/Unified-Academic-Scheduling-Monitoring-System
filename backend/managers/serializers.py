from rest_framework import serializers
from .models import Manager
from institutions.models import Institution, User


class ManagerCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    institution_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Manager
        fields = [
            "id",
            "name",
            "email",
            "password",
            "institution_id",
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return value

    def validate_institution_id(self, value):
        if not Institution.objects.filter(id=value).exists():
            raise serializers.ValidationError(
                "Institution does not exist."
            )
        return value


class ManagerListSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source="user.email", read_only=True)
    institution = serializers.CharField(source="institution.name", read_only=True)

    class Meta:
        model = Manager
        fields = [
            "id",
            "name",
            "email",
            "institution",
            "created_at",
        ]