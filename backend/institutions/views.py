from rest_framework.response import Response
from rest_framework import status
from .models import Institution
from .serializers import InstitutionListSerializer
from .services import InstitutionService
from .jwt_utils import ProtectedView 


class InstitutionListCreateView(ProtectedView):
    required_roles = ['SUPER_ADMIN', 'OWNER','MANAGER']

    def get(self, request):
        user = request.current_user

        if user.role == 'OWNER':
            institutions = Institution.objects.filter(
                is_deleted=False, owner=user
            ).select_related('owner')
        elif user.role == 'MANAGER':
            try:
                institutions = Institution.objects.filter(
                    is_deleted=False,
                    id=user.manager_profile.institution.id
                ).select_related('owner')
            except Exception:
                institutions = Institution.objects.none()
        else:
            # SUPER_ADMIN sees all
            institutions = Institution.objects.filter(
                is_deleted=False
            ).select_related('owner')

        serializer = InstitutionListSerializer(
            institutions, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.current_user
        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo', None)

        if user.role == 'OWNER':
            data['owner_id'] = user.id

        try:
            institution = InstitutionService.create_institution(data=data, logo=logo)
            serializer = InstitutionListSerializer(institution, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class InstitutionDetailView(ProtectedView):      # ← changed
    required_roles = ['OWNER','SUPER_ADMIN',]    # ← added

    def get_object(self, pk):
        try:
            return Institution.objects.select_related('owner').get(pk=pk, is_deleted=False)
        except Institution.DoesNotExist:
            return None

    def get(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = InstitutionListSerializer(institution, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo', None)
        try:
            updated = InstitutionService.update_institution(institution, data=data, logo=logo)
            serializer = InstitutionListSerializer(updated, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_404_NOT_FOUND)
        InstitutionService.soft_delete_institution(institution)
        return Response({'message': 'Institution deleted successfully.'}, status=status.HTTP_200_OK)