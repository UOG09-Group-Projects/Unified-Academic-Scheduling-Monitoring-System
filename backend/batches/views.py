from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from institutions.models import Batch
from institutions.views import JWTView       # reuse the base class we already wrote
from .serializers import BatchSerializer


class BatchListCreateView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']

    def get(self, request):
        try:
            search         = request.query_params.get('search', '')
            institution_id = request.query_params.get('institution', '')

            batches = Batch.objects.select_related('institution').all()

            if search:
                batches = batches.filter(name__icontains=search)
            if institution_id:
                batches = batches.filter(institution_id=institution_id)

            serializer = BatchSerializer(batches, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': 'Failed to fetch batches', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        try:
            serializer = BatchSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': 'Failed to create batch', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BatchDetailView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']

    def get(self, request, pk):
        try:
            batch      = get_object_or_404(Batch, pk=pk)
            serializer = BatchSerializer(batch)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': 'Failed to fetch batch', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, pk):
        try:
            batch      = get_object_or_404(Batch, pk=pk)
            serializer = BatchSerializer(batch, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': 'Failed to update batch', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pk):
        try:
            batch = get_object_or_404(Batch, pk=pk)
            batch.delete()
            return Response(
                {'message': 'Batch deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )

        except Exception as e:
            return Response(
                {'error': 'Failed to delete batch', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )