from rest_framework import serializers
from institutions.models import Batch, Institution


class BatchSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(
        source='institution.name', read_only=True
    )
    student_count = serializers.SerializerMethodField()

    class Meta:
        model  = Batch
        fields = ['id', 'name', 'institution', 'institution_name', 'student_count']

    def get_student_count(self, obj):
        return obj.students.filter(is_deleted=False).count()