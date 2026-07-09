from rest_framework.response import Response
from rest_framework import status
from institutions.views import JWTView
from institutions.models import Student, Guardian
from .serializers import StudentSerializer, StudentListSerializer, GuardianSerializer
from .services import StudentService


class StudentListCreateView(JWTView):

    def get(self, request):
        search         = request.query_params.get('search', '')
        batch_id       = request.query_params.get('batch', None)

        students = Student.objects.filter(
            is_deleted=False
        ).select_related('batch', 'user')

        if search:
            students = students.filter(name__icontains=search) | \
                       students.filter(registration_no__icontains=search) | \
                       students.filter(email__icontains=search)

        if batch_id:
            students = students.filter(batch_id=batch_id)

        serializer = StudentListSerializer(students, many=True)
        return Response(serializer.data)

    def post(self, request):
        data         = request.data
        guardian_ids = request.data.get('guardian_ids', [])
        try:
            student    = StudentService.create_student(data, guardian_ids)
            serializer = StudentSerializer(student)
            return Response(
                {'message': 'Student created successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentDetailView(JWTView):

    def get(self, request, pk):
        try:
            student    = Student.objects.select_related(
                'batch', 'user'
            ).prefetch_related(
                'student_guardians__guardian'
            ).get(id=pk, is_deleted=False)
            serializer = StudentSerializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def put(self, request, pk):
        guardian_ids = request.data.get('guardian_ids', None)
        try:
            student    = StudentService.update_student(pk, request.data, guardian_ids)
            serializer = StudentSerializer(student)
            return Response(
                {'message': 'Student updated successfully.', 'data': serializer.data}
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            StudentService.delete_student(pk)
            return Response({'message': 'Student deleted successfully.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GuardianListCreateView(JWTView):

    def get(self, request):
        guardians  = StudentService.list_guardians()
        serializer = GuardianSerializer(guardians, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            guardian   = StudentService.create_guardian(request.data)
            serializer = GuardianSerializer(guardian)
            return Response(
                {'message': 'Guardian created successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)