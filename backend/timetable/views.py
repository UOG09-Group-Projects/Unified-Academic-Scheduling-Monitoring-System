from rest_framework.response import Response
from rest_framework import status
from institutions.views import JWTView
from .services import TimetableService
from .serializers import TimetableSlotSerializer

WRITE_ROLES = ('OWNER', 'MANAGER')


class TimetableSlotListCreateView(JWTView):
    """
    GET is readable by everyone with a stake in a timetable (STUDENT: their
    own batch, EDUCATOR: their own slots, OWNER/MANAGER: their institution).
    POST is OWNER/MANAGER only — checked inline rather than via allowed_roles
    (which would apply to GET too) or permission_map (no create_timetable
    permission is seeded in the roles/permissions table).
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'EDUCATOR', 'STUDENT']

    def get(self, request):
        batch_id = request.query_params.get('batch')
        slots = TimetableService.list_slots(request.current_user, batch_id=batch_id)
        return Response(TimetableSlotSerializer(slots, many=True).data)

    def post(self, request):
        if request.current_user.role.name.upper() not in WRITE_ROLES:
            return Response(
                {'error': 'Only managers can create timetable slots.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            slot = TimetableService.create_slot(request.current_user, request.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TimetableSlotSerializer(slot).data, status=status.HTTP_201_CREATED)


class TimetableSlotDetailView(JWTView):
    allowed_roles = ['OWNER', 'MANAGER']

    def put(self, request, pk):
        try:
            slot = TimetableService.update_slot(request.current_user, pk, request.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TimetableSlotSerializer(slot).data)

    def delete(self, request, pk):
        try:
            TimetableService.delete_slot(request.current_user, pk)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Timetable slot deleted.'})
