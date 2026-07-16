from rest_framework.response import Response
from rest_framework import status

from institutions.models import Manager
from .serializers import (
    ManagerListSerializer,
    ManagerCreateSerializer
)
from .services import ManagerService
from institutions.views import JWTView
from institutions.access import scoped_institution_filter, is_institution_allowed


class ManagerListCreateView(JWTView):
    permission_map = {'GET': 'view_manager', 'POST': 'create_manager'}

    def get(self, request):
        managers = Manager.objects.select_related(
            "institution",
            "user"
        ).filter(**scoped_institution_filter(request.current_user))

        serializer = ManagerListSerializer(
            managers,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ManagerCreateSerializer(data=request.data)

        if serializer.is_valid():
            institution_id = serializer.validated_data.get('institution_id')
            if not is_institution_allowed(request.current_user, institution_id):
                return Response(
                    {"error": "You cannot create managers for this institution."},
                    status=status.HTTP_403_FORBIDDEN
                )

            try:
                manager = ManagerService.create_manager(
                    serializer.validated_data
                )

                return Response(
                    ManagerListSerializer(
                        manager,
                        context={"request": request}
                    ).data,
                    status=status.HTTP_201_CREATED
                )

            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagerDetailView(JWTView):
    permission_map = {'GET': 'view_manager', 'PUT': 'edit_manager', 'DELETE': 'delete_manager'}

    def get_object(self, request, pk):
        try:
            manager = Manager.objects.select_related(
                "institution",
                "user"
            ).get(pk=pk)
        except Manager.DoesNotExist:
            return None
        if not is_institution_allowed(request.current_user, manager.institution_id):
            return None
        return manager

    def get(self, request, pk):
        manager = self.get_object(request, pk)

        if not manager:
            return Response(
                {"error": "Manager not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ManagerListSerializer(
            manager,
            context={"request": request}
        )

        return Response(serializer.data)

    def put(self, request, pk):
        manager = self.get_object(request, pk)

        if not manager:
            return Response(
                {"error": "Manager not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ManagerCreateSerializer(
            manager,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            target_institution = serializer.validated_data.get('institution_id', manager.institution_id)
            if not is_institution_allowed(request.current_user, target_institution):
                return Response(
                    {"error": "You cannot move managers to this institution."},
                    status=status.HTTP_403_FORBIDDEN
                )

            try:
                manager = ManagerService.update_manager(
                    manager,
                    serializer.validated_data
                )

                return Response(
                    ManagerListSerializer(
                        manager,
                        context={"request": request}
                    ).data
                )

            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        manager = self.get_object(request, pk)

        if not manager:
            return Response(
                {"error": "Manager not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        ManagerService.delete_manager(manager)

        return Response(
            {"message": "Manager deleted successfully."},
            status=status.HTTP_200_OK
        )
