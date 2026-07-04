from django.http import JsonResponse
from django.db.models import Count
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from institutions.jwt_utils import get_user_from_token
from institutions.models import Institution, ActivityLog


def dashboard_auth(required_roles=None):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            user = get_user_from_token(request)
            print("=== DASHBOARD AUTH DEBUG ===")
            print("User:", user)
            print("User role:", getattr(user, 'role', 'NO ROLE ATTR'))
            print("Required roles:", required_roles)
            print("Token header:", request.headers.get('Authorization', 'MISSING'))


            if user is None:
                return JsonResponse({'error': 'Authentication required.'}, status=401)

            request.current_user = user

            # If roles are specified, enforce them
            if required_roles and user.role not in required_roles:
               return JsonResponse({'error': 'Permission denied.'}, status=403)

            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator

@require_http_methods(['GET'])
@dashboard_auth(required_roles=['OWNER', 'MANAGER','SUPER_ADMIN'])
def manager_dashboard(request):
    """
    GET /api/dashboard/manager/
    Returns counts, courses per institution, educators per course,
    recent activity.
    """
    from course.models import Course, Allocation
    from students.models import Student

    try:
        from educators.models import Educator
        total_educators = Educator.objects.filter(is_deleted=False).count()
    except Exception:
        total_educators = 0

    try:
        from batches.models import Batch
        total_batches = Batch.objects.filter(is_deleted=False).count()
    except Exception:
        total_batches = 0

    total_institutions = Institution.objects.filter(is_deleted=False).count()
    total_courses      = Course.objects.filter(is_deleted=False).count()
    total_students     = Student.objects.filter(is_deleted=False).count()

    # Courses per institution
    courses_per_institution = list(
        Course.objects
        .filter(is_deleted=False)
        .values('institution__name')
        .annotate(course_count=Count('id'))
        .order_by('-course_count')
    )

    # Educators per course
    educators_per_course = list(
        Allocation.objects
        .values('course__name')
        .annotate(educator_count=Count('educator'))
        .order_by('-educator_count')[:10]
    )

    # Recent activity
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


@require_http_methods(['GET'])
@dashboard_auth(required_roles=['SUPER_ADMIN','OWNER'])
def super_admin_dashboard(request):
    """
    GET /api/dashboard/super-admin/
    System-wide stats across all institutions.
    """
    from course.models import Course
    from students.models import Student

    try:
        from educators.models import Educator
        total_educators = Educator.objects.filter(is_deleted=False).count()
    except Exception:
        total_educators = 0

    try:
        from batches.models import Batch
        total_batches = Batch.objects.filter(is_deleted=False).count()
    except Exception:
        total_batches = 0

    total_institutions = Institution.objects.filter(is_deleted=False).count()
    total_courses      = Course.objects.filter(is_deleted=False).count()
    total_students     = Student.objects.filter(is_deleted=False).count()
    total_users        = total_educators + total_students

    # Institutions with their course + student counts
    institutions = Institution.objects.filter(is_deleted=False).annotate(
        course_count=Count('courses')
    )
    institutions_data = []
    for inst in institutions:
        student_count = Student.objects.filter(
            batch__institution=inst, is_deleted=False
        ).count() if hasattr(Student, 'batch') else 0
        institutions_data.append({
            'id':           inst.id,
            'name':         inst.name,
            'course_count': inst.course_count,
            'student_count': student_count,
        })

    # System-wide activity log
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


@require_http_methods(['GET'])
@dashboard_auth(required_roles=['EDUCATOR','SUPER_ADMIN','OWNER'])
def educator_dashboard(request):
    """
    GET /api/dashboard/educator/
    Returns the logged-in educator's courses, batches and students.
    """
    from course.models import Course, Allocation

    user     = request.current_user
    allocations = Allocation.objects.filter(
        educator__user=user
    ).select_related('course', 'course__institution')

    courses = []
    for alloc in allocations:
        course = alloc.course
        if not course.is_deleted:
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

    # Recent activity related to courses this educator teaches
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


@require_http_methods(['GET'])
@dashboard_auth(required_roles=['STUDENT','SUPER_ADMIN','OWNER'])
def student_dashboard(request):
    """
    GET /api/dashboard/student/
    Returns the logged-in student's batch, courses and educators.
    """
    from course.models import Course
    from students.models import Student

    user = request.current_user
    print("=== STUDENT DASHBOARD ===")
    print("User:", user, "| ID:", user.id)
    print("Students in DB:", list(Student.objects.values('id', 'name', 'user_id', 'is_deleted')))

    try:
        student = Student.objects.select_related(
            'batch'
        ).prefetch_related(
            'student_guardians__guardian'
        ).get(user=user, is_deleted=False)
        print("Found student:", student)
    except Student.DoesNotExist:
        print("Student NOT found for user_id:", user.id)
        return JsonResponse({'error': 'Student profile not found.'}, status=404)

    # Courses linked to the student's batch
    courses = []
    if student.batch:
        course_batches = student.batch.coursebatch_set.select_related(
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
                    {
                        'id':   a.educator.id,
                        'name': a.educator.name,
                    }
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
            'total_courses':  len(courses),
            'total_educators': sum(len(c['educators']) for c in courses),
        },
        'courses': courses,
    })


@require_http_methods(['GET'])
@dashboard_auth(required_roles=['PARENT','SUPER_ADMIN','OWNER'])
def parent_dashboard(request):
    """
    GET /api/dashboard/parent/
    Returns all children linked to this guardian and their courses.
    """
    from course.models import Course
    from students.models import Student, Guardian, StudentGuardian

    user = request.current_user
    print("=== PARENT DASHBOARD ===")
    print("User:", user)
    print("User id:", user.id)

    user = request.current_user

    try:
        guardian = Guardian.objects.get(user=user)
        print("Guardian found:", guardian)
    except Guardian.DoesNotExist:
        print("Guardian NOT found for user:", user)
        return JsonResponse({'error': 'Guardian profile not found.'}, status=404)

    # All students linked to this guardian
    links    = StudentGuardian.objects.filter(
        guardian=guardian
    ).select_related('student', 'student__batch')

    children = []
    for link in links:
        student = link.student
        if student.is_deleted:
            continue

        courses = []
        if student.batch:
            course_batches = student.batch.coursebatch_set.select_related(
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