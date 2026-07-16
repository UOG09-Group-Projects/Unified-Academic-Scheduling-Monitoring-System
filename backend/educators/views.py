from rest_framework.response import Response
from rest_framework import status
from institutions.views import JWTView
from institutions.models import Educator, Role, User, Allocation, StudentGuardian
from institutions.access import scoped_institution_filter, is_institution_allowed, has_permission
from .serializers import EducatorSerializer


def _is_my_educator(user, educator):
    """
    A student/parent may view an educator's basic info if that educator
    actually teaches one of their (or their child's) courses — independent
    of the staff-facing view_educator permission.
    """
    role = user.role.name.upper()

    if role == 'STUDENT':
        try:
            batch = user.student_profile.batch
        except Exception:
            return False
        if not batch:
            return False
        return Allocation.objects.filter(
            educator=educator, course__course_batches__batch=batch
        ).exists()

    if role == 'PARENT':
        try:
            guardian = user.guardian_profile
        except Exception:
            return False
        child_ids = StudentGuardian.objects.filter(guardian=guardian).values_list('student_id', flat=True)
        return Allocation.objects.filter(
            educator=educator, course__course_batches__batch__students__id__in=child_ids
        ).exists()

    return False


class EducatorListCreateView(JWTView):
    permission_map = {'GET': 'view_educator', 'POST': 'create_educator'}

    def get(self, request):
        educators = Educator.objects.select_related('institution', 'user').all()
        educators = educators.filter(**scoped_institution_filter(request.current_user))

        institution_id = request.query_params.get('institution_id')
        if institution_id:
            educators = educators.filter(institution_id=institution_id)

        serializer = EducatorSerializer(educators, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        email    = (data.get('email') or '').strip()
        password = data.get('password')
        institution_id = data.get('institution')

        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not institution_id:
            return Response({'error': 'Institution is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not is_institution_allowed(request.current_user, institution_id):
            return Response(
                {'error': 'You cannot create educators for this institution.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if User.objects.filter(email=email).exists():
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        educator_role, _ = Role.objects.get_or_create(name='EDUCATOR')
        user = User(
            username=email, email=email, role=educator_role,
            is_active=True, is_email_verified=True,
        )
        user.set_password(password)
        user.save()

        serializer = EducatorSerializer(data=data)
        if serializer.is_valid():
            try:
                educator = serializer.save(user=user)
                return Response(EducatorSerializer(educator).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                user.delete()
                return Response({'error': f'Failed to create educator: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EducatorDetailView(JWTView):
    # GET is authorized manually below (staff view_educator OR "this is my
    # / my child's educator") rather than through the blanket permission
    # gate, since students/parents legitimately need to see their own
    # educators' basic info without holding the staff view_educator grant.
    permission_map = {
        'PUT': 'edit_educator', 'PATCH': 'edit_educator', 'DELETE': 'delete_educator',
    }

    def get_object(self, request, pk):
        try:
            educator = Educator.objects.select_related('institution', 'user').get(pk=pk)
        except Educator.DoesNotExist:
            return None
        if not is_institution_allowed(request.current_user, educator.institution_id):
            return None
        return educator

    def get(self, request, pk):
        try:
            educator = Educator.objects.select_related('institution', 'user').get(pk=pk)
        except Educator.DoesNotExist:
            return Response({'error': 'Educator not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.current_user
        staff_allowed = has_permission(user, 'view_educator') and is_institution_allowed(user, educator.institution_id)

        if not staff_allowed and not _is_my_educator(user, educator):
            return Response({'error': 'Educator not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(EducatorSerializer(educator).data)

    def _update(self, request, pk, partial):
        educator = self.get_object(request, pk)
        if not educator:
            return Response({'error': 'Educator not found.'}, status=status.HTTP_404_NOT_FOUND)

        target_institution = request.data.get('institution', educator.institution_id)
        if not is_institution_allowed(request.current_user, target_institution):
            return Response(
                {'error': 'You cannot move educators to this institution.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()
        password = data.get('password')
        if password and educator.user:
            educator.user.set_password(password)
            educator.user.save()

        serializer = EducatorSerializer(educator, data=data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def delete(self, request, pk):
        educator = self.get_object(request, pk)
        if not educator:
            return Response({'error': 'Educator not found.'}, status=status.HTTP_404_NOT_FOUND)
        educator.delete()
        return Response({'message': 'Educator deleted successfully.'})
