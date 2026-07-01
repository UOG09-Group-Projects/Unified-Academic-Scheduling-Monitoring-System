from rest_framework import serializers
from .models import Educator

class EducatorSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True)

    class Meta:
        model = Educator
        fields = ['id', 'edu_id', 'name', 'institution', 'institution_name', 'email', 'phone', 'photo', 'created_at', 'updated_at']