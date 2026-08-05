"""
management/commands/seed_apiit.py

One-off seed: adds a realistic slice of demo data (batches, courses,
educators, students, guardians, enrolments) to the APIIT institution.
Safe to re-run — looks up by email/code first and skips anything that
already exists, so partial/failed runs can just be re-run.

Goes through the same service functions the real UI uses (students/services.py,
educators/services.py), so password hashing, User accounts, and activity
logs all match what a normal signup/creation would produce.
"""

from django.core.management.base import BaseCommand

from institutions.models import (
    Institution, Batch, Course, CourseBatch, Allocation, Enrolment,
    Educator, Student,
)
from students.services import StudentService
from educators.services import create_educator

SEED_PASSWORD = 'Passw0rd!'


class Command(BaseCommand):
    help = 'Seed a realistic slice of demo data into the APIIT institution.'

    def handle(self, *args, **options):
        institution = Institution.objects.get(name='APIIT')
        self.stdout.write(f'Seeding into: {institution.name} (id={institution.id})')

        batches = self._seed_batches(institution)
        courses = self._seed_courses(institution, batches)
        self._seed_educators(courses)
        students = self._seed_students(institution, batches, courses)
        self._seed_guardians(students)

        self.stdout.write(self.style.SUCCESS('Done.'))
        self.stdout.write(f'All new accounts use the password: {SEED_PASSWORD}')

    def _seed_batches(self, institution):
        names = ['Cybersecurity 2026', 'Business Management 2026']
        batches = []
        for name in names:
            batch, created = Batch.objects.get_or_create(name=name, institution=institution)
            batches.append(batch)
            self.stdout.write(f'  batch: {name} {"(created)" if created else "(exists)"}')
        return batches

    def _seed_courses(self, institution, batches):
        specs = [
            ('Data Structures & Algorithms', 'IT205', batches[0]),
            ('Software Engineering', 'IT310', batches[1]),
        ]
        courses = []
        for name, code, batch in specs:
            course, created = Course.objects.get_or_create(
                code=code, defaults={'name': name, 'institution': institution},
            )
            CourseBatch.objects.get_or_create(course=course, batch=batch)
            courses.append(course)
            self.stdout.write(f'  course: {code} - {name} {"(created)" if created else "(exists)"}')
        return courses

    def _seed_educators(self, courses):
        specs = [
            ('EDU-APIIT-01', 'J. Fernando', 'jfernando.apiit.seed@example.com', courses[0]),
            ('EDU-APIIT-02', 'S. Rajapaksa', 'srajapaksa.apiit.seed@example.com', courses[1]),
        ]
        for edu_id, name, email, course in specs:
            educator = Educator.objects.filter(email=email).first()
            if educator:
                self.stdout.write(f'  educator: {name} (exists)')
            else:
                educator = create_educator({
                    'edu_id': edu_id, 'name': name, 'email': email,
                    'phone': '0770000000', 'institution': course.institution_id,
                    'password': SEED_PASSWORD,
                })
                self.stdout.write(f'  educator: {name} (created) - {email}')
            Allocation.objects.get_or_create(course=course, educator=educator)

    def _seed_students(self, institution, batches, courses):
        specs = [
            ('Amaya Perera', 'amaya.perera.apiit.seed@example.com', batches[0], courses[0]),
            ('Kasun Silva', 'kasun.silva.apiit.seed@example.com', batches[0], courses[0]),
            ('Nadeesha Fonseka', 'nadeesha.fonseka.apiit.seed@example.com', batches[1], courses[1]),
            ('Tharindu Jayasuriya', 'tharindu.jaya.apiit.seed@example.com', batches[1], courses[1]),
            ('Ishara Wickramasinghe', 'ishara.wickrama.apiit.seed@example.com', batches[0], courses[0]),
        ]
        students = []
        for name, email, batch, course in specs:
            student = Student.objects.filter(email=email).first()
            if student:
                self.stdout.write(f'  student: {name} (exists)')
            else:
                reg_no = StudentService._next_registration_no(institution)
                student = StudentService.create_student({
                    'name': name,
                    'email': email,
                    'registration_no': reg_no,
                    'password': SEED_PASSWORD,
                    'batch_id': batch.id,
                }, notify=False)
                self.stdout.write(f'  student: {name} (created) - {email} / {reg_no}')
            Enrolment.objects.get_or_create(student=student, course=course)
            students.append(student)
        return students

    def _seed_guardians(self, students):
        specs = [
            (students[0], 'Sunil Perera', 'sunil.perera.guardian.seed@example.com'),
            (students[1], 'Chitra Silva', 'chitra.silva.guardian.seed@example.com'),
            (students[2], 'Ranjan Fonseka', 'ranjan.fonseka.guardian.seed@example.com'),
            (students[3], 'Malini Jayasuriya', 'malini.jaya.guardian.seed@example.com'),
            (students[4], 'Nalin Wickramasinghe', 'nalin.wickrama.guardian.seed@example.com'),
        ]
        for student, name, email in specs:
            guardian, created, linked = StudentService.add_guardian_for_student(student, {
                'name': name, 'email': email, 'phone': '0770000001',
                'password': SEED_PASSWORD,
            })
            self.stdout.write(f'  guardian: {name} {"(created)" if created else "(exists)"} -> {student.name}')
