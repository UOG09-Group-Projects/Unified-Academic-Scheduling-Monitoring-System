from rest_framework import serializers
from .models import Student, Guardian, StudentGuardian


class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Guardian
        fields = ['id', 'name', 'email', 'phone']


class StudentGuardianSerializer(serializers.ModelSerializer):
    guardian = GuardianSerializer(read_only=True)

    class Meta:
        model  = StudentGuardian
        fields = ['id', 'guardian']


class StudentSerializer(serializers.ModelSerializer):
    batch_name       = serializers.CharField(source='batch.name', read_only=True)
    guardians        = serializers.SerializerMethodField()
    guardian_count   = serializers.SerializerMethodField()

    class Meta:
        model  = Student
        fields = [
            'id', 'name', 'email', 'phone',
            'registration_no', 'batch', 'batch_name',
            'guardians', 'guardian_count', 'is_deleted',
        ]

    def get_guardians(self, obj):
        links = obj.student_guardians.select_related('guardian').all()
        return GuardianSerializer([l.guardian for l in links], many=True).data

    def get_guardian_count(self, obj):
        return obj.student_guardians.count()


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the table view."""
    batch_name     = serializers.CharField(source='batch.name', read_only=True)
    guardian_count = serializers.SerializerMethodField()

    class Meta:
        model  = Student
        fields = [
            'id', 'name', 'email', 'phone',
            'registration_no', 'batch', 'batch_name', 'guardian_count',
        ]

    def get_guardian_count(self, obj):
        return obj.student_guardians.count()