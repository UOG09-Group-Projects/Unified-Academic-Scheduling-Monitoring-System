from rest_framework import serializers
from institutions.models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model  = ChatMessage
        fields = ['id', 'sender_id', 'sender_name', 'body', 'created_at']

    def get_sender_name(self, obj):
        if obj.sender is None:
            return 'Deleted user'
        try:
            return obj.sender.student_profile.name
        except Exception:
            return obj.sender.username
