from institutions.views import JWTView
from rest_framework.response import Response
from rest_framework import status
from .services import EnrollmentService


class AvailableCoursesView(JWTView):
    permission_map = {'GET': 'view_enrollment'}

    def get(self, request):
        return Response(EnrollmentService.list_available_courses(request.current_user))


class EnrollmentListView(JWTView):
    permission_map = {'POST': 'create_enrollment'}

    def post(self, request):
        try:
            enrolment = EnrollmentService.enroll(request.current_user, request.data.get('course_id'))
            return Response(
                {
                    'message': 'Enrolled successfully.',
                    'data': {
                        'id': enrolment.id,
                        'course': {
                            'id': enrolment.course.id,
                            'name': enrolment.course.name,
                            'code': enrolment.course.code,
                        },
                        'enrolled_date': enrolment.enrolled_date,
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EnrollmentDetailView(JWTView):
    permission_map = {'DELETE': 'delete_enrollment'}

    def delete(self, request, pk):
        try:
            EnrollmentService.unenroll(request.current_user, pk)
            return Response({'message': 'Unenrolled successfully.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
