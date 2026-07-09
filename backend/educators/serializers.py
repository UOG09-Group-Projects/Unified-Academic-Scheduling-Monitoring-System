from rest_framework import serializers
from institutions.models import Educator


class EducatorSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True)
    password         = serializers.CharField(write_only=True, required=False)
    user_email       = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model  = Educator
        fields = [
            'id', 'edu_id', 'name', 'institution', 'institution_name',
            'email', 'phone', 'photo', 'password', 'user_email',
            'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        validated_data.pop('password', None)
        return Educator.objects.create(**validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('password', None)
        return super().update(instance, validated_data)