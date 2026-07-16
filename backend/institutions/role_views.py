from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
from institutions.models import Role, RolePermission, Module
from institutions.views import JWTView


def _role_to_dict(role):
    perms = RolePermission.objects.filter(role_id=role.id).select_related("permission")
    return {
        "id": role.id,
        "name": role.name,
        "permissions": [rp.permission_id for rp in perms],
    }


class PermissionListView(JWTView):
    """GET /api/institutions/permissions/ — grouped by module"""
    permission_map = {'GET': 'view_role'}

    def get(self, request):
        modules = Module.objects.prefetch_related("permissions").all()
        data = []

        for module in modules:
            perms = module.permissions.all()
            if perms.exists():
                data.append({
                    "module": module.name,
                    "permissions": [{"id": p.id, "name": p.name} for p in perms],
                })

        return Response(data)


class RoleListCreateView(JWTView):
    """
    GET  /api/institutions/roles/  — list all roles with their permission ids
    POST /api/institutions/roles/  — create a new role with permissions
    """
    permission_map = {'GET': 'view_role', 'POST': 'create_role'}

    def get(self, request):
        roles = Role.objects.all()
        return Response([_role_to_dict(r) for r in roles])

    @transaction.atomic
    def post(self, request):
        name = (request.data.get("name") or "").strip()
        permission_ids = request.data.get("permissions", [])

        if not name:
            return Response({"error": "Role name is required"}, status=status.HTTP_400_BAD_REQUEST)

        if Role.objects.filter(name__iexact=name).exists():
            return Response({"error": f"Role '{name}' already exists"}, status=status.HTTP_409_CONFLICT)

        role = Role.objects.create(name=name)
        for pid in permission_ids:
            RolePermission.objects.create(role_id=role.id, permission_id=pid)

        return Response(_role_to_dict(role), status=status.HTTP_201_CREATED)


class RoleDetailView(JWTView):
    """
    GET    /api/institutions/roles/<pk>/  — get single role
    PUT    /api/institutions/roles/<pk>/  — update role name + permissions (full replace)
    DELETE /api/institutions/roles/<pk>/  — delete role
    """
    permission_map = {'GET': 'view_role', 'PUT': 'edit_role', 'DELETE': 'delete_role'}

    def _get_role(self, pk):
        try:
            return Role.objects.get(pk=pk)
        except Role.DoesNotExist:
            return None

    def get(self, request, pk):
        role = self._get_role(pk)
        if not role:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_role_to_dict(role))

    @transaction.atomic
    def put(self, request, pk):
        role = self._get_role(pk)
        if not role:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        name = (request.data.get("name") or "").strip()
        permission_ids = request.data.get("permissions", [])

        if not name:
            return Response({"error": "Role name is required"}, status=status.HTTP_400_BAD_REQUEST)

        role.name = name
        role.save()

        RolePermission.objects.filter(role_id=role.id).delete()
        for pid in permission_ids:
            RolePermission.objects.create(role_id=role.id, permission_id=pid)

        return Response(_role_to_dict(role))

    def delete(self, request, pk):
        role = self._get_role(pk)
        if not role:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        role.delete()
        return Response({"deleted": True})
