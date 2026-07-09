from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status

from institutions.models import Manager
from .serializers import (
    ManagerListSerializer,
    ManagerCreateSerializer
)
from .services import ManagerService
from institutions.views import JWTView


class ManagerListCreateView(JWTView):

    def get(self, request):
        managers = Manager.objects.select_related(
            "institution",
            "user"
        ).all()

        serializer = ManagerListSerializer(
            managers,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ManagerCreateSerializer(data=request.data)

        if serializer.is_valid():
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

    def get_object(self, pk):
        try:
            return Manager.objects.select_related(
                "institution",
                "user"
            ).get(pk=pk)

        except Manager.DoesNotExist:
            return None

    def get(self, request, pk):
        manager = self.get_object(pk)

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
        manager = self.get_object(pk)

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
        manager = self.get_object(pk)

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
