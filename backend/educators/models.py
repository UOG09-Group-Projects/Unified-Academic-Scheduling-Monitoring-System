from django.db import models
from institutions.models import User  # your user model

class Educator(models.Model):
    user        = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='educator_profile')
    edu_id      = models.CharField(max_length=50)
    name        = models.CharField(max_length=255)
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE)
    email       = models.EmailField()
    phone       = models.CharField(max_length=50, blank=True)
    photo       = models.ImageField(upload_to='educators/photos/', blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.edu_id} - {self.name}"