from institutions.views import JWTView
from institutions.models import Event, Allocation
from rest_framework.response import Response
from rest_framework import status
from .serializers import EventSerializer
from .services import EventService, _own_course_ids


class EventListView(JWTView):

    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        events = EventService.list_visible_events(request.current_user, year, month)
        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        try:
            event = EventService.create_event(request.data, request.current_user)
            serializer = EventSerializer(event, context={'request': request})
            return Response(
                {'message': 'Event created successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EventDetailView(JWTView):

    def get_object(self, pk):
        try:
            return Event.objects.select_related('course', 'created_by', 'created_by__role').get(id=pk)
        except Event.DoesNotExist:
            return None

    def put(self, request, pk):
        event = self.get_object(pk)
        if not event:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            updated = EventService.update_event(event, request.data, request.current_user)
            serializer = EventSerializer(updated, context={'request': request})
            return Response({'message': 'Event updated successfully.', 'data': serializer.data})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    patch = put

    def delete(self, request, pk):
        event = self.get_object(pk)
        if not event:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            EventService.delete_event(event, request.current_user)
            return Response({'message': 'Event deleted successfully.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MyCoursesView(JWTView):
    """Lightweight lookup for the event form's course-scope selector (educators only)."""
    allowed_roles = ['EDUCATOR']

    def get(self, request):
        course_ids = _own_course_ids(request.current_user)
        allocations = Allocation.objects.filter(
            educator__user_id=request.current_user.id, course_id__in=course_ids
        ).select_related('course')
        data = [
            {'id': a.course.id, 'name': a.course.name, 'code': a.course.code}
            for a in allocations
        ]
        return Response(data)
