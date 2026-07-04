import jwt
import datetime
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json

from institutions.models import User
from institutions.jwt_utils import generate_tokens, decode_token, jwt_required
from institutions.email_utils import send_verification_email, send_password_reset_email


@csrf_exempt
@require_http_methods(['POST'])
def login_view(request):
    print("Content-Type:", request.content_type)
    print("Raw body:", request.body)

    try:
        body = json.loads(request.body)
        print("Parsed JSON:", body)

        email = body.get('email', '').strip()
        password = body.get('password', '')
    except json.JSONDecodeError as e:
        print("JSON Error:", e)
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    if not email or not password:
        return JsonResponse({'error': 'Email and password are required.'}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Invalid email or password.'}, status=401)

    if not user.check_password(password):
        return JsonResponse({'error': 'Invalid email or password.'}, status=401)

    # Block login if email not verified
    if not user.is_email_verified:
        return JsonResponse(
            {'error': 'Please verify your email before logging in. Check your inbox.'},
            status=403
        )

    if not user.is_active:
        return JsonResponse({'error': 'Your account has been deactivated.'}, status=403)

    tokens = generate_tokens(user)
    return JsonResponse({
        'tokens': tokens,
        'user': {
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
            'role':     user.role,
        }
    })


@csrf_exempt
@require_http_methods(['POST'])
def refresh_view(request):
    try:
        body          = json.loads(request.body)
        refresh_token = body.get('refresh', '')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    if not refresh_token:
        return JsonResponse({'error': 'Refresh token is required.'}, status=400)

    try:
        payload = decode_token(refresh_token)
        if payload.get('type') != 'refresh':
            return JsonResponse({'error': 'Invalid token type.'}, status=401)

        user = User.objects.get(id=payload['user_id'])
        now  = datetime.datetime.utcnow()
        access_payload = {
            'user_id': user.id,
            'email':   user.email,
            'role':    user.role,
            'type':    'access',
            'iat':     now,
            'exp':     now + datetime.timedelta(hours=8),
        }
        access_token = jwt.encode(
            access_payload, settings.SECRET_KEY, algorithm='HS256'
        )
        return JsonResponse({'access': access_token})

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Refresh token has expired.'}, status=401)
    except (jwt.InvalidTokenError, User.DoesNotExist):
        return JsonResponse({'error': 'Invalid refresh token.'}, status=401)


@csrf_exempt
@require_http_methods(['GET'])
@jwt_required()
def me_view(request):
    user = request.current_user
    return JsonResponse({
        'id':       user.id,
        'username': user.username,
        'email':    user.email,
        'role':     user.role,
    })


# ── NEW: Email Verification ─────────────────────────────────────

@csrf_exempt
@require_http_methods(['POST'])
def verify_email_view(request):
    """
    POST /api/auth/verify-email/
    Body: { "token": "..." }
    Called when user clicks the verification link.
    """
    try:
        body  = json.loads(request.body)
        token = body.get('token', '').strip()
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    if not token:
        return JsonResponse({'error': 'Token is required.'}, status=400)

    try:
        user = User.objects.get(email_verify_token=token)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Invalid or expired verification link.'}, status=400)

    user.is_email_verified  = True
    user.is_active          = True
    user.email_verify_token = None
    user.save()

    return JsonResponse({'message': 'Email verified successfully. You can now log in.'})


# ── NEW: Forgot Password ────────────────────────────────────────

@csrf_exempt
@require_http_methods(['POST'])
def forgot_password_view(request):
    """
    POST /api/auth/forgot-password/
    Body: { "email": "..." }
    Sends a password reset link to the email.
    """
    try:
        body  = json.loads(request.body)
        email = body.get('email', '').strip()
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    if not email:
        return JsonResponse({'error': 'Email is required.'}, status=400)

    try:
        user = User.objects.get(email=email)
        send_password_reset_email(user)
    except User.DoesNotExist:
        # Don't reveal whether email exists — always return success
        pass

    return JsonResponse({
        'message': 'If that email exists, a reset link has been sent.'
    })


# ── NEW: Reset Password ─────────────────────────────────────────

@csrf_exempt
@require_http_methods(['POST'])
def reset_password_view(request):
    """
    POST /api/auth/reset-password/
    Body: { "token": "...", "password": "..." }
    """
    try:
        body     = json.loads(request.body)
        token    = body.get('token', '').strip()
        password = body.get('password', '')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    if not token or not password:
        return JsonResponse(
            {'error': 'Token and new password are required.'},
            status=400
        )

    if len(password) < 8:
        return JsonResponse(
            {'error': 'Password must be at least 8 characters.'},
            status=400
        )

    try:
        user = User.objects.get(password_reset_token=token)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Invalid or expired reset link.'}, status=400)

    # Check expiry
    if user.password_reset_expiry:
        now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
        if now > user.password_reset_expiry:
            return JsonResponse(
                {'error': 'Reset link has expired. Please request a new one.'},
                status=400
            )

    user.set_password(password)
    user.password_reset_token  = None
    user.password_reset_expiry = None
    user.save()

    return JsonResponse({'message': 'Password reset successfully. You can now log in.'})


# ── NEW: Admin creates a user account ──────────────────────────

@csrf_exempt
@require_http_methods(['POST'])
@jwt_required(roles=['SUPER_ADMIN', 'OWNER', 'MANAGER'])
def create_user_view(request):
    """
    POST /api/auth/create-user/
    Body: { "username", "email", "password", "role" }
    Only admins can call this. Sends verification email automatically.
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    username = body.get('username', '').strip()
    email    = body.get('email', '').strip()
    password = body.get('password', '')
    role     = body.get('role', '').strip()

    if not all([username, email, password, role]):
        return JsonResponse(
            {'error': 'username, email, password and role are all required.'},
            status=400
        )

    valid_roles = ['MANAGER', 'EDUCATOR', 'STUDENT', 'PARENT']
    if role not in valid_roles:
        return JsonResponse(
            {'error': f"Role must be one of: {', '.join(valid_roles)}"},
            status=400
        )

    if User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'A user with this email already exists.'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'A user with this username already exists.'}, status=400)

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    user.save()

    # Send verification email
    try:
        send_verification_email(user)
    except Exception:
        # Don't fail the whole request if email fails
        pass

    return JsonResponse({
        'message': f"Account created for {email}. Verification email sent.",
        'user': {
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
            'role':     user.role,
        }
    }, status=201)