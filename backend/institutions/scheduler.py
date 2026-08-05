import logging
import os
import sys

logger = logging.getLogger(__name__)

_scheduler = None

DUE_SOON_CHECK_INTERVAL_MINUTES = 30


def start():
    """
    Starts the in-process background scheduler that checks for
    activities whose due date is approaching. Called from
    InstitutionsConfig.ready().

    Guarded so it only ever runs once, in the one process that's actually
    serving requests:
    - only under `runserver` (not `migrate`, `shell`, `test`, etc.)
    - only in the autoreloader's child process (RUN_MAIN), not its parent
      watcher — otherwise dev mode would start it twice.

    This is a single-process, in-memory scheduler — fine for one dev
    server. A production deployment running multiple worker processes
    would need this moved to a dedicated worker (or a distributed lock)
    so the check doesn't run — and double-notify — once per worker.
    """
    global _scheduler
    if _scheduler is not None:
        return
    if 'runserver' not in sys.argv:
        return
    if os.environ.get('RUN_MAIN') != 'true':
        return

    from apscheduler.schedulers.background import BackgroundScheduler
    from activities.services import check_due_soon_activities

    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        check_due_soon_activities,
        'interval',
        minutes=DUE_SOON_CHECK_INTERVAL_MINUTES,
        id='check_due_soon_activities',
    )
    _scheduler.add_job(
        send_due_monthly_reports,
        'cron',
        hour=7,
        id='send_due_monthly_reports',
    )
    _scheduler.start()
    logger.info(
        'Due-date reminder scheduler started (every %d min).',
        DUE_SOON_CHECK_INTERVAL_MINUTES,
    )


def send_due_monthly_reports():
    """
    Daily check (registered above at 07:00): for every guardian whose
    ReportSchedule is enabled and matches today's day-of-month, and who
    hasn't already been sent one this calendar month, email them a PDF
    report per child covering the month that just completed.

    Same single-process/dev-only caveat as start() above — this runs in
    the same in-memory scheduler, so a multi-worker production deployment
    would need this moved to a dedicated worker to avoid double-sending.
    """
    import calendar
    import datetime
    from auth.dashboard_views import _build_parent_report, _build_report_pdf_bytes
    from institutions.email_utils import send_monthly_report_email
    from institutions.models import ReportSchedule, StudentGuardian

    today = datetime.date.today()
    this_year_month = today.strftime('%Y-%m')

    # Report the month that just completed, not the in-progress one.
    last_month_end = today.replace(day=1) - datetime.timedelta(days=1)
    report_year, report_month = last_month_end.year, last_month_end.month
    period_label = f'{calendar.month_name[report_month]} {report_year}'

    due = ReportSchedule.objects.filter(
        enabled=True, day_of_month=today.day,
    ).exclude(last_sent_year_month=this_year_month).select_related('guardian', 'guardian__user')

    for schedule in due:
        guardian = schedule.guardian
        students = [
            link.student for link in StudentGuardian.objects.filter(
                guardian=guardian
            ).select_related('student__batch', 'student__institution')
            if not link.student.is_deleted
        ]
        if not students:
            continue

        attachments = []
        for student in students:
            report = _build_parent_report(student, report_year, report_month, guardian)
            pdf_bytes = _build_report_pdf_bytes(report)
            filename = f"{student.name.replace(' ', '-').lower()}-report-{report_year}-{report_month:02d}.pdf"
            attachments.append((filename, pdf_bytes, student.name))

        try:
            send_monthly_report_email(guardian, period_label, attachments)
        except Exception:
            logger.exception('Failed to send monthly report email for guardian %s', guardian.id)
            continue

        schedule.last_sent_year_month = this_year_month
        schedule.save(update_fields=['last_sent_year_month'])
