import csv
import io
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from institutions.views import JWTView
from institutions.models import Student, Guardian, StudentGuardian, ActivityLog
from institutions.access import scoped_institution_filter, is_institution_allowed, load_permissions
from institutions.jwt_utils import generate_access_token, generate_refresh_token
from institutions.notification_service import NotificationService
from auth.views import _user_json
from .serializers import StudentSerializer, StudentListSerializer, GuardianSerializer
from .services import StudentService


class StudentSignupView(APIView):
    """
    Public: a prospective student creates their own account by proving
    institution membership with a join code. The account is NOT logged in —
    it must clear email OTP verification (StudentVerifyOtpView) and then the
    institution's approval (StudentApprovalView) before it can log in.
    """

    def post(self, request):
        try:
            StudentService.register_student(request.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': 'Account created. Check your email for a verification code.',
        }, status=status.HTTP_201_CREATED)


class StudentVerifyOtpView(APIView):
    """
    Public: confirm the OTP emailed at signup to mark the email verified,
    then log the student straight in — no separate trip to the login page
    re-typing email/password. Their institution's approval is still a hard
    gate on real access (enforced by JWTView.dispatch for every subsequent
    request via institutions.access.student_access_block), so a still-PENDING
    student holds a valid session but can't use any protected endpoint yet.
    """

    def post(self, request):
        email = request.data.get('email')
        code  = request.data.get('code')
        try:
            user = StudentService.verify_student_otp(email, code)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        access_token  = generate_access_token(user)
        refresh_token = generate_refresh_token(user)

        response = Response({
            'message': 'Email verified. Your account is now awaiting approval from your institution.',
            'user':    _user_json(user),
            'access':  access_token,
            'refresh': refresh_token,
        })
        response.set_cookie(
            key='access_token', value=access_token,
            httponly=True, secure=False, samesite='Lax',
            max_age=60 * 60 * 8, path='/',
        )
        response.set_cookie(
            key='refresh_token', value=refresh_token,
            httponly=True, secure=False, samesite='Lax',
            max_age=60 * 60 * 24 * 7, path='/',
        )
        return response


class StudentResendOtpView(APIView):
    """Public: re-send a fresh OTP, rate-limited per email."""

    def post(self, request):
        email = request.data.get('email')
        try:
            StudentService.resend_student_otp(email)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'A new verification code has been sent.'})


class StudentPendingListView(JWTView):
    """OWNER/MANAGER: students who verified their email and are awaiting approval."""
    allowed_roles = ['OWNER', 'MANAGER']

    def get(self, request):
        students = Student.objects.filter(
            is_deleted=False, status='PENDING', user__is_email_verified=True,
        ).select_related('institution', 'user')
        students = students.filter(**scoped_institution_filter(request.current_user, field='institution_id'))
        return Response(StudentListSerializer(students, many=True).data)


