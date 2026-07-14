import json
from django.http import JsonResponse
from django.views import View
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from institutions.models import Role, Permission, RolePermission, Module
from institutions.jwt_utils import jwt_required

def _role_to_dict(role):

    perms = RolePermission.objects.filter(
        role_id=role.id
    ).select_related("permission")

    return {
        "id": role.id,
        "name": role.name,
        "permissions": [
            rp.permission_id
            for rp in perms
        ],
    }

@method_decorator(csrf_exempt, name="dispatch")
class PermissionListView(View):
    """GET /api/institutions/permissions/ — grouped by module"""

    def get(self, request):

        modules = Module.objects.prefetch_related(
            "permissions"
        ).all()
        data = []

        for module in modules:
            perms = module.permissions.all()

            if perms.exists():
                data.append({
                    "module": module.name,
                    "permissions": [
                        {
                            "id": p.id,
                            "name": p.name
                        }
                        for p in perms
                    ],
                })

        return JsonResponse(data, safe=False)

@method_decorator(csrf_exempt, name="dispatch")
class RoleListCreateView(View):
    """
    GET  /api/roles/      — list all roles with their permission ids
    POST /api/roles/      — create a new role with permissions
    """

    def get(self, request):
        roles = Role.objects.all()
        return JsonResponse([_role_to_dict(r) for r in roles], safe=False)

    def post(self, request):
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        name = body.get("name", "").strip()
        permission_ids = body.get("permissions", [])

        if not name:
            return JsonResponse({"error": "Role name is required"}, status=400)

        if Role.objects.filter(name__iexact=name).exists():
            return JsonResponse({"error": f"Role '{name}' already exists"}, status=409)

        with transaction.atomic():
            role = Role.objects.create(name=name)

            for pid in permission_ids:
                RolePermission.objects.create(
                    role_id=role.id,
                    permission_id=pid
        )

        return JsonResponse(_role_to_dict(role), status=201)
    

@method_decorator(csrf_exempt, name="dispatch")
class RoleDetailView(View):
    """
    GET    /api/roles/<pk>/  — get single role
    PUT    /api/roles/<pk>/  — update role name + permissions (full replace)
    DELETE /api/roles/<pk>/  — delete role
    """

    def _get_role(self, pk):
        try:
            return Role.objects.get(pk=pk)
        except Role.DoesNotExist:
            return None

    def get(self, request, pk):
        role = self._get_role(pk)
        if not role:
            return JsonResponse({"error": "Not found"}, status=404)
        return JsonResponse(_role_to_dict(role))

    def put(self, request, pk):
        role = self._get_role(pk)

        if not role:
            return JsonResponse({"error": "Not found"}, status=404)

        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        name = body.get("name", "").strip()
        permission_ids = body.get("permissions", [])

        if not name:
            return JsonResponse(
                {"error": "Role name is required"},
                status=400
            )

        with transaction.atomic():

            role.name = name
            role.save()

            # remove old permissions
            RolePermission.objects.filter(
                role_id=role.id
            ).delete()

            # add new permissions
            for pid in permission_ids:
                RolePermission.objects.create(
                    role_id=role.id,
                    permission_id=pid
                )

        return JsonResponse(_role_to_dict(role))


    def delete(self, request, pk):
        role = self._get_role(pk)
        if not role:
            return JsonResponse({"error": "Not found"}, status=404)
        role.delete()
        return JsonResponse({"deleted": True})