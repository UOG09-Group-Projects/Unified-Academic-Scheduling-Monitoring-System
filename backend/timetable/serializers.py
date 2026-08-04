from rest_framework import serializers
from institutions.models import TimetableSlot


class TimetableSlotSerializer(serializers.ModelSerializer):
    batch_name    = serializers.CharField(source='batch.name', read_only=True)
    course_name   = serializers.CharField(source='course.name', read_only=True)
    educator_name = serializers.CharField(source='educator.name', read_only=True)
    weekday_label = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model  = TimetableSlot
        fields = [
            'id', 'batch', 'batch_name', 'course', 'course_name',
            'educator', 'educator_name', 'weekday', 'weekday_label',
            'start_time', 'end_time',
        ]
