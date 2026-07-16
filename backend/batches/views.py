from rest_framework.response import Response
from rest_framework import status
from institutions.models import Batch
from institutions.views import JWTView       # reuse the base class we already wrote
from institutions.access import scoped_institution_filter, is_institution_allowed
from .serializers import BatchSerializer


class BatchListCreateView(JWTView):
    permission_map = {'GET': 'view_batch', 'POST': 'create_batch'}

    def get(self, request):
        try:
            search         = request.query_params.get('search', '')
            institution_id = request.query_params.get('institution', '')

            batches = Batch.objects.select_related('institution').all()
            batches = batches.filter(**scoped_institution_filter(request.current_user))

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
            institution_id = request.data.get('institution')
            if not is_institution_allowed(request.current_user, institution_id):
                return Response(
                    {'error': 'You cannot create batches for this institution.'},
                    status=status.HTTP_403_FORBIDDEN
                )

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
    permission_map = {'GET': 'view_batch', 'PUT': 'edit_batch', 'DELETE': 'delete_batch'}

    def get_object(self, request, pk):
        try:
            batch = Batch.objects.select_related('institution').get(pk=pk)
        except Batch.DoesNotExist:
            return None
        if not is_institution_allowed(request.current_user, batch.institution_id):
            return None
        return batch

    def get(self, request, pk):
        batch = self.get_object(request, pk)
        if not batch:
            return Response({'error': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            serializer = BatchSerializer(batch)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch batch', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, pk):
        batch = self.get_object(request, pk)
        if not batch:
            return Response({'error': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            target_institution = request.data.get('institution', batch.institution_id)
            if not is_institution_allowed(request.current_user, target_institution):
                return Response(
                    {'error': 'You cannot move batches to this institution.'},
                    status=status.HTTP_403_FORBIDDEN
                )

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
        batch = self.get_object(request, pk)
        if not batch:
            return Response({'error': 'Batch not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
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
