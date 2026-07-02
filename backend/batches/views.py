from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Batch
from .serializers import BatchSerializer

class BatchListCreateView(APIView):

    def get(self, request):
        search = request.query_params.get('search', '')
        institution_id = request.query_params.get('institution', '')

        batches = Batch.objects.select_related('institution').all()

        if search:
            batches = batches.filter(name__icontains=search)
        if institution_id:
            batches = batches.filter(institution_id=institution_id)

        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BatchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BatchDetailView(APIView):

    def get(self, request, pk):
        batch = get_object_or_404(Batch, pk=pk)
        serializer = BatchSerializer(batch)
        return Response(serializer.data)

    def put(self, request, pk):
        batch = get_object_or_404(Batch, pk=pk)
        serializer = BatchSerializer(batch, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        batch = get_object_or_404(Batch, pk=pk)
        batch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)