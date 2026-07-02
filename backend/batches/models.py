# batches/models.py

from django.db import models
from institutions.models import Institution  # adjust import to match your app name

class Batch(models.Model):
    name = models.CharField(max_length=255)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name='batches'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.institution.name}"