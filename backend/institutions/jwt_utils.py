import jwt
import datetime
import functools
from django.conf import settings
from django.http import JsonResponse

SECRET_KEY = settings.SECRET_KEY
ALGORITHM  = "HS256"

ACCESS_TOKEN_EXPIRY  = datetime.timedelta(hours=1)
REFRESH_TOKEN_EXPIRY = datetime.timedelta(days=7)


# ---------------------------------------------------------------------------
# Institution resolver
# ---------------------------------------------------------------------------

def _resolve_institution_id(user) -> int | None:
    """
    Returns the institution_id the user belongs to, based on their role.

    - OWNER       → owns the institution directly (Institution.owner FK)
    - MANAGER     → linked via manager_profile
    - EDUCATOR    → linked via educator_profile
    - STUDENT     → linked via student_profile → batch → institution,
                     falling back to student_profile.institution when no
                     batch has been assigned yet (self-registered students)
    - SUPER_ADMIN / PARENT → not scoped to one institution, returns None
    """
    role_name = user.role.name.upper()

    if role_name == 'OWNER':
        try:
            institution = user.owned_institutions.filter(is_deleted=False).first()
            return institution.id if institution else None
        except Exception:
            return None

    if role_name == 'MANAGER':
        try:
            return user.manager_profile.institution_id
        except Exception:
            return None

    if role_name == 'EDUCATOR':
        try:
            return user.educator_profile.institution_id
        except Exception:
            return None

    if role_name == 'STUDENT':
        try:
            student = user.student_profile
        except Exception:
            return None
        if student.batch_id:
            return student.batch.institution_id
        return student.institution_id

    return None


# ---------------------------------------------------------------------------
# Token builders
# ---------------------------------------------------------------------------

def _build_payload(user, token_type: str, expiry: datetime.timedelta) -> dict:
    now = datetime.datetime.utcnow()

    payload = {
        "sub":        str(user.id),
        "iat":        now,
        "exp":        now + expiry,
        "token_type": token_type,
        "user_id":    user.id,
        "username":   user.username,
        "email":      user.email,
        "role":       user.role.name,
        "role_id":    user.role_id,
    }

    institution_id = _resolve_institution_id(user)
    if institution_id is not None:
        payload["institution_id"] = institution_id

    return payload


def generate_access_token(user) -> str:
    payload = _build_payload(user, "access", ACCESS_TOKEN_EXPIRY)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def generate_refresh_token(user) -> str:
    payload = _build_payload(user, "refresh", REFRESH_TOKEN_EXPIRY)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Token decoder
# ---------------------------------------------------------------------------

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ---------------------------------------------------------------------------
# Decorator (function-based views)
# ---------------------------------------------------------------------------

def jwt_required(roles: list[str] | None = None):
    """
    Sets request.current_user to the real User object (not the raw dict).
    Also injects user.institution_id from the JWT payload.
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            from institutions.models import User

            # Header takes priority over the cookie so that multiple tabs of
            # the same browser (sharing one cookie jar) can each act as a
            # different logged-in user via their own per-tab bearer token.
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]
            else:
                token = request.COOKIES.get('access_token')

            if not token:
                return JsonResponse({'error': 'Authentication required'}, status=401)

            try:
                payload = decode_token(token)
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)

            if payload.get('token_type') != 'access':
                return JsonResponse({'error': 'Invalid token type'}, status=401)

            if roles:
                user_role = payload.get('role', '').upper()
                allowed   = [r.upper() for r in roles]
                if user_role not in allowed:
                    return JsonResponse({'error': 'Forbidden'}, status=403)

            try:
                user = User.objects.select_related('role').get(id=payload['user_id'])
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=401)

            # Inject institution_id from JWT so services can read it
            user.institution_id = payload.get('institution_id')

            from institutions.access import load_permissions
            user.permissions = load_permissions(user)

            request.current_user = user
            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator