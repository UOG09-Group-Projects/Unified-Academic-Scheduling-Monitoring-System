from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Course
from .serializers import CourseSerializer
from .services import CourseService


class CourseListView(APIView):

    def get(self, request):
        search = request.query_params.get('search', '')
        institution_id = request.query_params.get('institution', None)

        courses = Course.objects.filter(is_deleted=False).select_related('institution')

        if search:
            courses = courses.filter(name__icontains=search) | \
                      courses.filter(code__icontains=search)

        if institution_id:
            courses = courses.filter(institution_id=institution_id)

        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            course = CourseService.create_course(request.data)
            serializer = CourseSerializer(course)
            return Response(
                {'message': 'Course created successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CourseDetailView(APIView):

    def get(self, request, pk):
        try:
            course = Course.objects.get(id=pk, is_deleted=False)
            serializer = CourseSerializer(course)
            return Response(serializer.data)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            course = CourseService.update_course(pk, request.data)
            serializer = CourseSerializer(course)
            return Response(
                {'message': 'Course updated successfully.', 'data': serializer.data}
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            CourseService.delete_course(pk)
            return Response({'message': 'Course deleted successfully.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
