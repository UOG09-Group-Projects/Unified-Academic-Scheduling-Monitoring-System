import jwt
import datetime
from django.conf import settings
from django.http import JsonResponse
from functools import wraps
from rest_framework.views import APIView
from .models import User


#DEV MODE FLAG (ADD THIS)
DEV_MODE = False   # change to False in production


def generate_tokens(user):
    now = datetime.datetime.utcnow()

    access_payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'type': 'access',
        'iat': now,
        'exp': now + datetime.timedelta(hours=8),
    }

    refresh_payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'type': 'refresh',
        'iat': now,
        'exp': now + datetime.timedelta(days=7),
    }

    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')

    return {
        'access': access_token,
        'refresh': refresh_token,
    }


def decode_token(token):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])


DEV_MODE = False  # ← make sure this is False

def get_user_from_token(request):
    print("=== GET USER FROM TOKEN ===")
    print("Cookies:", request.COOKIES)
    print("Auth header:", request.META.get('HTTP_AUTHORIZATION', 'MISSING'))
    token = request.COOKIES.get('access_token')

    # Fallback to Authorization header (for backward compat during transition)
    if not token:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        elif auth_header:
            token = auth_header

    if not token:
        return None

    try:
        payload = decode_token(token)

        if payload.get('type') != 'access':
            return None

        return User.objects.get(id=payload['user_id'])

    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
        return None


def jwt_required(roles=None):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):

            user = get_user_from_token(request)

            if user is None:
                return JsonResponse(
                    {'error': 'Authentication required.'},
                    status=401
                )

            # ❌ ROLE CHECK REMOVED (GOOD FOR DEV)

            request.current_user = user
            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator


class ProtectedView(APIView):
    required_roles = []

    def dispatch(self, request, *args, **kwargs):
        user = get_user_from_token(request)

        if user is None:
            return JsonResponse({'error': 'Authentication required.'}, status=401)

        if self.required_roles and user.role not in self.required_roles:
            return JsonResponse({'error': 'Permission denied.'}, status=403)

        # ✅ Works for both plain Django requests and DRF requests
        try:
            request._request.current_user = user  # DRF wraps request
        except AttributeError:
            pass
        request.current_user = user  # plain Django request

        return super().dispatch(request, *args, **kwargs)