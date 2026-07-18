from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from institutions.models import Enrollment, Course, Student
from .serializers import EnrollmentSerializer


class EnrollmentListCreateView(generics.ListCreateAPIView):
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        student_id = self.request.query_params.get("student")

        if student_id:
            return Enrollment.objects.filter(student_id=student_id).select_related("student", "course")

        return Enrollment.objects.all().select_related("student", "course")

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if "student" in data and isinstance(data["student"], str):
            data["student"] = int(data["student"])
        if "course" in data and isinstance(data["course"], str):
            data["course"] = int(data["course"])

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Enrollment.objects.all().select_related("student", "course")
    serializer_class = EnrollmentSerializer


class EnrollmentDropdownDataView(APIView):
    def get(self, request):
        students = Student.objects.filter(is_deleted=False).values("id", "name", "email")
        courses = Course.objects.filter(is_deleted=False).values("id", "name", "code")

        return Response({
            "students": list(students),
            "courses": list(courses),
        })
