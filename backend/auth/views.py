import jwt
import datetime
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json

from institutions.models import User, Role
from institutions.jwt_utils import generate_access_token, generate_refresh_token, decode_token, jwt_required
from institutions.email_utils import send_verification_email, send_password_reset_email


# ---------------------------------------------------------------------------
# Helper: safe user dict for JSON responses
# ---------------------------------------------------------------------------

def _user_json(user) -> dict:
    """
    Build the user payload for every JSON response.
    Expects user fetched with select_related(
        'role', 'manager_profile', 'educator_profile'
    ).
    """
    data = {
        'id':       user.id,
        'username': user.username,
        'email':    user.email,
        'role':     user.role.name,
        'role_id':  user.role_id,
    }
    try:
        data['institution_id'] = user.manager_profile.institution_id
    except Exception:
        pass
    try:
        data['institution_id'] = user.educator_profile.institution_id
    except Exception:
        pass
    return data


# ---------------------------------------------------------------------------
# POST /api/auth/login/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['POST'])
def login_view(request):
    print("Content-Type:", request.content_type)
    print("Raw body:", request.body)

    try:
        body = json.loads(request.body)
        print("Parsed JSON:", body)
        email    = body.get('email', '').strip()
        password = body.get('password', '')
    except json.JSONDecodeError as e:
        print("JSON Error:", e)
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    if not email or not password:
        return JsonResponse({'error': 'Email and password are required.'}, status=400)

    try:
        user = User.objects.select_related(
            'role',
            'manager_profile',
            'educator_profile',
        ).get(email=email)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Invalid email or password.'}, status=401)

    if not user.check_password(password):
        return JsonResponse({'error': 'Invalid email or password.'}, status=401)

    if not user.is_active:
        return JsonResponse({'error': 'Your account has been deactivated.'}, status=403)

    access_token  = generate_access_token(user)
    refresh_token = generate_refresh_token(user)

    response = JsonResponse({
        'user':    _user_json(user),
        'access':  access_token,
        'refresh': refresh_token,
    })
    response.set_cookie(
        key='access_token', value=access_token,
        httponly=True, secure=False, samesite='Lax',
        max_age=60 * 60 * 8, path='/',
    )
    response.set_cookie(
        key='refresh_token', value=refresh_token,
        httponly=True, secure=False, samesite='Lax',
        max_age=60 * 60 * 24 * 7, path='/',
    )
    return response


# ---------------------------------------------------------------------------
# POST /api/auth/refresh/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['POST'])
def refresh_view(request):
    # Prefer cookie, fall back to body
    refresh_token = request.COOKIES.get('refresh_token')
    if not refresh_token:
        try:
            body          = json.loads(request.body)
            refresh_token = body.get('refresh', '')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    if not refresh_token:
        return JsonResponse({'error': 'Refresh token is required.'}, status=400)

    try:
        payload = decode_token(refresh_token)
    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Refresh token has expired.'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Invalid refresh token.'}, status=401)

    if payload.get('token_type') != 'refresh':
        return JsonResponse({'error': 'Invalid token type.'}, status=401)

    try:
        user = User.objects.select_related(
            'role', 'manager_profile', 'educator_profile',
        ).get(pk=payload['user_id'])
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=401)

    new_access  = generate_access_token(user)
    new_refresh = generate_refresh_token(user)

    response = JsonResponse({'access': new_access})
    response.set_cookie(
        key='access_token', value=new_access,
        httponly=True, secure=False, samesite='Lax',
        max_age=60 * 60 * 8, path='/',
    )
    response.set_cookie(
        key='refresh_token', value=new_refresh,
        httponly=True, secure=False, samesite='Lax',
        max_age=60 * 60 * 24 * 7, path='/',
    )
    return response


# ---------------------------------------------------------------------------
# GET /api/auth/me/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
@jwt_required()
def me_view(request):
    # request.current_user is a JWT payload dict — re-fetch User from DB
    # so we always return fresh data (role changes, profile updates etc.)
    try:
        user = User.objects.select_related(
            'role', 'manager_profile', 'educator_profile',
        ).get(pk=request.current_user['user_id'])
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

    return JsonResponse({'user': _user_json(user)})


# ---------------------------------------------------------------------------
# POST /api/auth/logout/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['POST'])
def logout_view(request):
    response = JsonResponse({'message': 'Logged out successfully.'})
    response.delete_cookie('access_token',  path='/')
    response.delete_cookie('refresh_token', path='/')
    return response


# ---------------------------------------------------------------------------
# POST /api/auth/create-user/   (privileged roles only)
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['POST'])
@jwt_required(roles=['SUPER_ADMIN', 'OWNER', 'MANAGER'])
def create_user_view(request):
    """
    Body: { "username", "email", "password", "role" }
    role must match a name in the roles table e.g. "EDUCATOR", "STUDENT"
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    username  = body.get('username', '').strip()
    email     = body.get('email', '').strip()
    password  = body.get('password', '')
    role_name = body.get('role', '').strip().upper()

    if not all([username, email, password, role_name]):
        return JsonResponse(
            {'error': 'username, email, password, and role are all required.'},
            status=400,
        )

    try:
        role = Role.objects.get(name=role_name)
    except Role.DoesNotExist:
        return JsonResponse(
            {'error': f'Role "{role_name}" does not exist.'}, status=400
        )

    if User.objects.filter(email=email).exists():
        return JsonResponse(
            {'error': 'A user with this email already exists.'}, status=400
        )
    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {'error': 'A user with this username already exists.'}, status=400
        )

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    user.is_active         = True
    user.is_email_verified = True
    user.save()

    try:
        send_verification_email(user)
    except Exception:
        pass

    return JsonResponse({
        'message': f'Account created for {email}.',
        'user': {
            'id':        user.id,
            'username':  user.username,
            'email':     user.email,
            'role':      user.role.name,
            'is_active': user.is_active,
        }
    }, status=201)


# ---------------------------------------------------------------------------
# Email verification  (unchanged)
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['POST'])
def verify_email_view(request):
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


# ---------------------------------------------------------------------------
# Forgot / reset password  (unchanged)
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['POST'])
def forgot_password_view(request):
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
        pass  # don't reveal whether email exists

    return JsonResponse({
        'message': 'If that email exists, a reset link has been sent.'
    })


@csrf_exempt
@require_http_methods(['POST'])
def reset_password_view(request):
    try:
        body     = json.loads(request.body)
        token    = body.get('token', '').strip()
        password = body.get('password', '')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    if not token or not password:
        return JsonResponse(
            {'error': 'Token and new password are required.'}, status=400
        )

    if len(password) < 8:
        return JsonResponse(
            {'error': 'Password must be at least 8 characters.'}, status=400
        )

    try:
        user = User.objects.get(password_reset_token=token)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Invalid or expired reset link.'}, status=400)

    if user.password_reset_expiry:
        now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
        if now > user.password_reset_expiry:
            return JsonResponse(
                {'error': 'Reset link has expired. Please request a new one.'},
                status=400,
            )

    user.set_password(password)
    user.password_reset_token  = None
    user.password_reset_expiry = None
    user.save()

    return JsonResponse({'message': 'Password reset successfully. You can now log in.'})