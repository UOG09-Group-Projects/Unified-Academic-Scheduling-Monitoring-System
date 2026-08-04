from django.db import transaction
from institutions.models import User, Role
from .serializers import EducatorSerializer


@transaction.atomic
def create_educator(data):
    """
    Shared by the single-create endpoint (EducatorListCreateView.post) and
    the CSV bulk-import endpoint (EducatorBulkImportView). Institution
    permission checks stay in the caller (they need request.current_user) —
    same split as StudentService.create_student / students/views.py.
    """
    email = (data.get('email') or '').strip()
    password = data.get('password')
    institution_id = data.get('institution')

    if not email:
        raise ValueError('Email is required.')
    if not password:
        raise ValueError('Password is required.')
    if not institution_id:
        raise ValueError('Institution is required.')
    if User.objects.filter(email=email).exists():
        raise ValueError('A user with this email already exists.')

    educator_role, _ = Role.objects.get_or_create(name='EDUCATOR')
    user = User(
        username=email, email=email, role=educator_role,
        is_active=True, is_email_verified=True,
    )
    user.set_password(password)
    user.save()

    serializer = EducatorSerializer(data=data)
    if not serializer.is_valid():
        raise ValueError(
            '; '.join(f"{k}: {', '.join(str(x) for x in v)}" for k, v in serializer.errors.items())
        )

    try:
        educator = serializer.save(user=user)
    except Exception as e:
        raise ValueError(f'Failed to create educator: {e}')

    return educator
