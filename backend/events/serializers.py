from rest_framework import serializers
from institutions.models import Event


class EventCourseSerializer(serializers.Serializer):
    id   = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField()


class EventCreatorSerializer(serializers.Serializer):
    id   = serializers.IntegerField()
    name = serializers.SerializerMethodField()
    role = serializers.CharField(source='role.name')

    def get_name(self, obj):
        return getattr(obj, 'username', None) or obj.email


class EventSerializer(serializers.ModelSerializer):
    course     = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    can_edit   = serializers.SerializerMethodField()

    class Meta:
        model  = Event
        fields = [
            'id', 'title', 'description', 'event_type',
            'start', 'end', 'all_day',
            'course', 'created_by', 'can_edit',
            'created_at', 'updated_at',
        ]

    def get_course(self, obj):
        if not obj.course:
            return None
        return {'id': obj.course.id, 'name': obj.course.name, 'code': obj.course.code}

    def get_created_by(self, obj):
        return {
            'id':   obj.created_by.id,
            'name': obj.created_by.username,
            'role': obj.created_by.role.name,
        }

    def get_can_edit(self, obj):
        request = self.context.get('request')
        return bool(request and request.current_user.id == obj.created_by_id)
