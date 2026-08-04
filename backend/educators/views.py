import csv
import io
from rest_framework.response import Response
from rest_framework import status
from institutions.views import JWTView
from institutions.models import Educator, Allocation, StudentGuardian, ActivityLog
from institutions.access import scoped_institution_filter, is_institution_allowed, has_permission
from institutions.notification_service import NotificationService
from .serializers import EducatorSerializer
from .services import create_educator


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
        institution_id = data.get('institution')

        if not institution_id:
            return Response({'error': 'Institution is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not is_institution_allowed(request.current_user, institution_id):
            return Response(
                {'error': 'You cannot create educators for this institution.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            educator = create_educator(data)
            return Response(EducatorSerializer(educator).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EducatorBulkImportView(JWTView):
    """
    OWNER/MANAGER: create many educators at once from an uploaded CSV
    (columns: edu_id, name, email, phone). No password column — a missing
    password defaults to the row's edu_id, mirroring how bulk-imported
    students default to their registration_no (see
    students/views.py::StudentBulkImportView). Every row goes through the
    same create_educator() used by the single-add form; a bad row is
    recorded as an error and the rest of the file still gets processed.
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    permission_map = {'POST': 'create_educator'}

    MAX_ROWS = 500

    def post(self, request):
        from institutions.models import Institution

        institution_id = request.data.get('institution_id')
        upload = request.FILES.get('file')

        if not institution_id:
            return Response({'error': 'institution_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not is_institution_allowed(request.current_user, institution_id):
            return Response(
                {'error': 'You cannot create educators for this institution.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if not upload:
            return Response({'error': 'A CSV file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            institution = Institution.objects.get(id=institution_id, is_deleted=False)
        except Institution.DoesNotExist:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rows = list(csv.DictReader(io.TextIOWrapper(upload.file, encoding='utf-8-sig')))
        except Exception:
            return Response({'error': 'Could not read that file as CSV.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(rows) > self.MAX_ROWS:
            return Response(
                {'error': f'CSV has too many rows (max {self.MAX_ROWS}).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_results = []
        errors = []

        for i, row in enumerate(rows, start=2):  # row 1 is the header
            edu_id = (row.get('edu_id') or '').strip()
            name = (row.get('name') or '').strip()
            email = (row.get('email') or '').strip()
            if not edu_id and not name and not email:
                continue  # skip fully blank rows
            if not edu_id or not name or not email:
                errors.append({'row': i, 'error': 'edu_id, name, and email are required.'})
                continue

            row_data = {
                'edu_id': edu_id,
                'name': name,
                'email': email,
                'phone': (row.get('phone') or '').strip(),
                'password': edu_id,
                'institution': institution.id,
            }
            try:
                educator = create_educator(row_data)
                created_results.append({
                    'edu_id': educator.edu_id,
                    'name': educator.name,
                    'email': educator.email,
                })
            except ValueError as e:
                errors.append({'row': i, 'error': str(e)})
            except Exception as e:
                errors.append({'row': i, 'error': f'Could not create this row: {e}'})

        if created_results:
            ActivityLog.objects.create(
                actor=request.current_user, module='EDUCATOR', action='CREATE',
                description=f"Bulk-imported {len(created_results)} educator(s) via CSV into {institution.name}.",
            )
            NotificationService.notify_institution_staff(
                institution.id,
                title='Educators imported',
                message=f"{len(created_results)} educator(s) were added via CSV import.",
                link='/educators',
            )

        return Response(
            {'created': len(created_results), 'errors': errors, 'results': created_results},
            status=status.HTTP_201_CREATED if created_results else status.HTTP_200_OK,
        )


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
