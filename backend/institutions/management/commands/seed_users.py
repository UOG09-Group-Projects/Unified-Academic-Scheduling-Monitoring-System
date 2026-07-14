from django.core.management.base import BaseCommand
from institutions.models import User, Role

USERS = [
    {
        "username": "Shakya",
        "email": "owner@lightlearn.com",
        "password": "Owner@123",
        "role": "owner",
    },
    {
        "username": "Savinthi",
        "email": "admin@lightlearn.com",
        "password": "Admin@123",
        "role": "admin",
    },
    {
        "username": "Senara",
        "email": "manager@lightlearn.com",
        "password": "Manager@123",
        "role": "manager",
    },
    {
        "username": "Janani",
        "email": "educator@lightlearn.com",
        "password": "Educator@123",
        "role": "educator",
    },
    {
        "username": "Vichali",
        "email": "student@lightlearn.com",
        "password": "Student@123",
        "role": "student",
    },
    {
        "username": "Thimali",
        "email": "parent@lightlearn.com",
        "password": "Parent@123",
        "role": "parent",
    },
]


class Command(BaseCommand):
    help = "Seed default users"

    def handle(self, *args, **kwargs):

        for u in USERS:

            role = Role.objects.get(name=u["role"])

            if User.objects.filter(email=u["email"]).exists():
                self.stdout.write(f'{u["email"]} already exists')
                continue

            user = User(
                username=u["username"],
                email=u["email"],
                role=role,
                is_active=True,
                is_email_verified=True,
            )

            user.set_password(u["password"])
            user.save()

            self.stdout.write(f'Created {u["email"]}')

        self.stdout.write(self.style.SUCCESS("Users seeded successfully."))