class StudentApproveView(JWTView):
    allowed_roles = ['OWNER', 'MANAGER']

    def post(self, request, pk):
        batch_id = request.data.get('batch_id') or None
        try:
            student = StudentService.approve_student(pk, request.current_user, batch_id=batch_id)
            return Response({
                'message': 'Student approved.',
                'data': StudentSerializer(student).data,
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentRejectView(JWTView):
    allowed_roles = ['OWNER', 'MANAGER']

    def post(self, request, pk):
        try:
            student = StudentService.reject_student(pk, request.current_user)
            return Response({
                'message': 'Student rejected.',
                'data': StudentSerializer(student).data,
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentMyGuardiansView(JWTView):
    """
    Self-service: GET lists guardians linked to the logged-in student's own
    profile, POST adds one (reusing an existing Guardian by email if a
    sibling already added them, so they share the same parent dashboard).
    """
    allowed_roles = ['STUDENT']

    def _student(self, request):
        try:
            return request.current_user.student_profile
        except Student.DoesNotExist:
            return None

    def get(self, request):
        student = self._student(request)
        if not student:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        guardians = StudentService.list_guardians_for_student(student)
        return Response(GuardianSerializer(guardians, many=True).data)

    def post(self, request):
        student = self._student(request)
        if not student:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            guardian, created, linked = StudentService.add_guardian_for_student(student, request.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not linked:
            message = f"{guardian.name} is already linked to your account."
        elif created:
            message = f"Guardian account created for {guardian.name} and linked to your profile."
        else:
            message = f"Linked existing guardian account for {guardian.name}."

        return Response(
            {'message': message, 'data': GuardianSerializer(guardian).data},
            status=status.HTTP_201_CREATED if linked else status.HTTP_200_OK,
        )


class StudentListCreateView(JWTView):
    # Student record administration is a staff function — a STUDENT role's
    # own view_student/create_student grants (meant for self-service, not
    # yet built) intentionally don't reach this bulk staff endpoint.
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    permission_map = {'GET': 'view_student', 'POST': 'create_student'}

    def get(self, request):
        search         = request.query_params.get('search', '')
        batch_id       = request.query_params.get('batch', None)

        students = Student.objects.filter(
            is_deleted=False
        ).select_related('batch', 'institution', 'user')
        students = students.filter(**scoped_institution_filter(request.current_user, field='institution_id'))

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

        institution_id = None
        batch_id = data.get('batch_id')
        if batch_id:
            from institutions.models import Batch
            try:
                institution_id = Batch.objects.get(id=batch_id).institution_id
            except Batch.DoesNotExist:
                return Response({'error': 'Batch not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if institution_id and not is_institution_allowed(request.current_user, institution_id):
            return Response(
                {'error': 'You cannot add students to this institution.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student    = StudentService.create_student(data, guardian_ids)
            serializer = StudentSerializer(student)
            return Response(
                {'message': 'Student created successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentBulkImportView(JWTView):
    """
    OWNER/MANAGER: create many students at once from an uploaded CSV
    (columns: name, email, phone, registration_no — registration_no is
    optional and auto-assigned the same way self-signup does). Every row
    goes through StudentService.create_student so it gets the exact same
    validation/creation behavior as the single-add form; a bad row is
    recorded as an error and the rest of the file still gets processed.
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    permission_map = {'POST': 'create_student'}

    MAX_ROWS = 500

    def post(self, request):
        from institutions.models import Institution, Batch

        institution_id = request.data.get('institution_id')
        batch_id = request.data.get('batch_id') or None
        upload = request.FILES.get('file')

        if not institution_id:
            return Response({'error': 'institution_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not is_institution_allowed(request.current_user, institution_id):
            return Response(
                {'error': 'You cannot add students to this institution.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if not upload:
            return Response({'error': 'A CSV file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            institution = Institution.objects.get(id=institution_id, is_deleted=False)
        except Institution.DoesNotExist:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if batch_id:
            try:
                batch = Batch.objects.get(id=batch_id)
            except Batch.DoesNotExist:
                return Response({'error': 'Batch not found.'}, status=status.HTTP_400_BAD_REQUEST)
            if batch.institution_id != institution.id:
                return Response(
                    {'error': 'That batch belongs to a different institution.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

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
            name = (row.get('name') or '').strip()
            email = (row.get('email') or '').strip()
            if not name and not email:
                continue  # skip fully blank rows
            if not name or not email:
                errors.append({'row': i, 'error': 'name and email are required.'})
                continue

            registration_no = (row.get('registration_no') or '').strip()
            if not registration_no:
                registration_no = StudentService._next_registration_no(institution)

            row_data = {
                'name': name,
                'email': email,
                'phone': (row.get('phone') or '').strip(),
                'registration_no': registration_no,
                'institution_id': institution.id,
                'batch_id': batch_id,
            }
            try:
                student = StudentService.create_student(row_data, notify=False)
                created_results.append({
                    'name': student.name,
                    'email': student.email,
                    'registration_no': student.registration_no,
                })
            except ValueError as e:
                errors.append({'row': i, 'error': str(e)})
            except Exception as e:
                # One malformed row (e.g. a uniqueness constraint create_student
                # doesn't pre-check for) must not 500 the rest of the file.
                errors.append({'row': i, 'error': f'Could not create this row: {e}'})

        if created_results:
            ActivityLog.objects.create(
                actor=request.current_user, module='STUDENT', action='CREATE',
                description=f"Bulk-imported {len(created_results)} student(s) via CSV into {institution.name}.",
            )
            NotificationService.notify_institution_staff(
                institution.id,
                title='Students imported',
                message=f"{len(created_results)} student(s) were added via CSV import.",
                link='/students',
            )

        return Response(
            {'created': len(created_results), 'errors': errors, 'results': created_results},
            status=status.HTTP_201_CREATED if created_results else status.HTTP_200_OK,
        )


class StudentDetailView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    permission_map = {'GET': 'view_student', 'PUT': 'edit_student', 'DELETE': 'delete_student'}

    def get_object(self, request, pk):
        try:
            student = Student.objects.select_related(
                'batch', 'institution', 'user'
            ).prefetch_related(
                'student_guardians__guardian'
            ).get(id=pk, is_deleted=False)
        except Student.DoesNotExist:
            return None

        if not is_institution_allowed(request.current_user, student.institution_id):
            return None
        return student

    def get(self, request, pk):
        student = self.get_object(request, pk)
        if not student:
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StudentSerializer(student)
        return Response(serializer.data)

    def put(self, request, pk):
        if not self.get_object(request, pk):
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        target_batch_id = request.data.get('batch_id')
        if target_batch_id:
            from institutions.models import Batch
            try:
                target_institution_id = Batch.objects.get(id=target_batch_id).institution_id
            except Batch.DoesNotExist:
                return Response({'error': 'Batch not found.'}, status=status.HTTP_400_BAD_REQUEST)
            if not is_institution_allowed(request.current_user, target_institution_id):
                return Response(
                    {'error': 'You cannot move students to this institution.'},
                    status=status.HTTP_403_FORBIDDEN
                )

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
        if not self.get_object(request, pk):
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            StudentService.delete_student(pk)
            return Response({'message': 'Student deleted successfully.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GuardianListCreateView(JWTView):
    """
    GET is scoped to guardians linked to a student in the caller's own
    institution(s) — e.g. a MANAGER creating/editing a student should only
    see that institution's guardians, not every guardian platform-wide.
    """
    permission_map = {'GET': 'view_guardian', 'POST': 'manage_guardian'}

    def get(self, request):
        student_filter = scoped_institution_filter(request.current_user, field='institution_id')
        guardian_ids = StudentGuardian.objects.filter(
            student__is_deleted=False,
            **{f'student__{key}': value for key, value in student_filter.items()}
        ).values_list('guardian_id', flat=True).distinct()

        guardians  = Guardian.objects.filter(id__in=guardian_ids).order_by('name')
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
