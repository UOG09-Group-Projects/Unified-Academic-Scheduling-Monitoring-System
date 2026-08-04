from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_calendar_update(institution_id, update_type):
    """Ping every open calendar in this institution to refetch. Fire-and-forget:
    a missing channel layer or a down socket should never break the request
    that triggered it."""
    if institution_id is None:
        return
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f'calendar_institution_{institution_id}',
            {'type': 'calendar_update', 'update_type': update_type},
        )
    except Exception:
        pass
