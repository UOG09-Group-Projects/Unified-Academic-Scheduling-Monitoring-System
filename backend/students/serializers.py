from rest_framework import serializers
from institutions.models import Student, Guardian, StudentGuardian


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
    batch_name       = serializers.SerializerMethodField()
    institution_name = serializers.SerializerMethodField()
    guardians        = serializers.SerializerMethodField()
    guardian_count   = serializers.SerializerMethodField()

    class Meta:
        model  = Student
        fields = [
            'id', 'name', 'email', 'phone',
            'registration_no', 'batch', 'batch_name',
            'institution', 'institution_name',
            'guardians', 'guardian_count', 'is_deleted',
        ]

    def get_batch_name(self, obj):
        return obj.batch.name if obj.batch else None

    def get_institution_name(self, obj):
        return obj.institution.name if obj.institution else None

    def get_guardians(self, obj):
        links = obj.student_guardians.select_related('guardian').all()
        return GuardianSerializer([l.guardian for l in links], many=True).data

    def get_guardian_count(self, obj):
        return obj.student_guardians.count()


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the table view."""
    batch_name       = serializers.SerializerMethodField()
    institution_name = serializers.SerializerMethodField()
    guardian_count   = serializers.SerializerMethodField()

    class Meta:
        model  = Student
        fields = [
            'id', 'name', 'email', 'phone',
            'registration_no', 'batch', 'batch_name',
            'institution', 'institution_name', 'guardian_count',
        ]

    def get_batch_name(self, obj):
        return obj.batch.name if obj.batch else None

    def get_institution_name(self, obj):
        return obj.institution.name if obj.institution else None

    def get_guardian_count(self, obj):
        return obj.student_guardians.count()