from datetime import datetime
from django.db import models, transaction
from institutions.models import TimetableSlot, Batch, Course, Educator, CourseBatch, Allocation, Student
from institutions.access import scoped_institution_filter, is_institution_allowed


class TimetableService:

    @staticmethod
    def _time_overlap(start1, end1, start2, end2):
        return start1 < end2 and start2 < end1

    @staticmethod
    def _find_conflicts(batch_id, educator_id, weekday, start_time, end_time, exclude_id=None):
        qs = TimetableSlot.objects.filter(weekday=weekday).filter(
            models.Q(batch_id=batch_id) | models.Q(educator_id=educator_id)
        ).select_related('batch', 'educator', 'course')
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        return [
            slot for slot in qs
            if TimetableService._time_overlap(start_time, end_time, slot.start_time, slot.end_time)
        ]

    @staticmethod
    def _conflict_message(conflicts, batch_id, educator_id):
        for slot in conflicts:
            if slot.batch_id == batch_id:
                return (
                    f"This batch already has '{slot.course.name}' with {slot.educator.name} on "
                    f"{slot.get_weekday_display()} {slot.start_time}-{slot.end_time}."
                )
        for slot in conflicts:
            if slot.educator_id == educator_id:
                return (
                    f"{slot.educator.name} already teaches '{slot.course.name}' to {slot.batch.name} on "
                    f"{slot.get_weekday_display()} {slot.start_time}-{slot.end_time}."
                )
        return 'This slot conflicts with an existing timetable entry.'

    @staticmethod
    def list_slots(user, batch_id=None):
        role = user.role.name.upper()

        if role in ('SUPER_ADMIN', 'OWNER', 'MANAGER'):
            slots = TimetableSlot.objects.filter(**scoped_institution_filter(user, field='institution_id'))
            if batch_id:
                slots = slots.filter(batch_id=batch_id)
            return slots.select_related('batch', 'course', 'educator')

        if role == 'EDUCATOR':
            try:
                educator = user.educator_profile
            except Educator.DoesNotExist:
                return TimetableSlot.objects.none()
            return TimetableSlot.objects.filter(educator=educator).select_related('batch', 'course', 'educator')

        if role == 'STUDENT':
            try:
                student = user.student_profile
            except Student.DoesNotExist:
                return TimetableSlot.objects.none()
            if not student.batch_id:
                return TimetableSlot.objects.none()
            return TimetableSlot.objects.filter(
                batch_id=student.batch_id
            ).select_related('batch', 'course', 'educator')

        return TimetableSlot.objects.none()

    @staticmethod
    def _parse_time(value):
        if isinstance(value, str):
            return datetime.strptime(value, '%H:%M').time()
        return value

    @staticmethod
    def _save_slot(actor, data, instance=None):
        def _int_or(key, fallback):
            value = data.get(key)
            if value in (None, ''):
                return fallback
            try:
                return int(value)
            except (TypeError, ValueError):
                raise ValueError(f'Invalid {key}.')

        batch_id    = _int_or('batch_id', instance.batch_id if instance else None)
        course_id   = _int_or('course_id', instance.course_id if instance else None)
        educator_id = _int_or('educator_id', instance.educator_id if instance else None)
        weekday     = _int_or('weekday', instance.weekday if instance else None)

        if None in (batch_id, course_id, educator_id, weekday):
            raise ValueError('batch_id, course_id, educator_id, and weekday are all required.')
        if weekday not in dict(TimetableSlot.WEEKDAY_CHOICES):
            raise ValueError('Invalid weekday.')

        start_time = TimetableService._parse_time(data.get('start_time')) or (instance.start_time if instance else None)
        end_time   = TimetableService._parse_time(data.get('end_time'))   or (instance.end_time if instance else None)
        if not start_time or not end_time:
            raise ValueError('start_time and end_time are required.')
        if start_time >= end_time:
            raise ValueError('Start time must be before end time.')

        try:
            batch = Batch.objects.get(id=batch_id)
        except Batch.DoesNotExist:
            raise ValueError('Batch not found.')

        if not is_institution_allowed(actor, batch.institution_id):
            raise ValueError('You cannot create timetable slots for this batch.')

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            raise ValueError('Course not found.')

        try:
            educator = Educator.objects.get(id=educator_id)
        except Educator.DoesNotExist:
            raise ValueError('Educator not found.')

        # A slot is only valid if the institution has already set up these
        # relationships — no separate "who teaches what" bookkeeping here.
        if not CourseBatch.objects.filter(course=course, batch=batch).exists():
            raise ValueError(f"'{course.name}' is not assigned to batch '{batch.name}'.")
        if not Allocation.objects.filter(course=course, educator=educator).exists():
            raise ValueError(f"{educator.name} is not allocated to teach '{course.name}'.")

        exclude_id = instance.id if instance else None
        conflicts = TimetableService._find_conflicts(batch.id, educator.id, weekday, start_time, end_time, exclude_id)
        if conflicts:
            raise ValueError(TimetableService._conflict_message(conflicts, batch.id, educator.id))

        if instance is None:
            instance = TimetableSlot()
        instance.batch          = batch
        instance.course         = course
        instance.educator       = educator
        instance.institution_id = batch.institution_id
        instance.weekday        = weekday
        instance.start_time     = start_time
        instance.end_time       = end_time
        instance.save()
        return instance

    @staticmethod
    @transaction.atomic
    def create_slot(actor, data):
        return TimetableService._save_slot(actor, data)

    @staticmethod
    @transaction.atomic
    def update_slot(actor, slot_id, data):
        try:
            instance = TimetableSlot.objects.get(id=slot_id)
        except TimetableSlot.DoesNotExist:
            raise ValueError('Timetable slot not found.')
        if not is_institution_allowed(actor, instance.institution_id):
            raise ValueError('You cannot modify this timetable slot.')
        return TimetableService._save_slot(actor, data, instance=instance)

    @staticmethod
    def delete_slot(actor, slot_id):
        try:
            instance = TimetableSlot.objects.get(id=slot_id)
        except TimetableSlot.DoesNotExist:
            raise ValueError('Timetable slot not found.')
        if not is_institution_allowed(actor, instance.institution_id):
            raise ValueError('You cannot delete this timetable slot.')
        instance.delete()
