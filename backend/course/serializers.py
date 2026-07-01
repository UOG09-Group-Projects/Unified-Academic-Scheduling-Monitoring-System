from rest_framework import serializers
from .models import Course, CourseBatch, Allocation


class CourseBatchSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source='batch.name', read_only=True)

    class Meta:
        model = CourseBatch
        fields = ['id', 'batch', 'batch_name']


class AllocationSerializer(serializers.ModelSerializer):
    educator_name = serializers.SerializerMethodField()

    class Meta:
        model = Allocation
        fields = ['id', 'educator', 'educator_name']

    def get_educator_name(self, obj):
        return f"{obj.educator.first_name} {obj.educator.last_name}"


class CourseSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True)
    batches = CourseBatchSerializer(source='course_batches', many=True, read_only=True)
    educators = AllocationSerializer(source='allocations', many=True, read_only=True)
    batch_count = serializers.SerializerMethodField()
    educator_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'institution', 'institution_name',
            'batches', 'educators', 'batch_count', 'educator_count', 'is_deleted'
        ]

    def get_batch_count(self, obj):
        return obj.course_batches.count()

    def get_educator_count(self, obj):
        return obj.allocations.count()