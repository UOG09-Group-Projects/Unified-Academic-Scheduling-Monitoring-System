from django.db import models
from institutions.models import Institution, User
class Manager(models.Model):
    name = models.CharField(max_length=255)

    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name="managers"
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="manager_profile"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "managers"

    def __str__(self):
        return self.name
