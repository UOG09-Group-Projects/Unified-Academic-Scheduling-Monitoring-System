from rest_framework.response import Response
from rest_framework import status
from institutions.views import JWTView
from .services import ChatService
from .serializers import ChatMessageSerializer


class BatchChatMessagesView(JWTView):
    """
    STUDENT-only, always scoped to the caller's own batch — see
    ChatService for why no batch_id is ever taken from the client.
    """
    allowed_roles = ['STUDENT']

    def get(self, request):
        before_id = request.query_params.get('before')
        try:
            before_id = int(before_id) if before_id else None
        except (TypeError, ValueError):
            before_id = None

        batch_id, messages = ChatService.list_messages(request.current_user, before_id=before_id)
        return Response({
            'batch_id': batch_id,
            'messages': ChatMessageSerializer(messages, many=True).data,
        })

    def post(self, request):
        try:
            message = ChatService.send_message(request.current_user, request.data.get('body'))
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ChatMessageSerializer(message).data, status=status.HTTP_201_CREATED)
