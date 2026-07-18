from rest_framework import serializers
from institutions.models import Complaint


class ComplaintSubmitterSerializer(serializers.Serializer):
    id       = serializers.IntegerField()
    username = serializers.CharField()
    email    = serializers.EmailField()
    role     = serializers.CharField(source='role.name')


class ComplaintSerializer(serializers.ModelSerializer):
    submitted_by = ComplaintSubmitterSerializer()
    replied_by   = serializers.SerializerMethodField()

    class Meta:
        model  = Complaint
        fields = [
            'id', 'type', 'subject', 'message', 'status',
            'reply', 'replied_at', 'replied_by',
            'submitted_by', 'created_at', 'updated_at',
        ]

    def get_replied_by(self, obj):
        if not obj.replied_by:
            return None
        return {'id': obj.replied_by.id, 'username': obj.replied_by.username}
