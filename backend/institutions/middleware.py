import jwt
from django.http import JsonResponse
from .jwt_utils import decode_token

# Always reachable even while maintenance mode is on: Django admin, every
# auth endpoint (a SUPER_ADMIN must still be able to log in to turn
# maintenance mode back off), and the platform-settings endpoints themselves.
EXEMPT_PREFIXES = ('/admin/', '/api/auth/', '/api/institutions/settings')


class MaintenanceModeMiddleware:
    """
    When PlatformSettings.maintenance_mode is on, blocks every request
    (including anonymous ones) except SUPER_ADMIN and the paths above with
    a 503 — see institutions/models.py::PlatformSettings and
    institutions/views.py::PlatformSettingsView.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith(EXEMPT_PREFIXES):
            return self.get_response(request)

        from .models import PlatformSettings
        if not PlatformSettings.load().maintenance_mode:
            return self.get_response(request)

        if self._is_super_admin(request):
            return self.get_response(request)

        return JsonResponse(
            {'error': 'Platform is under maintenance. Please try again later.'},
            status=503,
        )

    def _is_super_admin(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
        else:
            token = request.COOKIES.get('access_token')
        if not token:
            return False
        try:
            payload = decode_token(token)
        except jwt.PyJWTError:
            return False
        return (payload.get('role') or '').upper() == 'SUPER_ADMIN'
