import calendar
import datetime
from django.http import JsonResponse, HttpResponse
from django.db.models import Count
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from institutions.jwt_utils import jwt_required
from institutions.models import (
    Institution, ActivityLog,
    Course, Allocation,
    Student, Educator,
    Batch, Guardian, StudentGuardian,
    Enrolment, Activity, Progress,
    Complaint,
)


# ---------------------------------------------------------------------------
# Manager dashboard
# GET /api/dashboard/manager/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
@jwt_required(roles=['MANAGER'])
def manager_dashboard(request):
    # A manager only ever oversees the one institution they're linked to
    # (see institutions.jwt_utils._resolve_institution_id) — every count and
    # chart below is scoped to it so a manager never sees another
    # institution's data.
    institution_id = request.current_user.institution_id
    if not institution_id:
        return JsonResponse({'error': 'No institution found for this manager.'}, status=404)

    institution = Institution.objects.filter(id=institution_id, is_deleted=False).first()
    if not institution:
        return JsonResponse({'error': 'No institution found for this manager.'}, status=404)

    total_courses   = Course.objects.filter(institution_id=institution_id, is_deleted=False).count()
    total_educators = Educator.objects.filter(institution_id=institution_id).count()
    total_batches   = Batch.objects.filter(institution_id=institution_id).count()
    total_students  = Student.objects.filter(institution_id=institution_id, is_deleted=False).count()

    students_per_batch = list(
        Student.objects
        .filter(institution_id=institution_id, is_deleted=False, batch__isnull=False)
        .values('batch__name')
        .annotate(student_count=Count('id'))
        .order_by('-student_count')
    )

    educators_per_course = list(
        Allocation.objects
        .filter(course__institution_id=institution_id)
        .values('course__name')
        .annotate(educator_count=Count('educator'))
        .order_by('-educator_count')[:10]
    )

    return JsonResponse({
        'summary': {
            'institution_name': institution.name,
            'total_courses':    total_courses,
            'total_educators':  total_educators,
            'total_batches':    total_batches,
            'total_students':   total_students,
        },
        'students_per_batch':   students_per_batch,
        'educators_per_course': educators_per_course,
    })


