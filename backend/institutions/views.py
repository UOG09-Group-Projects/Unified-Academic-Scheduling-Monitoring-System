from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse as DjangoJsonResponse, HttpResponse
from django.db import models
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
import calendar
import csv
import datetime
import json
from .models import Institution, User, ActivityLog, LoginActivity, StudentGuardian, Manager, Educator, Student, Guardian, Course, Batch, Complaint, Announcement
from .serializers import InstitutionListSerializer, ActivityLogSerializer, LoginActivitySerializer, AnnouncementSerializer
from managers.serializers import ManagerListSerializer
from educators.serializers import EducatorSerializer
from students.serializers import StudentListSerializer, GuardianSerializer
from .services import InstitutionService, AnnouncementService
from .jwt_utils import decode_token, generate_impersonation_token
from .access import (
    load_permissions, has_permission, resolve_institution_id, scoped_institution_filter,
    is_institution_allowed, owned_institution_ids, institution_member_user_ids,
    student_access_block, impersonation_write_block,
)
import jwt


# ---------------------------------------------------------------------------
# Base class — replaces ProtectedView
# Reads the access_token cookie, decodes it, sets request.current_user.
# Override allowed_roles = [...] in subclasses to restrict by role.
# Override permission_map = {'GET': 'view_x', 'POST': 'create_x', ...} to
# additionally require a specific permission (from roles_permissions) per
# HTTP method — checked after allowed_roles, before the view method runs.
# SUPER_ADMIN always bypasses both checks.
# ---------------------------------------------------------------------------

