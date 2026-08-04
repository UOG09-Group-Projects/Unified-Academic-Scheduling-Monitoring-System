from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_chat_message(batch_id, payload):
    """Push a new chat message to every open socket in this batch's chat
    group (see events/consumers.py::CalendarConsumer.chat_message).
    Fire-and-forget: a missing channel layer or a down socket should never
    break the request that triggered it — same shape as
    events/broadcast.py::broadcast_calendar_update."""
    if batch_id is None:
        return
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f'chat_batch_{batch_id}',
            {'type': 'chat_message', **payload},
        )
    except Exception:
        pass


def broadcast_dm_message(recipient_user_id, payload):
    """Push a new direct message to its recipient's personal notifications
    group (institutions/notification_service.py — every authenticated user
    already joins this in CalendarConsumer.connect(), so no new group is
    needed here, unlike batch chat's per-batch group)."""
    if recipient_user_id is None:
        return
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f'notifications_user_{recipient_user_id}',
            {'type': 'dm_message', **payload},
        )
    except Exception:
        pass
