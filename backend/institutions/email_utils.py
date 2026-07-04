import uuid
import datetime
from django.core.mail import send_mail
from django.conf import settings


def generate_token():
    return uuid.uuid4().hex + uuid.uuid4().hex  # 64-char token


def send_verification_email(user):
    """Send email verification link to a newly created user."""
    token = generate_token()
    user.email_verify_token = token
    user.save()

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    send_mail(
        subject='Verify your Academic Scheduler account',
        message=f"""
Hi {user.username},

Your account has been created. Please verify your email to activate it.

Click the link below to verify your email:
{verify_url}

This link does not expire.

If you did not expect this email, please ignore it.

— Academic Scheduler Team
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return token


def send_password_reset_email(user):
    """Send password reset link to user."""
    token = generate_token()
    expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)

    user.password_reset_token  = token
    user.password_reset_expiry = expiry
    user.save()

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    send_mail(
        subject='Reset your Academic Scheduler password',
        message=f"""
Hi {user.username},

We received a request to reset your password.

Click the link below to set a new password (expires in 1 hour):
{reset_url}

If you did not request a password reset, please ignore this email.

— Academic Scheduler Team
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return token