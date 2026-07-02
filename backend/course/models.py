from django.db import models
from institutions.models import Institution  # adjust import path


class Course(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='courses'
    )
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.code} - {self.name}"


class CourseBatch(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='course_batches'
    )
    batch = models.ForeignKey(
        'batches.Batch', on_delete=models.CASCADE  # adjust to your Batch model path
    )

    class Meta:
        unique_together = ('course', 'batch')


class Allocation(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='allocations'
    )
    educator = models.ForeignKey(
        'educators.Educator', on_delete=models.CASCADE  # adjust to your Educator model
    )

    class Meta:
        unique_together = ('course', 'educator')