from django.db import transaction
from institutions.models import ChatMessage, Student

MAX_BODY_LENGTH = 2000
DEFAULT_PAGE_SIZE = 50


class ChatService:
    """
    Batch group chat — every operation is scoped to *the caller's own
    batch* (resolved server-side from their Student profile, never taken
    from the client), so there's no cross-batch access to validate.
    """

    @staticmethod
    def _student_batch_id(user):
        try:
            return user.student_profile.batch_id
        except Student.DoesNotExist:
            return None

    @staticmethod
    def _sender_name(user):
        try:
            return user.student_profile.name
        except Student.DoesNotExist:
            return user.username

    @staticmethod
    def list_messages(user, before_id=None, limit=DEFAULT_PAGE_SIZE):
        """
        Returns (batch_id, messages). batch_id is None (with an empty list)
        if the student hasn't been assigned a batch yet — that's a normal
        state, not an error.
        """
        batch_id = ChatService._student_batch_id(user)
        if batch_id is None:
            return None, []

        qs = ChatMessage.objects.filter(batch_id=batch_id)
        if before_id:
            qs = qs.filter(id__lt=before_id)

        # Fetch the most recent `limit` newest-first, then reverse for
        # oldest-to-newest display order.
        messages = list(qs.order_by('-id')[:limit])
        messages.reverse()
        return batch_id, messages

    @staticmethod
    @transaction.atomic
    def send_message(user, body):
        batch_id = ChatService._student_batch_id(user)
        if batch_id is None:
            raise ValueError('You are not assigned to a batch yet.')

        body = (body or '').strip()
        if not body:
            raise ValueError('Message cannot be empty.')
        if len(body) > MAX_BODY_LENGTH:
            raise ValueError(f'Message must be {MAX_BODY_LENGTH} characters or fewer.')

        message = ChatMessage.objects.create(batch_id=batch_id, sender=user, body=body)

        from .broadcast import broadcast_chat_message
        broadcast_chat_message(batch_id, {
            'id':          message.id,
            'sender_id':   user.id,
            'sender_name': ChatService._sender_name(user),
            'body':        message.body,
            'created_at':  message.created_at.isoformat(),
        })

        return message
