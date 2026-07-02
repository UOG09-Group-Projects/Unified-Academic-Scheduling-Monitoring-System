from rest_framework import serializers
from .models import Batch
from institutions.models import Institution

class BatchSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(
        source='institution.name', read_only=True
    )
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = ['id', 'name', 'institution', 'institution_name', 'student_count']

    def get_student_count(self, obj):
        # Placeholder — wire up to your Students model later
        return 0