# ---------------------------------------------------------------------------
# Super admin dashboard
# GET /api/dashboard/super-admin/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
@jwt_required(roles=['SUPER_ADMIN'])
def super_admin_dashboard(request):
    total_institutions = Institution.objects.filter(is_deleted=False).count()
    total_courses      = Course.objects.filter(is_deleted=False).count()
    total_educators    = Educator.objects.count()
    total_batches      = Batch.objects.count()
    total_students     = Student.objects.filter(is_deleted=False).count()
    total_users        = total_educators + total_students
    total_complaints   = Complaint.objects.filter(status='OPEN').count()

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
        ActivityLog.objects.filter(module='INSTITUTION').order_by('-timestamp').values(
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
            'total_complaints':   total_complaints,
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
@jwt_required(roles=['EDUCATOR'])
def educator_dashboard(request):
    user = request.current_user

    allocations = Allocation.objects.filter(
        educator__user_id=user.id
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
@jwt_required(roles=['STUDENT'])
def student_dashboard(request):
    user = request.current_user

    try:
        student = Student.objects.select_related(
            'batch', 'institution'
        ).prefetch_related(
            'student_guardians__guardian'
        ).get(user_id=user.id, is_deleted=False)
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

    enrollments = [
        {
            'id':            e.id,
            'course':        {'id': e.course.id, 'name': e.course.name, 'code': e.course.code},
            'enrolled_date': e.enrolled_date.isoformat(),
        }
        for e in Enrolment.objects.filter(student=student).select_related('course').order_by('-enrolled_date')
    ]

    # Task-completion aggregate — same course scope (batch ∪ self-enrolled)
    # used everywhere else for this student.
    course_ids = set(c['id'] for c in courses)
    course_ids.update(Enrolment.objects.filter(student=student).values_list('course_id', flat=True))
    total_tasks = Activity.objects.filter(course_id__in=course_ids).count()
    completed_tasks = Progress.objects.filter(
        student=student, status='completed', activity__course_id__in=course_ids
    ).count()
    in_progress_tasks = Progress.objects.filter(
        student=student, status='in_progress', activity__course_id__in=course_ids
    ).count()

    return JsonResponse({
        'student': {
            'id':              student.id,
            'name':            student.name,
            'email':           student.email,
            'registration_no': student.registration_no,
            'batch':           student.batch.name if student.batch else None,
            'institution':     student.institution.name if student.institution else None,
        },
        'summary': {
            'total_courses':     len(courses),
            'total_educators':   sum(len(c['educators']) for c in courses),
            'total_enrollments': len(enrollments),
            'total_tasks':       total_tasks,
            'completed_tasks':   completed_tasks,
            'in_progress_tasks': in_progress_tasks,
        },
        'courses':     courses,
        'enrollments': enrollments,
    })


# ---------------------------------------------------------------------------
# Parent dashboard
# GET /api/dashboard/parent/
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET'])
@jwt_required(roles=['PARENT'])
def parent_dashboard(request):
    user = request.current_user

    try:
        guardian = Guardian.objects.get(user_id=user.id)
    except Guardian.DoesNotExist:
        return JsonResponse({'error': 'Guardian profile not found.'}, status=404)

    links = StudentGuardian.objects.filter(
        guardian=guardian
    ).select_related('student', 'student__batch', 'student__institution')

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

        enrollments = [
            {
                'id':            e.id,
                'course':        {'id': e.course.id, 'name': e.course.name, 'code': e.course.code},
                'enrolled_date': e.enrolled_date.isoformat(),
            }
            for e in Enrolment.objects.filter(student=student).select_related('course').order_by('-enrolled_date')
        ]

        children.append({
            'id':                student.id,
            'name':              student.name,
            'email':             student.email,
            'registration_no':   student.registration_no,
            'batch':             student.batch.name if student.batch else None,
            'institution':       student.institution.name if student.institution else None,
            'total_courses':     len(courses),
            'courses':           courses,
            'total_enrollments': len(enrollments),
            'enrollments':       enrollments,
        })

    return JsonResponse({
        'guardian': {
            'id':   guardian.id,
            'name': guardian.name,
        },
        'total_children': len(children),
        'children':       children,
    })


# ---------------------------------------------------------------------------
# Parent monthly report
# GET /api/dashboard/parent/report/?student_id=X&year=YYYY&month=MM[&format=pdf]
# ---------------------------------------------------------------------------

def _render_parent_report_pdf(report):
    """Same reportlab-via-platypus approach as
    institutions/views.py::MaintenanceReportView._render_pdf — a real
    downloadable file (Content-Disposition: attachment), not a
    window.print() dialog."""
    from io import BytesIO
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=1.5 * cm, bottomMargin=1.5 * cm, leftMargin=1.5 * cm, rightMargin=1.5 * cm,
    )
    styles = getSampleStyleSheet()
    cell_style = ParagraphStyle('cell', parent=styles['BodyText'], fontSize=8, leading=10)

    student, guardian, period, summary = (
        report['student'], report['guardian'], report['period'], report['summary']
    )

    meta_bits = [f"{period['label']} · Registration No: {student['registration_no']}"]
    if student['institution']:
        meta_bits.append(student['institution'])
    if student['batch']:
        meta_bits.append(f"Batch: {student['batch']}")
    meta_line = ' · '.join(meta_bits)

    generated = datetime.datetime.fromisoformat(report['generated_at']).strftime('%d %b %Y, %I:%M %p')

    elements = [
        Paragraph(f"{student['name']} — Monthly Report", styles['Title']),
        Paragraph(meta_line, styles['Normal']),
        Paragraph(f"Prepared for guardian: {guardian['name']}", styles['Normal']),
        Paragraph(f"Generated {generated}", styles['Normal']),
        Spacer(1, 0.5 * cm),
    ]

    def pct(v):
        return f'{v}%' if v is not None else '—'

    summary_rows = [[
        'Courses', 'Activities graded', 'Avg. progress', 'New enrollments',
    ], [
        str(summary['total_courses']),
        f"{summary['graded_activities']}/{summary['total_activities']}",
        pct(summary['overall_average_progress_pct']),
        str(summary['enrollments_this_month']),
    ]]
    summary_table = Table(summary_rows, repeatRows=1)
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements += [summary_table, Spacer(1, 0.8 * cm)]

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

    course_rows = [
        [c['name'] + f" ({c['code']})", c['total_activities'], c['graded_activities'], pct(c['average_progress_pct'])]
        for c in report['courses']
    ]
    add_section('Courses', ['Course', 'Total activities', 'Graded', 'Avg. progress'], course_rows)

    activity_rows = [
        [c['code'], a['name'], a['due_date'] or '—', pct(a['progress_pct']) if a['progress_pct'] is not None else 'Not graded yet']
        for c in report['courses'] for a in c['activities']
    ]
    add_section('Activities', ['Course', 'Activity', 'Due', 'Progress'], activity_rows)

    enrollment_rows = [
        [f"{e['course']['name']} ({e['course']['code']})", e['enrolled_date']]
        for e in report['enrollments_this_month']
    ]
    add_section(f"Enrollments in {period['label']}", ['Course', 'Enrolled on'], enrollment_rows)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return HttpResponse(pdf_bytes, content_type='application/pdf')


@csrf_exempt
@require_http_methods(['GET'])
@jwt_required(roles=['PARENT'])
def parent_monthly_report(request):
    user = request.current_user

    try:
        guardian = Guardian.objects.get(user_id=user.id)
    except Guardian.DoesNotExist:
        return JsonResponse({'error': 'Guardian profile not found.'}, status=404)

    student_id = request.GET.get('student_id')
    if not student_id:
        return JsonResponse({'error': 'student_id is required.'}, status=400)

    is_own_child = StudentGuardian.objects.filter(
        guardian=guardian, student_id=student_id
    ).exists()
    if not is_own_child:
        return JsonResponse({'error': 'Not found.'}, status=404)

    try:
        student = Student.objects.select_related('batch', 'institution').get(
            id=student_id, is_deleted=False
        )
    except Student.DoesNotExist:
        return JsonResponse({'error': 'Student not found.'}, status=404)

    today = datetime.date.today()
    try:
        year  = int(request.GET.get('year', today.year))
        month = int(request.GET.get('month', today.month))
        if not (1 <= month <= 12):
            raise ValueError
    except ValueError:
        return JsonResponse({'error': 'Invalid year or month.'}, status=400)

    # Courses: batch-assigned + explicitly self-enrolled, deduplicated.
    course_ids = set()
    if student.batch:
        course_ids.update(
            student.batch.course_batches.values_list('course_id', flat=True)
        )
    course_ids.update(
        Enrolment.objects.filter(student=student).values_list('course_id', flat=True)
    )
    course_qs = Course.objects.filter(id__in=course_ids, is_deleted=False)

    progress_by_activity = {
        p.activity_id: float(p.value)
        for p in Progress.objects.filter(student=student)
    }

    courses_report = []
    total_activities, graded_activities = 0, 0
    progress_values = []

    for course in course_qs:
        activities = list(Activity.objects.filter(course=course).order_by('id'))
        activity_rows = []
        for a in activities:
            value = progress_by_activity.get(a.id)
            activity_rows.append({
                'id':       a.id,
                'name':     a.name,
                'due_date': a.due_date,
                'optional': a.optional,
                'progress_pct': round(value * 100) if value is not None else None,
            })
            total_activities += 1
            if value is not None:
                graded_activities += 1
                progress_values.append(value)

        course_progress_values = [
            progress_by_activity[a.id] for a in activities if a.id in progress_by_activity
        ]
        courses_report.append({
            'id':                   course.id,
            'name':                 course.name,
            'code':                 course.code,
            'total_activities':     len(activities),
            'graded_activities':    len(course_progress_values),
            'average_progress_pct': (
                round(sum(course_progress_values) / len(course_progress_values) * 100)
                if course_progress_values else None
            ),
            'activities': activity_rows,
        })

    enrollments_this_month = [
        {
            'id':            e.id,
            'course':        {'id': e.course.id, 'name': e.course.name, 'code': e.course.code},
            'enrolled_date': e.enrolled_date.isoformat(),
        }
        for e in Enrolment.objects.filter(
            student=student, enrolled_date__year=year, enrolled_date__month=month
        ).select_related('course').order_by('enrolled_date')
    ]

    report = {
        'guardian': {'id': guardian.id, 'name': guardian.name},
        'student': {
            'id':              student.id,
            'name':            student.name,
            'registration_no': student.registration_no,
            'institution':     student.institution.name if student.institution else None,
            'batch':           student.batch.name if student.batch else None,
        },
        'period': {
            'year':  year,
            'month': month,
            'label': f'{calendar.month_name[month]} {year}',
        },
        'summary': {
            'total_courses':               len(courses_report),
            'total_activities':            total_activities,
            'graded_activities':           graded_activities,
            'overall_average_progress_pct': (
                round(sum(progress_values) / len(progress_values) * 100)
                if progress_values else None
            ),
            'enrollments_this_month': len(enrollments_this_month),
        },
        'courses':                courses_report,
        'enrollments_this_month': enrollments_this_month,
        'generated_at': datetime.datetime.now().isoformat(),
    }

    # Deliberately named "format", not "type" — this view is a plain Django
    # function view (no DRF content negotiation on it) so there's no
    # reserved-param collision to dodge, unlike MaintenanceReportView.
    if (request.GET.get('format') or '').lower() == 'pdf':
        response = _render_parent_report_pdf(report)
        filename = f"{student.name.replace(' ', '-').lower()}-report-{year}-{month:02d}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    return JsonResponse(report)