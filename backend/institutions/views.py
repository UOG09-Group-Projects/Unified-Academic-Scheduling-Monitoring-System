from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse as DjangoJsonResponse
import json
from .models import Institution, User
from .serializers import InstitutionListSerializer
from .services import InstitutionService
from .jwt_utils import decode_token
from .access import load_permissions, has_permission, resolve_institution_id, scoped_institution_filter, is_institution_allowed
import jwt


# ---------------------------------------------------------------------------
# Base class — replaces ProtectedView
# Reads the access_token cookie, decodes it, sets request.current_user.
# Override allowed_roles = [...] in subclasses to restrict by role.
# Override permission_map = {'GET': 'view_x', 'POST': 'create_x', ...} to
# additionally require a specific permission (from roles_permissions) per
# HTTP method — checked after allowed_roles, before the view method runs.
# SUPER_ADMIN always bypasses both checks.
# ---------------------------------------------------------------------------

class JWTView(APIView):
    allowed_roles = None
    permission_map = None

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
        user.permissions = load_permissions(user)

        if self.permission_map:
            required = self.permission_map.get(request.method)
            if required and not has_permission(user, required):
                return DjangoJsonResponse({'error': 'Permission denied.'}, status=403)

        request.current_user = user
        return super().dispatch(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Institution views
# ---------------------------------------------------------------------------

class InstitutionPublicListView(APIView):
    """
    Public, unauthenticated: the institution picker on the student signup
    page. Deliberately exposes only id/name — nothing sensitive.
    """

    def get(self, request):
        institutions = Institution.objects.filter(is_deleted=False).order_by('name')
        return Response([{'id': i.id, 'name': i.name} for i in institutions])


class InstitutionListCreateView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    # No create_institution/delete_institution permission exists in the
    # permissions table yet — POST stays gated by allowed_roles only.
    # GET is authorized manually below: view_institution holders get the
    # full (role-scoped) list; everyone else (MANAGER/EDUCATOR/STUDENT —
    # whose forms need to know their *own* institution for dropdowns, even
    # without the staff browsing permission) gets just their own institution.

    def get(self, request):
        user = request.current_user
        institutions = Institution.objects.filter(is_deleted=False).select_related('owner')

        if has_permission(user, 'view_institution'):
            institutions = institutions.filter(**scoped_institution_filter(user, field='id'))
        else:
            inst_id = resolve_institution_id(user)
            institutions = institutions.filter(id=inst_id) if inst_id else institutions.none()

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
    # No delete_institution permission exists yet — DELETE stays
    # gated by allowed_roles only. GET is authorized manually (see below).
    permission_map = {'PUT': 'edit_institution'}

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

        user = request.current_user
        can_view = has_permission(user, 'view_institution') or is_institution_allowed(user, institution.id)
        if not can_view:
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