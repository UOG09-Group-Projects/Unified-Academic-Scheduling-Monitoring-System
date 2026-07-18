from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from institutions.models import Complaint

TYPE_VALUES   = {c[0] for c in Complaint.TYPE_CHOICES}
STATUS_VALUES = {c[0] for c in Complaint.STATUS_CHOICES}


class ComplaintService:

    @staticmethod
    def list_for_user(user):
        return Complaint.objects.filter(submitted_by=user).select_related(
            'submitted_by', 'submitted_by__role', 'replied_by'
        )

    @staticmethod
    def list_all(status=None, type=None):
        complaints = Complaint.objects.select_related(
            'submitted_by', 'submitted_by__role', 'replied_by'
        )
        if status:
            complaints = complaints.filter(status=status.upper())
        if type:
            complaints = complaints.filter(type=type.upper())
        return complaints

    @staticmethod
    def stats():
        counts = dict(
            Complaint.objects.values_list('status').annotate(count=Count('id'))
        )
        return {
            'open':        counts.get('OPEN', 0),
            'in_progress': counts.get('IN_PROGRESS', 0),
            'resolved':    counts.get('RESOLVED', 0),
            'total':       sum(counts.values()),
        }

    @staticmethod
    @transaction.atomic
    def create(data, user):
        complaint_type = (data.get('type') or 'HELP').upper()
        if complaint_type not in TYPE_VALUES:
            raise ValueError("Invalid message type.")

        subject = (data.get('subject') or '').strip()
        message = (data.get('message') or '').strip()
        if not subject or not message:
            raise ValueError("Subject and message are required.")

        return Complaint.objects.create(
            type=complaint_type,
            subject=subject,
            message=message,
            submitted_by=user,
        )

    @staticmethod
    @transaction.atomic
    def respond(complaint, data, user):
        if 'status' in data and data.get('status'):
            status = data['status'].upper()
            if status not in STATUS_VALUES:
                raise ValueError("Invalid status.")
            complaint.status = status

        if 'reply' in data:
            reply = (data.get('reply') or '').strip()
            complaint.reply = reply
            if reply:
                complaint.replied_by = user
                complaint.replied_at = timezone.now()

        complaint.save()
        return complaint
