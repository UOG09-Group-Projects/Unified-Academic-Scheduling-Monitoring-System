from django.http import JsonResponse
from django.db.models import Count
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

#from institutions.jwt_utils import jwt_required
from institutions.models import (
    Institution, ActivityLog,
    Course, Allocation,
    Student, Educator,
    Batch, Guardian, StudentGuardian,
)


# ---------------------------------------------------------------------------
# Manager dashboard
# GET /api/dashboard/manager/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
def manager_dashboard(request):
    user = request.current_user   # dict: user_id, role, institution_id, ...

    total_institutions = Institution.objects.filter(is_deleted=False).count()
    total_courses      = Course.objects.filter(is_deleted=False).count()
    total_educators    = Educator.objects.count()
    total_batches      = Batch.objects.count()
    total_students     = Student.objects.filter(is_deleted=False).count()

    courses_per_institution = list(
        Course.objects
        .filter(is_deleted=False)
        .values('institution__name')
        .annotate(course_count=Count('id'))
        .order_by('-course_count')
    )

    educators_per_course = list(
        Allocation.objects
        .values('course__name')
        .annotate(educator_count=Count('educator'))
        .order_by('-educator_count')[:10]
    )

    recent_activity = list(
        ActivityLog.objects.values(
            'id', 'module', 'action', 'description', 'timestamp'
        )[:10]
    )
    for a in recent_activity:
        a['timestamp'] = a['timestamp'].strftime('%d %b %Y, %I:%M %p')

    return JsonResponse({
        'summary': {
            'total_institutions': total_institutions,
            'total_courses':      total_courses,
            'total_educators':    total_educators,
            'total_batches':      total_batches,
            'total_students':     total_students,
        },
        'courses_per_institution': courses_per_institution,
        'educators_per_course':    educators_per_course,
        'recent_activity':         recent_activity,
    })


# ---------------------------------------------------------------------------
# Super admin dashboard
# GET /api/dashboard/super-admin/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
def super_admin_dashboard(request):
    total_institutions = Institution.objects.filter(is_deleted=False).count()
    total_courses      = Course.objects.filter(is_deleted=False).count()
    total_educators    = Educator.objects.count()
    total_batches      = Batch.objects.count()
    total_students     = Student.objects.filter(is_deleted=False).count()
    total_users        = total_educators + total_students

    institutions = Institution.objects.filter(is_deleted=False).annotate(
        course_count=Count('courses')
    )
    institutions_data = []
    for inst in institutions:
        student_count = Student.objects.filter(
            batch__institution=inst, is_deleted=False
        ).count()
        institutions_data.append({
            'id':            inst.id,
            'name':          inst.name,
            'course_count':  inst.course_count,
            'student_count': student_count,
        })

    recent_activity = list(
        ActivityLog.objects.values(
            'id', 'module', 'action', 'description', 'timestamp'
        )[:20]
    )
    for a in recent_activity:
        a['timestamp'] = a['timestamp'].strftime('%d %b %Y, %I:%M %p')

    return JsonResponse({
        'summary': {
            'total_institutions': total_institutions,
            'total_courses':      total_courses,
            'total_educators':    total_educators,
            'total_batches':      total_batches,
            'total_students':     total_students,
            'total_users':        total_users,
        },
        'institutions':    institutions_data,
        'recent_activity': recent_activity,
    })


# ---------------------------------------------------------------------------
# Educator dashboard
# GET /api/dashboard/educator/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
def educator_dashboard(request):
    user = request.current_user   # dict

    allocations = Allocation.objects.filter(
        educator__user_id=user['user_id']
    ).select_related('course', 'course__institution')

    courses = []
    for alloc in allocations:
        course = alloc.course
        if course.is_deleted:
            continue
        batches = course.course_batches.select_related('batch').all()
        courses.append({
            'id':          course.id,
            'name':        course.name,
            'code':        course.code,
            'institution': course.institution.name,
            'batch_count': batches.count(),
            'batches': [
                {'id': cb.batch.id, 'name': cb.batch.name}
                for cb in batches
            ],
        })

    recent_activity = list(
        ActivityLog.objects.filter(module='COURSE').values(
            'id', 'module', 'action', 'description', 'timestamp'
        )[:10]
    )
    for a in recent_activity:
        a['timestamp'] = a['timestamp'].strftime('%d %b %Y, %I:%M %p')

    return JsonResponse({
        'summary': {
            'total_courses': len(courses),
            'total_batches': sum(c['batch_count'] for c in courses),
        },
        'courses':         courses,
        'recent_activity': recent_activity,
    })


# ---------------------------------------------------------------------------
# Student dashboard
# GET /api/dashboard/student/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
def student_dashboard(request):
    user = request.current_user   # dict

    try:
        student = Student.objects.select_related(
            'batch'
        ).prefetch_related(
            'student_guardians__guardian'
        ).get(user_id=user['user_id'], is_deleted=False)
    except Student.DoesNotExist:
        return JsonResponse({'error': 'Student profile not found.'}, status=404)

    courses = []
    if student.batch:
        course_batches = student.batch.course_batches.select_related(
            'course', 'course__institution'
        ).filter(course__is_deleted=False)

        for cb in course_batches:
            course    = cb.course
            educators = course.allocations.select_related('educator').all()
            courses.append({
                'id':          course.id,
                'name':        course.name,
                'code':        course.code,
                'institution': course.institution.name,
                'educators': [
                    {'id': a.educator.id, 'name': a.educator.name}
                    for a in educators
                ],
            })

    return JsonResponse({
        'student': {
            'id':              student.id,
            'name':            student.name,
            'email':           student.email,
            'registration_no': student.registration_no,
            'batch':           student.batch.name if student.batch else None,
        },
        'summary': {
            'total_courses':   len(courses),
            'total_educators': sum(len(c['educators']) for c in courses),
        },
        'courses': courses,
    })


# ---------------------------------------------------------------------------
# Parent dashboard
# GET /api/dashboard/parent/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
def parent_dashboard(request):
    user = request.current_user   # dict

    try:
        guardian = Guardian.objects.get(user_id=user['user_id'])
    except Guardian.DoesNotExist:
        return JsonResponse({'error': 'Guardian profile not found.'}, status=404)

    links = StudentGuardian.objects.filter(
        guardian=guardian
    ).select_related('student', 'student__batch')

    children = []
    for link in links:
        student = link.student
        if student.is_deleted:
            continue

        courses = []
        if student.batch:
            course_batches = student.batch.course_batches.select_related(
                'course'
            ).filter(course__is_deleted=False)
            for cb in course_batches:
                courses.append({
                    'id':   cb.course.id,
                    'name': cb.course.name,
                    'code': cb.course.code,
                })

        children.append({
            'id':              student.id,
            'name':            student.name,
            'email':           student.email,
            'registration_no': student.registration_no,
            'batch':           student.batch.name if student.batch else None,
            'total_courses':   len(courses),
            'courses':         courses,
        })

    return JsonResponse({
        'guardian': {
            'id':   guardian.id,
            'name': guardian.name,
        },
        'total_children': len(children),
        'children':       children,
    })