from django.db import models
from django.utils import timezone
import uuid
import hashlib


# ---------------------------------------------------------------------------
# Auth / RBAC
# ---------------------------------------------------------------------------

class Module(models.Model):
    """Top-level functional area e.g. 'Course Management'."""
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'modules'

    def __str__(self):
        return self.name


class Permission(models.Model):
    """A named permission scoped to a module."""
    name    = models.CharField(max_length=50)
    modules = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name='permissions'
    )

    class Meta:
        db_table = 'permissions'

    def __str__(self):
        return self.name


class Role(models.Model):
    """
    Named role row — ADMIN, OWNER, MANAGER, EDUCATOR, STUDENT, PARENT.
    Replaces the old ROLE_CHOICES CharField on User.
    Seed with a data migration.
    """
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """Many-to-many join: roles ↔ permissions."""
    role       = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name='role_permissions'
    )
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE, related_name='role_permissions'
    )

    class Meta:
        db_table = 'roles_permissions'
        unique_together = ('role', 'permission')


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(models.Model):
    username              = models.CharField(max_length=150, unique=True)
    email                 = models.EmailField(unique=True)
    hashed_password       = models.CharField(max_length=256)
    salt                  = models.CharField(max_length=64)
    role                  = models.ForeignKey(
        Role, on_delete=models.PROTECT, related_name='users'
    )
    is_active             = models.BooleanField(default=True)
    is_email_verified     = models.BooleanField(default=True)
    email_verify_token    = models.CharField(max_length=64, null=True, blank=True)
    password_reset_token  = models.CharField(max_length=64, null=True, blank=True)
    password_reset_expiry = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'user'

    def __str__(self):
        return self.username

    @staticmethod
    def hash_password(password: str, salt: str = None):
        """Hash a password with a salt. Returns (hashed_password, salt)."""
        if salt is None:
            salt = uuid.uuid4().hex
        hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
        return hashed, salt

    def set_password(self, raw_password: str):
        self.hashed_password, self.salt = self.hash_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        hashed, _ = self.hash_password(raw_password, self.salt)
        return hashed == self.hashed_password


# ---------------------------------------------------------------------------
# Institution
# ---------------------------------------------------------------------------

class Institution(models.Model):
    name       = models.CharField(max_length=255)
    logo       = models.ImageField(upload_to='institution_logos/', null=True, blank=True)
    owner      = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_institutions'
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institutions'

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Manager
# ---------------------------------------------------------------------------

class Manager(models.Model):
    name        = models.CharField(max_length=255)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='managers'
    )
    user        = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='manager_profile'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'managers'

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Educator
# ---------------------------------------------------------------------------

class Educator(models.Model):
    user        = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='educator_profile'
    )
    edu_id      = models.CharField(max_length=50)
    name        = models.CharField(max_length=255)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='educators'
    )
    email       = models.EmailField()
    phone       = models.CharField(max_length=50, blank=True)
    photo       = models.ImageField(upload_to='educators/photos/', blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'educators'

    def __str__(self):
        return f"{self.edu_id} - {self.name}"


# ---------------------------------------------------------------------------
# Batch
# ---------------------------------------------------------------------------

class Batch(models.Model):
    name        = models.CharField(max_length=50)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='batches'
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'batches'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.institution.name}"


# ---------------------------------------------------------------------------
# Guardian
# ---------------------------------------------------------------------------

class Guardian(models.Model):
    name       = models.CharField(max_length=50)
    email      = models.EmailField(max_length=45, null=True, blank=True)
    phone      = models.CharField(max_length=20, null=True, blank=True)
    user       = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='guardian_profile'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guardians'

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------

class Student(models.Model):
    name            = models.CharField(max_length=50)
    batch           = models.ForeignKey(
        Batch,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='students'
    )
    email           = models.EmailField(max_length=45, unique=True)
    phone           = models.CharField(max_length=20, null=True, blank=True)
    registration_no = models.CharField(max_length=45, unique=True)
    user            = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='student_profile'
    )
    is_deleted      = models.BooleanField(default=False)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'

    def __str__(self):
        return f"{self.name} ({self.registration_no})"


class StudentGuardian(models.Model):
    """Many-to-many join: students ↔ guardians."""
    student  = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name='student_guardians'
    )
    guardian = models.ForeignKey(
        Guardian, on_delete=models.CASCADE, related_name='guardian_students'
    )

    class Meta:
        db_table        = 'students_guardians'
        unique_together = ('student', 'guardian')

    def __str__(self):
        return f"{self.student.name} ↔ {self.guardian.name}"


# ---------------------------------------------------------------------------
# Course, CourseBatch, Allocation
# ---------------------------------------------------------------------------

class Course(models.Model):
    name        = models.CharField(max_length=255)
    code        = models.CharField(max_length=50, unique=True)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='courses'
    )
    is_deleted  = models.BooleanField(default=False)

    class Meta:
        db_table = 'courses'

    def __str__(self):
        return f"{self.code} - {self.name}"


class CourseBatch(models.Model):
    """Join table: courses ↔ batches."""
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='course_batches'
    )
    batch  = models.ForeignKey(
        Batch, on_delete=models.CASCADE, related_name='course_batches'
    )

    class Meta:
        db_table        = 'courses_batch'
        unique_together = ('course', 'batch')


class Allocation(models.Model):
    """Which educator teaches which course."""
    course   = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='allocations'
    )
    educator = models.ForeignKey(
        Educator, on_delete=models.CASCADE, related_name='allocations'
    )

    class Meta:
        db_table        = 'allocations'
        unique_together = ('course', 'educator')


# ---------------------------------------------------------------------------
# Enrollment, Activity, Progress
# ---------------------------------------------------------------------------

class Enrollment(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(
        default=timezone.now
    )

    class Meta:
        db_table = 'enrollments'
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student} - {self.course}"


class Activity(models.Model):
    name        = models.CharField(max_length=50)
    course      = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='activities'
    )
    due_date    = models.CharField(max_length=45, blank=True)
    description = models.CharField(max_length=45, blank=True)
    optional    = models.BooleanField(default=False)

    class Meta:
        db_table = 'activities'             

    def __str__(self):
        return self.name


class Progress(models.Model):
    student  = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name='progress_records'
    )
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name='progress_records'
    )
    value    = models.DecimalField(max_digits=3, decimal_places=2)

    class Meta:
        db_table        = 'progress'
        unique_together = ('student', 'activity')


# ---------------------------------------------------------------------------
# ActivityLog
# ---------------------------------------------------------------------------

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
    ]
    MODULE_CHOICES = [
        ('INSTITUTION', 'Institution'),
        ('COURSE',      'Course'),
        ('EDUCATOR',    'Educator'),
        ('BATCH',       'Batch'),
        ('STUDENT',     'Student'),
    ]

    module      = models.CharField(max_length=20, choices=MODULE_CHOICES)
    action      = models.CharField(max_length=10, choices=ACTION_CHOICES)
    description = models.CharField(max_length=255)
    timestamp   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.module}] {self.action} — {self.description}"