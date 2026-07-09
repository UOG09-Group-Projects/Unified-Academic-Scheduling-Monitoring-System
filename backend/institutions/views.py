from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Institution
from .serializers import InstitutionListSerializer
from .services import InstitutionService
from .jwt_utils import decode_token
import jwt


# ---------------------------------------------------------------------------
# Base class — replaces ProtectedView
# Reads the access_token cookie, decodes it, sets request.current_user.
# Override allowed_roles = [...] in subclasses to restrict by role.
# ---------------------------------------------------------------------------

class JWTView(APIView):
    allowed_roles = None   # None = any authenticated user

    def dispatch(self, request, *args, **kwargs):
        token = request.COOKIES.get('access_token')

        if not token:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]

        if not token:
            return Response(
                {'error': 'Authentication required.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return Response(
                {'error': 'Token expired.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except jwt.InvalidTokenError:
            return Response(
                {'error': 'Invalid token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if payload.get('token_type') != 'access':
            return Response(
                {'error': 'Invalid token type.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if self.allowed_roles:
            user_role = payload.get('role', '').upper()
            allowed   = [r.upper() for r in self.allowed_roles]
            if user_role not in allowed:
                return Response(
                    {'error': 'Permission denied.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        request.current_user = payload
        return super().dispatch(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Institution views
# ---------------------------------------------------------------------------

class InstitutionListCreateView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']

    def get(self, request):
        institutions = Institution.objects.filter(
            is_deleted=False
        ).select_related('owner')

        serializer = InstitutionListSerializer(
            institutions,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo')

        # current_user is a dict now, not a User object
        data['owner_id'] = request.current_user['user_id']

        try:
            institution = InstitutionService.create_institution(
                data=data,
                logo=logo
            )
            serializer = InstitutionListSerializer(
                institution,
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class InstitutionDetailView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']

    def get_object(self, pk):
        try:
            return Institution.objects.select_related('owner').get(
                pk=pk, is_deleted=False
            )
        except Institution.DoesNotExist:
            return None

    def get(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = InstitutionListSerializer(
            institution, context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo')

        try:
            updated = InstitutionService.update_institution(
                institution, data=data, logo=logo
            )
            serializer = InstitutionListSerializer(
                updated, context={'request': request}
            )
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        InstitutionService.soft_delete_institution(institution)
        return Response(
            {'message': 'Institution deleted successfully.'},
            status=status.HTTP_200_OK
        )