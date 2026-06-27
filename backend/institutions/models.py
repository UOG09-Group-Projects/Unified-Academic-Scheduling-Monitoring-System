from django.db import models
import uuid
import hashlib


class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    hashed_password = models.CharField(max_length=256)
    salt = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_users'

    def __str__(self):
        return self.username

    @staticmethod
    def hash_password(password: str, salt: str = None):
        """Hash a password with a salt. Returns (hashed_password, salt)."""
        if salt is None:
            salt = uuid.uuid4().hex  # 32-char random salt
        hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
        return hashed, salt

    def set_password(self, raw_password: str):
        self.hashed_password, self.salt = self.hash_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        hashed, _ = self.hash_password(raw_password, self.salt)
        return hashed == self.hashed_password


class Institution(models.Model):
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='institution_logos/', null=True, blank=True)
    owner = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='institution'
    )
    is_deleted = models.BooleanField(default=False)  # soft delete flag
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institutions'

    def __str__(self):
        return self.name