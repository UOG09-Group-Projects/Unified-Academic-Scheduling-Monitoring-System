from django.db import transaction
from django.utils import timezone
from institutions.models import (
    Conversation, DirectMessage, Student, Educator, Allocation, Enrolment, CourseBatch,
)
from institutions.access import scoped_institution_filter, is_institution_allowed

MAX_BODY_LENGTH = 2000


class DirectMessageService:
    """
    Student <-> educator 1:1 messaging, scoped to students/educators who
    share a course. The course-id helpers below are local, deliberate
    copies rather than cross-app imports — this codebase's existing
    convention (see activities/services.py::_educator_course_ids /
    _student_course_ids, events/services.py::_own_course_ids /
    _enrolled_course_ids): each app keeps its own small copy.
    """

    @staticmethod
    def _educator_course_ids(educator):
        return list(Allocation.objects.filter(educator=educator).values_list('course_id', flat=True))

    @staticmethod
    def _student_course_ids(student):
        if not student.batch_id:
            return list(Enrolment.objects.filter(student=student).values_list('course_id', flat=True))
        batch_ids = set(student.batch.course_batches.values_list('course_id', flat=True))
        enrolled_ids = set(Enrolment.objects.filter(student=student).values_list('course_id', flat=True))
        return list(batch_ids | enrolled_ids)

    @staticmethod
    def _shares_course(student, educator):
        return bool(
            set(DirectMessageService._student_course_ids(student))
            & set(DirectMessageService._educator_course_ids(educator))
        )

    @staticmethod
    def _actor_profile(user):
        """Returns ('STUDENT'|'EDUCATOR', profile) or (None, None)."""
        role = user.role.name.upper()
        if role == 'STUDENT':
            try:
                return 'STUDENT', user.student_profile
            except Student.DoesNotExist:
                return None, None
        if role == 'EDUCATOR':
            try:
                return 'EDUCATOR', user.educator_profile
            except Educator.DoesNotExist:
                return None, None
        return None, None

    @staticmethod
    def _sort_by_recency(rows):
        rows.sort(key=lambda r: (
            r['last_message_at'] is None,
            -(r['last_message_at'].timestamp() if r['last_message_at'] else 0),
        ))
        return rows

    @staticmethod
    def list_contacts(user):
        role, profile = DirectMessageService._actor_profile(user)
        if profile is None:
            return []

        if role == 'STUDENT':
            course_ids = DirectMessageService._student_course_ids(profile)
            if not course_ids:
                return []
            peer_ids = Allocation.objects.filter(
                course_id__in=course_ids
            ).values_list('educator_id', flat=True).distinct()
            peers = Educator.objects.filter(id__in=peer_ids).order_by('name')
            existing = {c.educator_id: c for c in Conversation.objects.filter(student=profile)}
        else:  # EDUCATOR
            course_ids = DirectMessageService._educator_course_ids(profile)
            if not course_ids:
                return []
            batch_ids = CourseBatch.objects.filter(course_id__in=course_ids).values_list('batch_id', flat=True)
            batch_student_ids = set(
                Student.objects.filter(batch_id__in=batch_ids, is_deleted=False).values_list('id', flat=True)
            )
            enrolled_ids = set(
                Enrolment.objects.filter(course_id__in=course_ids).values_list('student_id', flat=True)
            )
            peers = Student.objects.filter(
                id__in=(batch_student_ids | enrolled_ids), is_deleted=False
            ).order_by('name')
            existing = {c.student_id: c for c in Conversation.objects.filter(educator=profile)}

        contacts = []
        for peer in peers:
            conv = existing.get(peer.id)
            last_message, last_message_at, unread_count = None, None, 0
            if conv:
                last = conv.messages.order_by('-id').first()
                if last:
                    last_message, last_message_at = last.body, last.created_at
                unread_count = conv.messages.filter(read_at__isnull=True).exclude(sender=user).count()
            contacts.append({
                'peer_id':          peer.id,
                'peer_name':        peer.name,
                'conversation_id':  conv.id if conv else None,
                'last_message':     last_message,
                'last_message_at':  last_message_at,
                'unread_count':     unread_count,
            })

        return DirectMessageService._sort_by_recency(contacts)

    @staticmethod
    @transaction.atomic
    def get_messages(user, peer_id):
        """Returns (conversation_id, messages). conversation_id is None
        (with an empty list) if no conversation exists yet — that's normal,
        not an error, and viewing it doesn't create one."""
        role, profile = DirectMessageService._actor_profile(user)
        if profile is None:
            return None, []

        if role == 'STUDENT':
            conv = Conversation.objects.filter(student=profile, educator_id=peer_id).first()
        else:
            conv = Conversation.objects.filter(educator=profile, student_id=peer_id).first()

        if conv is None:
            return None, []

        DirectMessage.objects.filter(
            conversation=conv, read_at__isnull=True
        ).exclude(sender=user).update(read_at=timezone.now())

        return conv.id, list(conv.messages.all())

    @staticmethod
    @transaction.atomic
    def send_message(user, peer_id, body):
        role, profile = DirectMessageService._actor_profile(user)
        if profile is None:
            raise ValueError('Only students and educators can send direct messages.')

        body = (body or '').strip()
        if not body:
            raise ValueError('Message cannot be empty.')
        if len(body) > MAX_BODY_LENGTH:
            raise ValueError(f'Message must be {MAX_BODY_LENGTH} characters or fewer.')

        if role == 'STUDENT':
            student = profile
            try:
                educator = Educator.objects.get(id=peer_id)
            except Educator.DoesNotExist:
                raise ValueError('Educator not found.')
        else:
            educator = profile
            try:
                student = Student.objects.get(id=peer_id, is_deleted=False)
            except Student.DoesNotExist:
                raise ValueError('Student not found.')

        conversation = Conversation.objects.filter(student=student, educator=educator).first()
        if conversation is None:
            # Only validated on first contact — an existing thread can keep
            # going even if course assignments change later, so a student
            # doesn't lose the ability to reply mid-conversation.
            if not DirectMessageService._shares_course(student, educator):
                raise ValueError('You can only message educators or students who share a course with you.')
            conversation = Conversation.objects.create(
                student=student, educator=educator, institution_id=student.institution_id,
            )

        message = DirectMessage.objects.create(conversation=conversation, sender=user, body=body)

        recipient_user_id = educator.user_id if role == 'STUDENT' else student.user_id
        if recipient_user_id:
            from .broadcast import broadcast_dm_message
            broadcast_dm_message(recipient_user_id, {
                'conversation_id': conversation.id,
                'id':              message.id,
                'sender_id':       user.id,
                # The sender's *profile* id (Student.id or Educator.id) —
                # the id space the recipient's own contact list is keyed
                # by, which is not the same as sender_id (a User pk).
                'sender_peer_id':  student.id if role == 'STUDENT' else educator.id,
                'sender_name':     profile.name,
                'body':            message.body,
                'created_at':      message.created_at.isoformat(),
            })

        return message

    @staticmethod
    def list_oversight_conversations(actor):
        conversations = Conversation.objects.select_related('student', 'educator').filter(
            **scoped_institution_filter(actor, field='institution_id')
        )
        results = []
        for conv in conversations:
            last = conv.messages.order_by('-id').first()
            results.append({
                'id':              conv.id,
                'student_id':      conv.student_id,
                'student_name':    conv.student.name,
                'educator_id':     conv.educator_id,
                'educator_name':   conv.educator.name,
                'last_message':    last.body if last else None,
                'last_message_at': last.created_at if last else None,
            })
        return DirectMessageService._sort_by_recency(results)

    @staticmethod
    def get_oversight_messages(actor, conversation_id):
        try:
            conv = Conversation.objects.select_related('student', 'educator').get(id=conversation_id)
        except Conversation.DoesNotExist:
            raise ValueError('Conversation not found.')

        if not is_institution_allowed(actor, conv.institution_id):
            raise ValueError('You cannot view this conversation.')

        return conv, list(conv.messages.all())
