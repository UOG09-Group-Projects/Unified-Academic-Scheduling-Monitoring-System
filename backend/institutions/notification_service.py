from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from .models import Notification, NotificationPreference, User


def _push_live(recipient_id, title, message, link):
    """Ping this user's open calendar/notifications socket (if any) so their
    bell updates instantly instead of waiting for the next poll. Best-effort:
    a missing channel layer or a down socket should never break the request
    that triggered the notification."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f'notifications_user_{recipient_id}',
            {'type': 'notification_push', 'title': title, 'message': message, 'link': link},
        )
    except Exception:
        pass


class NotificationService:
    """
    Thin wrapper around Notification creation. Called from the service
    layers of features whose lifecycle events matter to other roles
    (institution approval, complaints/help, student enrolment) — see
    institutions/services.py, complaints/services.py, students/services.py,
    activities/services.py, and events/services.py for the actual trigger
    points.
    """

    @staticmethod
    def wants(user, field):
        """Whether `user` has this notification type enabled — opt-out, so a
        user who's never touched their preferences still gets notified
        (field defaults to True on the model)."""
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)
        return getattr(prefs, field)

    @staticmethod
    def notify(recipient, title, message='', link=''):
        if recipient is None:
            return None
        notification = Notification.objects.create(
            recipient=recipient, title=title, message=message, link=link,
        )
        _push_live(recipient.id, title, message, link)
        return notification

    @staticmethod
    def notify_many(recipients, title, message='', link=''):
        """Same as `notify`, for a batch of recipients — one bulk insert
        plus one live push per recipient."""
        recipients = [r for r in recipients if r is not None]
        if not recipients:
            return
        Notification.objects.bulk_create([
            Notification(recipient=user, title=title, message=message, link=link)
            for user in recipients
        ])
        for user in recipients:
            _push_live(user.id, title, message, link)

    @staticmethod
    def notify_super_admins(title, message='', link=''):
        recipients = User.objects.filter(role__name__iexact='SUPER_ADMIN', is_active=True)
        NotificationService.notify_many(recipients, title, message, link)

    @staticmethod
    def notify_institution_staff(institution_id, title, message='', link=''):
        """
        Notify everyone who administers this institution — its owner and
        all of its managers — e.g. when a student is added or a
        self-registered student needs a batch assigned.
        """
        if not institution_id:
            return
        recipients = User.objects.filter(
            Q(owned_institutions__id=institution_id) |
            Q(manager_profile__institution_id=institution_id),
            is_active=True,
        ).distinct()
        NotificationService.notify_many(recipients, title, message, link)
