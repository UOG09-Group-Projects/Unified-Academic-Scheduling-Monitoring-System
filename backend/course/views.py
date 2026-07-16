from django.shortcuts import render
from institutions.views import JWTView
from rest_framework.response import Response
from rest_framework import status
from institutions.models import Course
from institutions.access import scoped_institution_filter, is_institution_allowed
from .serializers import CourseSerializer
from .services import CourseService


class CourseListView(JWTView):
    permission_map = {'GET': 'view_course', 'POST': 'create_course'}

    def get(self, request):
        search = request.query_params.get('search', '')
        institution_id = request.query_params.get('institution', None)

        courses = Course.objects.filter(is_deleted=False).select_related('institution')
        courses = courses.filter(**scoped_institution_filter(request.current_user))

        if search:
            courses = courses.filter(name__icontains=search) | courses.filter(code__icontains=search)

        if institution_id:
            courses = courses.filter(institution_id=institution_id)

        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            course = CourseService.create_course(request.data, request.current_user)
            serializer = CourseSerializer(course)
            return Response(
                {'message': 'Course created successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CourseDetailView(JWTView):
    permission_map = {'GET': 'view_course', 'PUT': 'edit_course', 'DELETE': 'delete_course'}

    def get_object(self, request, pk):
        try:
            course = Course.objects.select_related('institution').get(id=pk, is_deleted=False)
        except Course.DoesNotExist:
            return None
        if not is_institution_allowed(request.current_user, course.institution_id):
            return None
        return course

    def get(self, request, pk):
        course = self.get_object(request, pk)
        if not course:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseSerializer(course)
        return Response(serializer.data)

    def put(self, request, pk):
        if not self.get_object(request, pk):
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            course = CourseService.update_course(pk, request.data, request.current_user)
            serializer = CourseSerializer(course)
            return Response(
                {'message': 'Course updated successfully.', 'data': serializer.data}
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not self.get_object(request, pk):
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            CourseService.delete_course(pk)
            return Response({'message': 'Course deleted successfully.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
