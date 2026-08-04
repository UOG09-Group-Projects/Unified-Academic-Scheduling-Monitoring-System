from rest_framework import serializers
from institutions.models import DirectMessage


class DirectMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model  = DirectMessage
        fields = ['id', 'sender_id', 'sender_name', 'body', 'created_at', 'read_at']

    def get_sender_name(self, obj):
        if obj.sender is None:
            return 'Deleted user'
        for attr in ('student_profile', 'educator_profile'):
            profile = getattr(obj.sender, attr, None)
            if profile is not None:
                return profile.name
        return obj.sender.username
