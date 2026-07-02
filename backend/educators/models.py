from django.db import models

class Educator(models.Model):
    edu_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    institution = models.ForeignKey(
        'institutions.Institution',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='educators'
    )
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    photo = models.ImageField(upload_to='educators/photos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.edu_id} - {self.name}"