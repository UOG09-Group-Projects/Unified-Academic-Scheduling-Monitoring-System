"""
management/commands/fix_natasha_timetable.py

One-off data-sync fix: the educator natasha@gmail.com's course allocations
and timetable slots at APIIT were created directly on local dev, after the
one-time database migration to Supabase (2026-08-05), so production never
received them. This recreates the same data on whichever database it's run
against. Safe to re-run — every step is get_or_create.
"""

import datetime

from django.core.management.base import BaseCommand

from institutions.models import (
    Institution, Batch, Course, CourseBatch, Allocation, Educator, TimetableSlot,
)


class Command(BaseCommand):
    help = "Recreate natasha@gmail.com's Operating Systems / Software Engineering timetable at APIIT."

    def handle(self, *args, **options):
        institution = Institution.objects.get(name='APIIT')
        batch = Batch.objects.get(name='Technology', institution=institution)
        educator = Educator.objects.get(user__email__iexact='natasha@gmail.com')
        self.stdout.write(f'Institution: {institution.name} | Batch: {batch.name} | Educator: {educator.name}')

        os_course, created = Course.objects.get_or_create(
            code='IT189', defaults={'name': 'Operating Systems', 'institution': institution},
        )
        self.stdout.write(f'  course: {os_course.code} - {os_course.name} {"(created)" if created else "(exists)"}')

        se_course, created = Course.objects.get_or_create(
            code='IT310', defaults={'name': 'Software Engineering', 'institution': institution},
        )
        self.stdout.write(f'  course: {se_course.code} - {se_course.name} {"(created)" if created else "(exists)"}')

        for course in (os_course, se_course):
            _, created = CourseBatch.objects.get_or_create(course=course, batch=batch)
            self.stdout.write(f'  course-batch link: {course.code} <-> {batch.name} {"(created)" if created else "(exists)"}')
            _, created = Allocation.objects.get_or_create(course=course, educator=educator)
            self.stdout.write(f'  allocation: {educator.name} -> {course.code} {"(created)" if created else "(exists)"}')

        slots = [
            (os_course, 0, datetime.time(9, 30), datetime.time(12, 30)),   # Monday
            (os_course, 2, datetime.time(15, 0), datetime.time(17, 0)),    # Wednesday
            (se_course, 4, datetime.time(13, 0), datetime.time(14, 45)),   # Friday
        ]
        for course, weekday, start_time, end_time in slots:
            slot, created = TimetableSlot.objects.get_or_create(
                batch=batch, course=course, educator=educator, weekday=weekday,
                defaults={'start_time': start_time, 'end_time': end_time, 'institution': institution},
            )
            day_name = dict(TimetableSlot.WEEKDAY_CHOICES)[weekday]
            self.stdout.write(
                f'  slot: {day_name} {slot.start_time}-{slot.end_time} {course.code} '
                f'{"(created)" if created else "(exists)"}'
            )

        self.stdout.write(self.style.SUCCESS('Done.'))
