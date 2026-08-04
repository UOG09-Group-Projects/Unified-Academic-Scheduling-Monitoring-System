import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from institutions.access import owned_institution_ids, resolve_institution_id
from institutions.jwt_utils import decode_token


class CalendarConsumer(AsyncWebsocketConsumer):
    """
    One consumer per open dashboard tab. Every authenticated user joins their
    own personal notifications group; anyone with a resolvable institution
    (student/educator) also joins that institution's calendar group. It only
    ever relays "something changed, go refetch" pings for calendar data (so
    it can't drift from the REST endpoints' own visibility/permission
    filtering) — notification pushes are the one exception, since a
    per-recipient group is already exactly as scoped as the REST endpoint.
    """

    async def connect(self):
        user = await self._authenticate()
        if user is None:
            await self.close(code=4001)
            return

        self.group_names = [f'notifications_user_{user.id}']

        institution_id = await self._resolve_institution(user)
        if institution_id is not None:
            self.group_names.append(f'calendar_institution_{institution_id}')

        batch_id = await self._resolve_batch(user)
        if batch_id is not None:
            self.group_names.append(f'chat_batch_{batch_id}')

        for group in self.group_names:
            await self.channel_layer.group_add(group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        for group in getattr(self, 'group_names', []):
            await self.channel_layer.group_discard(group, self.channel_name)

    async def calendar_update(self, event):
        await self.send(text_data=json.dumps({'type': event['update_type']}))

    async def notification_push(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'title': event['title'],
            'message': event.get('message', ''),
            'link': event.get('link', ''),
        }))

    async def chat_message(self, event):
        # Full content, not just a "go refetch" ping — same exception as
        # notification_push: the message is already scoped to exactly the
        # right audience by which chat_batch_{id} group it was published
        # to, so pushing the content directly can't drift from REST's own
        # visibility rules.
        await self.send(text_data=json.dumps({
            'type':        'chat_message',
            'id':          event['id'],
            'sender_id':   event['sender_id'],
            'sender_name': event['sender_name'],
            'body':        event['body'],
            'created_at':  event['created_at'],
        }))

    async def dm_message(self, event):
        # Same "full content, already scoped by which group it was
        # published to" case as chat_message/notification_push — this one
        # is pushed straight to the recipient's own notifications group.
        await self.send(text_data=json.dumps({
            'type':            'dm_message',
            'conversation_id': event['conversation_id'],
            'id':              event['id'],
            'sender_id':       event['sender_id'],
            'sender_peer_id':  event['sender_peer_id'],
            'sender_name':     event['sender_name'],
            'body':            event['body'],
            'created_at':      event['created_at'],
        }))

    @database_sync_to_async
    def _authenticate(self):
        from institutions.models import User

        params = parse_qs(self.scope['query_string'].decode())
        token = (params.get('token') or [None])[0]
        if not token:
            return None
        try:
            payload = decode_token(token)
        except Exception:
            return None
        if payload.get('token_type') != 'access':
            return None
        try:
            return User.objects.select_related('role').get(id=payload['user_id'])
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def _resolve_institution(self, user):
        if user.role.name.upper() == 'OWNER':
            ids = owned_institution_ids(user)
            return ids[0] if ids else None
        return resolve_institution_id(user)

    @database_sync_to_async
    def _resolve_batch(self, user):
        if user.role.name.upper() != 'STUDENT':
            return None
        from institutions.models import Student
        try:
            return user.student_profile.batch_id
        except Student.DoesNotExist:
            return None
