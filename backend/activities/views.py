from rest_framework.response import Response
from institutions.views import JWTView
from institutions.access import has_permission
from .services import ActivityService, ProgressService


def _activity_json(a):
    return {
        'id': a.id,
        'name': a.name,
        'due_date': a.due_date,
        'description': a.description,
        'optional': a.optional,
        'course_id': a.course_id,
    }


class CourseActivitiesView(JWTView):
    """GET /api/activities/?course_id=X   POST /api/activities/"""

    def get(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id is required.'}, status=400)

        activities = ActivityService.list_for_course(request.current_user, course_id)
        if activities is None:
            return Response({'error': 'Not found.'}, status=404)

        return Response([_activity_json(a) for a in activities])

    def post(self, request):
        if not has_permission(request.current_user, 'create_activity'):
            return Response({'error': 'Permission denied.'}, status=403)
        try:
            activity = ActivityService.create(request.current_user, request.data)
            return Response({'message': 'Activity created.', 'data': _activity_json(activity)}, status=201)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)


class CourseRosterView(JWTView):
    """GET /api/activities/course-roster/?course_id=X — students in an educator's own course."""

    def get(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id is required.'}, status=400)

        students = ActivityService.list_roster(request.current_user, course_id)
        if students is None:
            return Response({'error': 'Not found.'}, status=404)

        return Response([
            {'id': s.id, 'name': s.name, 'registration_no': s.registration_no}
            for s in students
        ])


class ActivityDetailView(JWTView):
    """PUT/DELETE /api/activities/<pk>/"""

    def put(self, request, pk):
        if not has_permission(request.current_user, 'edit_activity'):
            return Response({'error': 'Permission denied.'}, status=403)
        try:
            activity = ActivityService.update(request.current_user, pk, request.data)
            return Response({'message': 'Activity updated.', 'data': _activity_json(activity)})
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

    def delete(self, request, pk):
        if not has_permission(request.current_user, 'delete_activity'):
            return Response({'error': 'Permission denied.'}, status=403)
        try:
            ActivityService.delete(request.current_user, pk)
            return Response({'message': 'Activity deleted.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=400)


class StudentProgressView(JWTView):
    """
    GET  /api/progress/?student_id=X  — view a student's progress (self / child / own-course educator)
    POST /api/progress/               — educator sets a student's progress for one activity
    """

    def get(self, request):
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({'error': 'student_id is required.'}, status=400)

        records = ProgressService.list_for_student(request.current_user, student_id)
        if records is None:
            return Response({'error': 'Not found.'}, status=404)

        return Response([
            {
                'id': p.id,
                'value': float(p.value) if p.value is not None else None,
                'completed': p.completed,
                'completed_at': p.completed_at,
                'activity': {
                    'id': p.activity.id,
                    'name': p.activity.name,
                    'course_id': p.activity.course_id,
                    'course_name': p.activity.course.name,
                },
            }
            for p in records
        ])

    def post(self, request):
        role = request.current_user.role.name.upper()

        if role == 'EDUCATOR':
            try:
                progress = ProgressService.set_progress(
                    request.current_user,
                    request.data.get('student_id'),
                    request.data.get('activity_id'),
                    request.data.get('value'),
                )
                return Response({'message': 'Progress updated.', 'data': {'id': progress.id, 'value': float(progress.value)}})
            except ValueError as e:
                return Response({'error': str(e)}, status=400)

        if role == 'STUDENT':
            # Self-report only — never touches the educator's `value` grade.
            try:
                progress = ProgressService.mark_complete(
                    request.current_user,
                    request.data.get('student_id'),
                    request.data.get('activity_id'),
                    request.data.get('completed'),
                )
                return Response({
                    'message': 'Task updated.',
                    'data': {'id': progress.id, 'completed': progress.completed, 'completed_at': progress.completed_at},
                })
            except ValueError as e:
                return Response({'error': str(e)}, status=400)

        return Response({'error': 'Permission denied.'}, status=403)