class JWTView(APIView):
    allowed_roles = None
    permission_map = None

    def dispatch(self, request, *args, **kwargs):
        # Header takes priority over the cookie so that multiple tabs of the
        # same browser (which share one cookie jar) can each act as a
        # different logged-in user via their own per-tab bearer token.
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
        else:
            token = request.COOKIES.get('access_token')

        if not token:
            return DjangoJsonResponse(
                {'error': 'Authentication required.'},
                status=401
            )

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return DjangoJsonResponse({'error': 'Token expired.'}, status=401)
        except jwt.InvalidTokenError:
            return DjangoJsonResponse({'error': 'Invalid token.'}, status=401)

        if payload.get('token_type') != 'access':
            return DjangoJsonResponse({'error': 'Invalid token type.'}, status=401)

        block_reason = impersonation_write_block(payload, request)
        if block_reason:
            return DjangoJsonResponse({'error': block_reason}, status=403)

        if self.allowed_roles:
            user_role = payload.get('role', '').upper()
            allowed = [r.upper() for r in self.allowed_roles]
            if user_role not in allowed:
                return DjangoJsonResponse({'error': 'Permission denied.'}, status=403)

        try:
            user = User.objects.select_related('role').get(id=payload['user_id'])
        except User.DoesNotExist:
            return DjangoJsonResponse({'error': 'User not found.'}, status=401)

        block_reason = student_access_block(user)
        if block_reason:
            return DjangoJsonResponse({'error': block_reason}, status=403)

        # Attach institution_id from JWT payload so services can read it
        # without an extra DB query
        user.institution_id = payload.get('institution_id')
        user.impersonated_by = payload.get('impersonated_by')
        user.permissions = load_permissions(user)

        if self.permission_map:
            required = self.permission_map.get(request.method)
            if required and not has_permission(user, required):
                return DjangoJsonResponse({'error': 'Permission denied.'}, status=403)

        request.current_user = user
        return super().dispatch(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Institution views
# ---------------------------------------------------------------------------

class InstitutionPublicListView(APIView):
    """
    Public, unauthenticated: the institution picker on the student signup
    page. Deliberately exposes only id/name — nothing sensitive.
    """

    def get(self, request):
        institutions = Institution.objects.filter(is_deleted=False).order_by('name')
        return Response([{'id': i.id, 'name': i.name} for i in institutions])


class InstitutionRegisterView(APIView):
    """
    Public, unauthenticated: a prospective institution owner registers their
    institution from the landing page. Unlike student signup, this does NOT
    log the user in — the institution is created with status=PENDING and a
    super admin must approve it (see InstitutionStatusView) before the owner
    can log in (enforced in auth.views.login_view).
    """

    def post(self, request):
        from .models import PlatformSettings
        if not PlatformSettings.load().registration_open:
            return Response(
                {'error': 'Institution registration is currently closed.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo')

        try:
            institution = InstitutionService.create_institution(
                data=data, logo=logo, status='PENDING',
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Registration submitted. A super admin will review it shortly.',
                'data': InstitutionListSerializer(institution, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class InstitutionStatusView(JWTView):
    """Super admin approves or rejects a pending institution registration."""
    allowed_roles = ['SUPER_ADMIN']

    def patch(self, request, pk):
        try:
            institution = Institution.objects.get(pk=pk, is_deleted=False)
        except Institution.DoesNotExist:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = (request.data.get('status') or '').upper()
        try:
            updated = InstitutionService.set_status(institution, new_status, actor=request.current_user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InstitutionListSerializer(updated, context={'request': request})
        return Response({'message': f'Institution {new_status.lower()}.', 'data': serializer.data})


class InstitutionJoinCodeView(JWTView):
    """
    OWNER/MANAGER: view (GET) and regenerate (POST) the join code prospective
    students enter at signup to prove they belong to this institution.
    """
    allowed_roles = ['OWNER', 'MANAGER']

    def _institution(self, request):
        role = request.current_user.role.name.upper()
        if role == 'OWNER':
            return request.current_user.owned_institutions.filter(is_deleted=False).order_by('-created_at').first()
        institution_id = resolve_institution_id(request.current_user)
        if not institution_id:
            return None
        return Institution.objects.filter(id=institution_id, is_deleted=False).first()

    def get(self, request):
        institution = self._institution(request)
        if not institution:
            return Response({'error': 'No institution found for this account.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'join_code': institution.join_code})

    def post(self, request):
        institution = self._institution(request)
        if not institution:
            return Response({'error': 'No institution found for this account.'}, status=status.HTTP_404_NOT_FOUND)
        institution = InstitutionService.regenerate_join_code(institution, actor=request.current_user)
        return Response({'join_code': institution.join_code})


class InstitutionSemesterView(JWTView):
    """
    The semester date range TimetableSlot (weekday + time, no dates) gets
    projected across on the calendar — see
    frontend/src/utils/timetableEvents.js. GET is open to every role with a
    stake in the calendar (they all need these dates to render it); PATCH
    is OWNER/MANAGER only, checked inline rather than via allowed_roles
    since that would restrict GET too.
    """
    allowed_roles = ['OWNER', 'MANAGER', 'EDUCATOR', 'STUDENT']

    def _institution(self, request):
        role = request.current_user.role.name.upper()
        if role == 'OWNER':
            return request.current_user.owned_institutions.filter(is_deleted=False).order_by('-created_at').first()
        institution_id = resolve_institution_id(request.current_user)
        if not institution_id:
            return None
        return Institution.objects.filter(id=institution_id, is_deleted=False).first()

    def get(self, request):
        institution = self._institution(request)
        if not institution:
            return Response({'error': 'No institution found for this account.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'semester_start': institution.semester_start,
            'semester_end':   institution.semester_end,
        })

    def patch(self, request):
        if request.current_user.role.name.upper() not in ('OWNER', 'MANAGER'):
            return Response(
                {'error': 'Only managers can set the semester dates.'}, status=status.HTTP_403_FORBIDDEN
            )
        institution = self._institution(request)
        if not institution:
            return Response({'error': 'No institution found for this account.'}, status=status.HTTP_404_NOT_FOUND)

        start = request.data.get('semester_start')
        end   = request.data.get('semester_end')
        if not start or not end:
            return Response({'error': 'semester_start and semester_end are both required.'}, status=status.HTTP_400_BAD_REQUEST)
        if start >= end:
            return Response({'error': 'semester_start must be before semester_end.'}, status=status.HTTP_400_BAD_REQUEST)

        institution.semester_start = start
        institution.semester_end   = end
        institution.save(update_fields=['semester_start', 'semester_end'])
        return Response({
            'semester_start': institution.semester_start,
            'semester_end':   institution.semester_end,
        })


# ---------------------------------------------------------------------------
# Platform settings (SUPER_ADMIN)
# ---------------------------------------------------------------------------

def _platform_settings_json(settings_obj):
    return {
        'platform_name':           settings_obj.platform_name,
        'support_email':           settings_obj.support_email,
        'registration_open':       settings_obj.registration_open,
        'maintenance_mode':        settings_obj.maintenance_mode,
        'session_timeout_minutes': settings_obj.session_timeout_minutes,
        'otp_max_attempts':        settings_obj.otp_max_attempts,
        'updated_at':              settings_obj.updated_at,
        'updated_by':              settings_obj.updated_by.username if settings_obj.updated_by else None,
    }


class PlatformSettingsView(JWTView):
    """SUPER_ADMIN: view/edit the platform-wide singleton settings row."""
    allowed_roles = ['SUPER_ADMIN']

    def get(self, request):
        import sys
        import django as django_module
        from .models import PlatformSettings

        settings_obj = PlatformSettings.load()
        data = _platform_settings_json(settings_obj)
        data['system_info'] = {
            'django_version':     '.'.join(str(p) for p in django_module.VERSION[:3]),
            'python_version':     sys.version.split()[0],
            'total_institutions': Institution.objects.filter(is_deleted=False).count(),
            'total_users':        User.objects.count(),
        }
        return Response(data)

    def patch(self, request):
        from .models import PlatformSettings

        settings_obj = PlatformSettings.load()
        data = request.data

        if 'platform_name' in data:
            name = (data.get('platform_name') or '').strip()
            if not name:
                return Response({'error': 'Platform name cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            settings_obj.platform_name = name

        if 'support_email' in data:
            email = (data.get('support_email') or '').strip()
            if email:
                from django.core.validators import validate_email
                from django.core.exceptions import ValidationError
                try:
                    validate_email(email)
                except ValidationError:
                    return Response({'error': 'Invalid support email.'}, status=status.HTTP_400_BAD_REQUEST)
            settings_obj.support_email = email

        if 'registration_open' in data:
            settings_obj.registration_open = bool(data.get('registration_open'))

        if 'maintenance_mode' in data:
            settings_obj.maintenance_mode = bool(data.get('maintenance_mode'))

        if 'session_timeout_minutes' in data:
            try:
                minutes = int(data.get('session_timeout_minutes'))
            except (TypeError, ValueError):
                return Response({'error': 'session_timeout_minutes must be a number.'}, status=status.HTTP_400_BAD_REQUEST)
            if not (5 <= minutes <= 1440):
                return Response({'error': 'Session timeout must be between 5 and 1440 minutes.'}, status=status.HTTP_400_BAD_REQUEST)
            settings_obj.session_timeout_minutes = minutes

        if 'otp_max_attempts' in data:
            try:
                attempts = int(data.get('otp_max_attempts'))
            except (TypeError, ValueError):
                return Response({'error': 'otp_max_attempts must be a number.'}, status=status.HTTP_400_BAD_REQUEST)
            if not (3 <= attempts <= 10):
                return Response({'error': 'Max OTP attempts must be between 3 and 10.'}, status=status.HTTP_400_BAD_REQUEST)
            settings_obj.otp_max_attempts = attempts

        settings_obj.updated_by = request.current_user
        settings_obj.save()
        return Response(_platform_settings_json(settings_obj))


class PlatformSettingsResetView(JWTView):
    """SUPER_ADMIN: reset platform settings back to model defaults."""
    allowed_roles = ['SUPER_ADMIN']

    def post(self, request):
        from .models import PlatformSettings

        PlatformSettings.objects.filter(pk=1).delete()
        settings_obj = PlatformSettings.load()
        return Response(_platform_settings_json(settings_obj))


class PublicPlatformSettingsView(APIView):
    """
    Public, unauthenticated: the safe-to-expose subset — used by the
    frontend's boot-time maintenance-mode check and the public site footer.
    """

    def get(self, request):
        from .models import PlatformSettings

        settings_obj = PlatformSettings.load()
        return Response({
            'platform_name':    settings_obj.platform_name,
            'support_email':    settings_obj.support_email,
            'maintenance_mode': settings_obj.maintenance_mode,
        })


# ---------------------------------------------------------------------------
# Impersonation ("view as") — SUPER_ADMIN only, read-only, auto-expiring.
# See institutions/jwt_utils.py::generate_impersonation_token and
# institutions/access.py::impersonation_write_block for the enforcement.
# ---------------------------------------------------------------------------

IMPERSONATION_MINUTES = 30


class ImpersonateStartView(JWTView):
    allowed_roles = ['SUPER_ADMIN']

    def post(self, request):
        from auth.views import _user_json

        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target = User.objects.select_related('role').get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No user found with that email.'}, status=status.HTTP_404_NOT_FOUND)

        if target.role.name.upper() == 'SUPER_ADMIN':
            return Response({'error': 'Cannot impersonate another super admin.'}, status=status.HTTP_403_FORBIDDEN)
        if not target.is_active:
            return Response({'error': 'This account is deactivated.'}, status=status.HTTP_403_FORBIDDEN)

        token = generate_impersonation_token(request.current_user, target, minutes=IMPERSONATION_MINUTES)
        expires_at = timezone.now() + datetime.timedelta(minutes=IMPERSONATION_MINUTES)

        ActivityLog.objects.create(
            actor=request.current_user, module='AUTH', action='UPDATE',
            description=f"{request.current_user.username} started impersonating {target.username}.",
        )

        data = _user_json(target)
        data['impersonating'] = True
        data['real_admin'] = {'id': request.current_user.id, 'username': request.current_user.username}

        return Response({
            'user': data,
            'access': token,
            'impersonation_expires_at': expires_at.isoformat(),
        })


class ImpersonateStopView(JWTView):
    """
    No allowed_roles restriction — while impersonating, the caller's token
    presents as the *target's* role, not SUPER_ADMIN, so this has to be
    reachable by any authenticated role (it no-ops harmlessly if
    impersonated_by isn't set). Exempted from the write-block in
    institutions/access.py — it's the only way to exit.
    """

    def post(self, request):
        admin_id = getattr(request.current_user, 'impersonated_by', None)
        if admin_id:
            try:
                admin = User.objects.get(pk=admin_id)
                ActivityLog.objects.create(
                    actor=admin, module='AUTH', action='UPDATE',
                    description=f"{admin.username} stopped impersonating {request.current_user.username}.",
                )
            except User.DoesNotExist:
                pass
        return Response({'message': 'Impersonation ended.'})


class InstitutionListCreateView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    # No create_institution/delete_institution permission exists in the
    # permissions table yet — POST stays gated by allowed_roles only.
    # GET is authorized manually below: view_institution holders get the
    # full (role-scoped) list; everyone else (MANAGER/EDUCATOR/STUDENT —
    # whose forms need to know their *own* institution for dropdowns, even
    # without the staff browsing permission) gets just their own institution.

    def get(self, request):
        user = request.current_user
        institutions = Institution.objects.filter(is_deleted=False).select_related('owner')

        if has_permission(user, 'view_institution'):
            institutions = institutions.filter(**scoped_institution_filter(user, field='id'))
        else:
            inst_id = resolve_institution_id(user)
            institutions = institutions.filter(id=inst_id) if inst_id else institutions.none()

        serializer = InstitutionListSerializer(
            institutions,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo')

        # current_user is now a real User object
        data['owner_id'] = request.current_user.id

        try:
            institution = InstitutionService.create_institution(
                data=data,
                logo=logo,
                actor=request.current_user,
            )
            serializer = InstitutionListSerializer(
                institution,
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class InstitutionDetailView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    # No delete_institution permission exists yet — DELETE stays
    # gated by allowed_roles only. GET is authorized manually (see below).
    permission_map = {'PUT': 'edit_institution'}

    def get_object(self, pk):
        try:
            return Institution.objects.select_related('owner').get(
                pk=pk, is_deleted=False
            )
        except Institution.DoesNotExist:
            return None

    def get(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.current_user
        can_view = has_permission(user, 'view_institution') or is_institution_allowed(user, institution.id)
        if not can_view:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = InstitutionListSerializer(
            institution, context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo')

        try:
            updated = InstitutionService.update_institution(
                institution, data=data, logo=logo, actor=request.current_user,
            )
            serializer = InstitutionListSerializer(
                updated, context={'request': request}
            )
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        InstitutionService.soft_delete_institution(institution, actor=request.current_user)
        return Response(
            {'message': 'Institution deleted successfully.'},
            status=status.HTTP_200_OK
        )


# ---------------------------------------------------------------------------
# Owner Users — every user enrolled in an OWNER's institution(s), grouped
# by category. Powers the Owner dashboard's Users page.
# ---------------------------------------------------------------------------

class OwnerUsersListView(JWTView):
    allowed_roles = ['OWNER']

    def get(self, request):
        institution_ids = owned_institution_ids(request.current_user)

        managers = Manager.objects.filter(
            institution_id__in=institution_ids
        ).select_related('user', 'institution')

        educators = Educator.objects.filter(
            institution_id__in=institution_ids
        ).select_related('institution', 'user')

        students = Student.objects.filter(
            institution_id__in=institution_ids, is_deleted=False
        ).select_related('batch', 'institution')

        guardian_ids = StudentGuardian.objects.filter(
            student__institution_id__in=institution_ids, student__is_deleted=False,
        ).values_list('guardian_id', flat=True).distinct()
        guardians = Guardian.objects.filter(id__in=guardian_ids)

        course_count = Course.objects.filter(
            institution_id__in=institution_ids, is_deleted=False
        ).count()
        batch_count = Batch.objects.filter(institution_id__in=institution_ids).count()

        return Response({
            'managers':     ManagerListSerializer(managers, many=True).data,
            'educators':    EducatorSerializer(educators, many=True, context={'request': request}).data,
            'students':     StudentListSerializer(students, many=True).data,
            'guardians':    GuardianSerializer(guardians, many=True).data,
            'course_count': course_count,
            'batch_count':  batch_count,
        })


# ---------------------------------------------------------------------------
# Maintenance — Audit Logs & Login Activity (super admin only)
# ---------------------------------------------------------------------------

class AuditLogListView(JWTView):
    """
    Audit trail of create/update/delete actions. Optional ?search= filters
    by actor username/email.

    SUPER_ADMIN sees the platform-wide institution-approval trail. OWNER
    sees activity across every module, scoped to the users enrolled in
    their own institution(s) (managers, educators, students, guardians).
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER']

    def get(self, request):
        user = request.current_user
        logs = ActivityLog.objects.select_related('actor')

        if user.role.name.upper() == 'OWNER':
            member_ids = institution_member_user_ids(owned_institution_ids(user))
            logs = logs.filter(actor_id__in=member_ids)
        else:
            logs = logs.filter(module='INSTITUTION')

        search = request.query_params.get('search', '').strip()
        if search:
            logs = logs.filter(
                models.Q(actor__username__icontains=search) |
                models.Q(actor__email__icontains=search) |
                models.Q(description__icontains=search)
            )

        serializer = ActivityLogSerializer(logs[:500], many=True)
        return Response(serializer.data)


class LoginActivityListView(JWTView):
    """
    Login/logout audit trail. Optional ?search= filters by email.

    SUPER_ADMIN sees every account platform-wide. OWNER only sees logins
    from users enrolled in their own institution(s).
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER']

    def get(self, request):
        user = request.current_user
        logins = LoginActivity.objects.all()

        if user.role.name.upper() == 'OWNER':
            member_ids = institution_member_user_ids(owned_institution_ids(user))
            logins = logins.filter(user_id__in=member_ids)

        search = request.query_params.get('search', '').strip()
        if search:
            logins = logins.filter(email__icontains=search)

        action = request.query_params.get('action', '').strip().upper()
        if action in ('LOGIN', 'LOGOUT'):
            logins = logins.filter(action=action)

        serializer = LoginActivitySerializer(logins[:500], many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Analytics trends (SUPER_ADMIN) — zero-filled time series for the
# Analytics page's charts, feeding frontend/src/components/charts/LineChartCard.
# ---------------------------------------------------------------------------

def _monthly_series(queryset, date_field, months=12):
    """[{name, value}] for each of the last `months` calendar months
    (oldest first, including the current month) — buckets with no rows
    still appear as 0 rather than being skipped, so the line reads as a
    continuous trend."""
    today = timezone.now().date()
    start_year, start_month = today.year, today.month
    for _ in range(months - 1):
        start_month -= 1
        if start_month == 0:
            start_month = 12
            start_year -= 1
    start_date = datetime.date(start_year, start_month, 1)

    counts = (
        queryset.filter(**{f'{date_field}__date__gte': start_date})
        .annotate(bucket=TruncMonth(date_field))
        .values('bucket')
        .annotate(count=models.Count('id'))
    )
    count_map = {c['bucket'].strftime('%Y-%m'): c['count'] for c in counts if c['bucket']}

    result = []
    y, m = start_year, start_month
    for _ in range(months):
        result.append({
            'name':  f'{calendar.month_abbr[m]} {y}',
            'value': count_map.get(f'{y:04d}-{m:02d}', 0),
        })
        m += 1
        if m > 12:
            m = 1
            y += 1
    return result


def _daily_series(queryset, date_field, days=30):
    """[{name, value}] for each of the last `days` calendar days, zero-filled."""
    today = timezone.now().date()
    start_date = today - datetime.timedelta(days=days - 1)

    counts = (
        queryset.filter(**{f'{date_field}__date__gte': start_date})
        .annotate(bucket=TruncDate(date_field))
        .values('bucket')
        .annotate(count=models.Count('id'))
    )
    count_map = {c['bucket'].isoformat(): c['count'] for c in counts if c['bucket']}

    result = []
    for i in range(days):
        d = start_date + datetime.timedelta(days=i)
        result.append({'name': d.strftime('%b %d'), 'value': count_map.get(d.isoformat(), 0)})
    return result


class AnalyticsTrendsView(JWTView):
    """SUPER_ADMIN: platform-wide time-series trends for the Analytics page."""
    allowed_roles = ['SUPER_ADMIN']

    def get(self, request):
        return Response({
            'institutions_per_month': _monthly_series(Institution.objects.filter(is_deleted=False), 'created_at'),
            'students_per_month':     _monthly_series(Student.objects.filter(is_deleted=False), 'created_at'),
            'logins_per_day':         _daily_series(LoginActivity.objects.filter(action='LOGIN'), 'timestamp'),
            'complaints_per_month':   _monthly_series(Complaint.objects.all(), 'created_at'),
        })


INSTITUTION_REPORT_HEADERS = [
    'Institution', 'Owner Name', 'Owner Email', 'Status',
    'Managers', 'Educators', 'Students', 'Parents', 'Courses', 'Created At',
]
AUDIT_LOG_REPORT_HEADERS = ['Actor', 'Actor Email', 'Action', 'Module', 'Description', 'Date & Time']
LOGIN_ACTIVITY_REPORT_HEADERS = ['Email', 'Action', 'IP Address', 'Date & Time']


def _collect_institution_details(institution_ids=None):
    """
    Institution details (owner + head counts) — shared by the Analytics
    page's table (JSON, via InstitutionDetailsListView) and the CSV/PDF
    maintenance report (MaintenanceReportView). Pass institution_ids to
    restrict to a single OWNER's own institution(s).
    """
    rows = []
    institutions = Institution.objects.filter(is_deleted=False).select_related('owner')
    if institution_ids is not None:
        institutions = institutions.filter(id__in=institution_ids)
    for inst in institutions:
        parent_count = StudentGuardian.objects.filter(
            student__institution_id=inst.id, student__is_deleted=False,
        ).values('guardian_id').distinct().count()
        rows.append({
            'id':          inst.id,
            'name':        inst.name,
            'owner_name':  inst.owner.username if inst.owner else '',
            'owner_email': inst.owner.email if inst.owner else '',
            'status':      inst.status,
            'managers':    inst.managers.count(),
            'educators':   inst.educators.count(),
            'students':    inst.students.filter(is_deleted=False).count(),
            'parents':     parent_count,
            'courses':     inst.courses.filter(is_deleted=False).count(),
            'created_at':  inst.created_at,
        })
    return rows


class InstitutionDetailsListView(JWTView):
    """Institution details (owner + head counts) for the Analytics page table."""
    allowed_roles = ['SUPER_ADMIN']

    def get(self, request):
        rows = _collect_institution_details()
        for row in rows:
            row['created_at'] = row['created_at'].isoformat()
        return Response(rows)


class MaintenanceReportView(JWTView):
    """
    Downloadable report (CSV or PDF, via ?format=) bundling institution
    details (owner + head counts), audit logs, and login activity — for
    offline record-keeping.

    SUPER_ADMIN gets the platform-wide report. OWNER gets a report scoped
    to their own institution(s) and its enrolled users.
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER']

    def _collect_report_data(self, user):
        is_owner = user.role.name.upper() == 'OWNER'
        institution_ids = owned_institution_ids(user) if is_owner else None

        institutions_rows = [
            [
                inst['name'], inst['owner_name'], inst['owner_email'], inst['status'],
                inst['managers'], inst['educators'], inst['students'], inst['parents'],
                inst['courses'], inst['created_at'].strftime('%Y-%m-%d %H:%M'),
            ]
            for inst in _collect_institution_details(institution_ids)
        ]

        logs = ActivityLog.objects.select_related('actor').order_by('-timestamp')
        if is_owner:
            member_ids = institution_member_user_ids(institution_ids)
            logs = logs.filter(actor_id__in=member_ids)
        else:
            logs = logs.filter(module='INSTITUTION')
        audit_rows = []
        for log in logs[:500]:
            audit_rows.append([
                log.actor.username if log.actor else 'System',
                log.actor.email if log.actor else '',
                log.action,
                log.module,
                log.description,
                log.timestamp.strftime('%Y-%m-%d %H:%M'),
            ])

        logins = LoginActivity.objects.order_by('-timestamp')
        if is_owner:
            logins = logins.filter(user_id__in=member_ids)
        login_rows = []
        for entry in logins[:500]:
            login_rows.append([
                entry.email,
                entry.action,
                entry.ip_address or '',
                entry.timestamp.strftime('%Y-%m-%d %H:%M'),
            ])

        return institutions_rows, audit_rows, login_rows

    def _render_csv(self, institutions_rows, audit_rows, login_rows):
        response = HttpResponse(content_type='text/csv')
        writer = csv.writer(response)

        writer.writerow(['INSTITUTION DETAILS'])
        writer.writerow(INSTITUTION_REPORT_HEADERS)
        writer.writerows(institutions_rows)

        writer.writerow([])
        writer.writerow(['AUDIT LOGS (INSTITUTION ACTIVITY)'])
        writer.writerow(AUDIT_LOG_REPORT_HEADERS)
        writer.writerows(audit_rows)

        writer.writerow([])
        writer.writerow(['LOGIN ACTIVITY'])
        writer.writerow(LOGIN_ACTIVITY_REPORT_HEADERS)
        writer.writerows(login_rows)

        return response

    def _render_pdf(self, institutions_rows, audit_rows, login_rows):
        from io import BytesIO
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.units import cm
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=landscape(A4),
            topMargin=1.5 * cm, bottomMargin=1.5 * cm, leftMargin=1.5 * cm, rightMargin=1.5 * cm,
        )
        styles = getSampleStyleSheet()
        cell_style = ParagraphStyle('cell', parent=styles['BodyText'], fontSize=7, leading=9)

        elements = [
            Paragraph('LightLearn Maintenance Report', styles['Title']),
            Paragraph(timezone.now().strftime('Generated %d %b %Y, %I:%M %p'), styles['Normal']),
            Spacer(1, 0.6 * cm),
        ]

        def add_section(title, headers, rows):
            elements.append(Paragraph(title, styles['Heading2']))
            elements.append(Spacer(1, 0.2 * cm))
            if not rows:
                elements.append(Paragraph('No records.', styles['Normal']))
            else:
                body = [[Paragraph(str(cell), cell_style) for cell in row] for row in rows]
                table = Table([headers] + body, repeatRows=1)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ]))
                elements.append(table)
            elements.append(Spacer(1, 0.8 * cm))

        add_section('Institution Details', INSTITUTION_REPORT_HEADERS, institutions_rows)
        add_section('Audit Logs (Institution Activity)', AUDIT_LOG_REPORT_HEADERS, audit_rows)
        add_section('Login Activity', LOGIN_ACTIVITY_REPORT_HEADERS, login_rows)

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return HttpResponse(pdf_bytes, content_type='application/pdf')

    def get(self, request):
        # Note: deliberately named "type", not "format" — DRF reserves the
        # "format" query param for its own content-negotiation and 404s
        # when the value doesn't match a registered renderer (e.g. "csv").
        fmt = (request.query_params.get('type') or 'csv').lower()
        institutions_rows, audit_rows, login_rows = self._collect_report_data(request.current_user)

        if fmt == 'pdf':
            response = self._render_pdf(institutions_rows, audit_rows, login_rows)
            ext = 'pdf'
        else:
            response = self._render_csv(institutions_rows, audit_rows, login_rows)
            ext = 'csv'

        filename = f"lightlearn-maintenance-report-{timezone.now().strftime('%Y%m%d-%H%M%S')}.{ext}"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class AnnouncementListCreateView(JWTView):
    """OWNER/MANAGER broadcast tool — see AnnouncementService for delivery."""
    allowed_roles = ['OWNER', 'MANAGER']

    def get(self, request):
        announcements = Announcement.objects.select_related('batch', 'created_by').filter(
            **scoped_institution_filter(request.current_user)
        )
        batch_id = request.query_params.get('batch_id')
        if batch_id:
            announcements = announcements.filter(batch_id=batch_id)
        return Response(AnnouncementSerializer(announcements[:50], many=True).data)

    def post(self, request):
        try:
            announcement, recipient_count = AnnouncementService.create_announcement(
                request.current_user, request.data
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': f'Announcement sent to {recipient_count} recipient(s).',
                'recipient_count': recipient_count,
                'data': AnnouncementSerializer(announcement).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AnnouncementDetailView(JWTView):
    """DELETE only — announcements are send-once, not edited."""
    allowed_roles = ['OWNER', 'MANAGER']

    def delete(self, request, pk):
        try:
            AnnouncementService.delete_announcement(pk, request.current_user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Announcement deleted.'})