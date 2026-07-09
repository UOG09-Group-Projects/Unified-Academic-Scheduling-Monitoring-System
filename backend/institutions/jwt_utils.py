import jwt
import datetime
from django.conf import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM  = "HS256"

ACCESS_TOKEN_EXPIRY  = datetime.timedelta(hours=1)
REFRESH_TOKEN_EXPIRY = datetime.timedelta(days=7)

# ---------------------------------------------------------------------------
# Token builders
# ---------------------------------------------------------------------------

def _resolve_institution_id(user) -> int | None:
    """
    Look up institution_id from the correct profile table based on role name.
    Returns None for roles that aren't scoped to an institution
    (SUPER_ADMIN, OWNER, STUDENT, PARENT, GUARDIAN).
    """
    role_name = user.role.name.upper()

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

    return None


def _build_payload(user, token_type: str, expiry: datetime.timedelta) -> dict:
    """Build the JWT payload dict from a User instance."""
    now = datetime.datetime.utcnow()

    payload = {
        # standard claims
        "sub":        str(user.id),
        "iat":        now,
        "exp":        now + expiry,
        "token_type": token_type,

        # app claims
        "user_id":    user.id,
        "username":   user.username,
        "email":      user.email,
        "role":       user.role.name,           # string name from roles table
        "role_id":    user.role_id,             # FK int (useful for DB joins)
    }

    # Attach institution_id for roles that need it
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
    """
    Decode and verify a JWT. Raises jwt.ExpiredSignatureError or
    jwt.InvalidTokenError on failure.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ---------------------------------------------------------------------------
# Decorator
# ---------------------------------------------------------------------------

import functools
from django.http import JsonResponse


def jwt_required(roles: list[str] | None = None):
    """
    Usage:
        @jwt_required()                          # any authenticated user
        @jwt_required(roles=['MANAGER'])         # manager only
        @jwt_required(roles=['MANAGER','OWNER']) # either role

    Sets request.current_user as a dict with all JWT payload fields.
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            token = request.COOKIES.get('access_token')

            if not token:
                # Also accept Bearer header as fallback
                auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ', 1)[1]

            if not token:
                return JsonResponse(
                    {'error': 'Authentication required'}, status=401
                )

            try:
                payload = decode_token(token)
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)

            if payload.get('token_type') != 'access':
                return JsonResponse({'error': 'Invalid token type'}, status=401)

            # Role gate
            if roles:
                user_role = payload.get('role', '').upper()
                allowed   = [r.upper() for r in roles]
                if user_role not in allowed:
                    return JsonResponse({'error': 'Forbidden'}, status=403)

            request.current_user = payload
            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator