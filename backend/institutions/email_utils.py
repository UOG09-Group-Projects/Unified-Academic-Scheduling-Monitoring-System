import secrets
import uuid
import datetime
from django.core.mail import send_mail, EmailMessage
from django.conf import settings

OTP_VALID_MINUTES  = 10
OTP_RESEND_SECONDS = 60
OTP_MAX_ATTEMPTS   = 5


def generate_token():
    return uuid.uuid4().hex + uuid.uuid4().hex  # 64-char token


def send_otp_email(user):
    """
    Generate a 6-digit OTP for student signup email verification, store it
    on the user with an expiry, and email it. Resets the attempt counter
    (used to lock out repeated wrong guesses).
    """
    code = f"{secrets.randbelow(1_000_000):06d}"
    now  = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)

    user.otp_code     = code
    user.otp_expiry   = now + datetime.timedelta(minutes=OTP_VALID_MINUTES)
    user.otp_sent_at  = now
    user.otp_attempts = 0
    user.save()

    send_mail(
        subject='Your LightLearn verification code',
        message=f"""
Hi {user.username},

Your verification code is: {code}

Enter this code to verify your email. It expires in {OTP_VALID_MINUTES} minutes.

If you did not request this, please ignore this email.

— LightLearn Team
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return code


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


def send_monthly_report_email(guardian, period_label, attachments):
    """Email a guardian their children's monthly reports (one PDF per
    child) — the automatic counterpart to the on-demand download in
    auth/dashboard_views.py::parent_monthly_report. `attachments` is a list
    of (filename, pdf_bytes, student_name) tuples, built by
    institutions/scheduler.py::send_due_monthly_reports.
    """
    recipient = guardian.user.email if guardian.user_id else guardian.email
    if not recipient:
        return

    names = ', '.join(name for _, _, name in attachments)
    message = f"""
Hi {guardian.name},

Attached {'is' if len(attachments) == 1 else 'are'} your {period_label} monthly report{'s' if len(attachments) != 1 else ''} for {names}.

You can also view these anytime by logging in to LightLearn.

— LightLearn Team
    """

    email = EmailMessage(
        subject=f'Your {period_label} monthly report',
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )
    for filename, pdf_bytes, _ in attachments:
        email.attach(filename, pdf_bytes, 'application/pdf')
    email.send(fail_silently=False)


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