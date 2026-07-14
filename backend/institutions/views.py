from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse as DjangoJsonResponse
import json
from .models import Institution, User
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
    allowed_roles = None

    def dispatch(self, request, *args, **kwargs):
        token = request.COOKIES.get('access_token')

        if not token:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]

        if not token:
            return DjangoJsonResponse(
                {'error': 'Authentication required.'},
                status=401
            )

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return DjangoJsonResponse({'error': 'Token expired.'}, status=401)
        except jwt.InvalidTokenError:
            return DjangoJsonResponse({'error': 'Invalid token.'}, status=401)

        if payload.get('token_type') != 'access':
            return DjangoJsonResponse({'error': 'Invalid token type.'}, status=401)

        if self.allowed_roles:
            user_role = payload.get('role', '').upper()
            allowed = [r.upper() for r in self.allowed_roles]
            if user_role not in allowed:
                return DjangoJsonResponse({'error': 'Permission denied.'}, status=403)

        try:
            user = User.objects.select_related('role').get(id=payload['user_id'])
        except User.DoesNotExist:
            return DjangoJsonResponse({'error': 'User not found.'}, status=401)

        # Attach institution_id from JWT payload so services can read it
        # without an extra DB query
        user.institution_id = payload.get('institution_id')

        request.current_user = user
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

        # current_user is now a real User object
        data['owner_id'] = request.current_user.id

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