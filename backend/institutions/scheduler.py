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
    _scheduler.start()
    logger.info(
        'Due-date reminder scheduler started (every %d min).',
        DUE_SOON_CHECK_INTERVAL_MINUTES,
    )
