from django.db import models
from institutions.models import User
from batches.models import Batch


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


class Student(models.Model):
    name            = models.CharField(max_length=50)
    batch           = models.ForeignKey(
        Batch,
        on_delete=models.SET_NULL,
        null=True,
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
    student  = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='student_guardians'
    )
    guardian = models.ForeignKey(
        Guardian,
        on_delete=models.CASCADE,
        related_name='guardian_students'
    )

    class Meta:
        db_table     = 'students_guardians'
        unique_together = ('student', 'guardian')

    def __str__(self):
        return f"{self.student.name} ↔ {self.guardian.name}"