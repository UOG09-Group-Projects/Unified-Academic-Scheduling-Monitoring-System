from rest_framework.response import Response
from rest_framework import status
from institutions.views import JWTView
from .dm_services import DirectMessageService
from .dm_serializers import DirectMessageSerializer


class DmContactsView(JWTView):
    """STUDENT: educators of their courses. EDUCATOR: students of their courses."""
    allowed_roles = ['STUDENT', 'EDUCATOR']

    def get(self, request):
        return Response(DirectMessageService.list_contacts(request.current_user))


class DmMessagesView(JWTView):
    allowed_roles = ['STUDENT', 'EDUCATOR']

    def get(self, request, peer_id):
        conversation_id, messages = DirectMessageService.get_messages(request.current_user, peer_id)
        return Response({
            'conversation_id': conversation_id,
            'messages':        DirectMessageSerializer(messages, many=True).data,
        })

    def post(self, request, peer_id):
        try:
            message = DirectMessageService.send_message(
                request.current_user, peer_id, request.data.get('body')
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DirectMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class DmOversightListView(JWTView):
    """OWNER/MANAGER: read-only visibility into every conversation at their
    institution — no moderation/reply, just oversight."""
    allowed_roles = ['OWNER', 'MANAGER']

    def get(self, request):
        return Response(DirectMessageService.list_oversight_conversations(request.current_user))


class DmOversightMessagesView(JWTView):
    allowed_roles = ['OWNER', 'MANAGER']

    def get(self, request, conversation_id):
        try:
            conversation, messages = DirectMessageService.get_oversight_messages(
                request.current_user, conversation_id
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'student_name':  conversation.student.name,
            'educator_name': conversation.educator.name,
            'messages':      DirectMessageSerializer(messages, many=True).data,
        })
