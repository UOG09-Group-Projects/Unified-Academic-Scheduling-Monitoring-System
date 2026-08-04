// src/pages/CalendarPage.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import calendarService from '../services/calendarService';
import activityService from '../services/activityService';
import timetableService from '../services/timetableService';
import { getSemester } from '../services/institutionService';
import usePolling from '../hooks/usePolling';
import useLiveSocket from '../hooks/useLiveSocket';
import { useToast } from '../components/ui/Toast';
import { usePermissions } from '../auth/PermissionsContext';
import { findOverlaps } from '../utils/eventConflicts';
import { visibleRange, monthsTouched } from '../utils/dateRange';
import { activitiesToPseudoEvents } from '../utils/activityEvents';
import { timetableSlotsToPseudoEvents } from '../utils/timetableEvents';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EventFormModal from '../components/calendar/EventFormModal';
import MonthView from '../components/calendar/views/MonthView';
import WeekView from '../components/calendar/views/WeekView';
import DayView from '../components/calendar/views/DayView';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const VIEW_MODES = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

const POLL_MS = 9000;

function formatWeekRange(start, end) {
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString(undefined, sameMonth
    ? { day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function headerLabel(viewMode, anchor, range) {
  if (viewMode === 'day') {
    return anchor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  if (viewMode === 'week') {
    return formatWeekRange(range.start, range.end);
  }
  return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState('month');
  const [anchor, setAnchor] = useState(new Date());
  const [selDay, setSelDay] = useState(new Date().getDate());

  const [events, setEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [semester, setSemester] = useState({ semester_start: null, semester_end: null });
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();
  const { user } = usePermissions();
  const role = user?.role;
  const canEdit = role === 'STUDENT' || role === 'EDUCATOR';
  const navigate = useNavigate();

  const range = useMemo(() => visibleRange(viewMode, anchor), [viewMode, anchor]);

  const fetchEvents = useCallback(async () => {
    try {
      const months = monthsTouched([range.start, range.end]);
      const results = await Promise.all(
        months.map(([y, mo]) => calendarService.listEvents(y, mo).catch(() => []))
      );
      setEvents(results.flat());
    } catch {
      // silent on background polls; loading state below covers first load
    } finally {
      setLoading(false);
    }
  }, [range]);

  const fetchActivities = useCallback(async () => {
    try {
      setActivities(await activityService.listMine());
    } catch {
      // non-critical — the calendar still works with just Events
    }
  }, []);

  useEffect(() => { setLoading(true); }, [range]);
  usePolling(fetchEvents, POLL_MS, modalOpen || Boolean(deleteTarget));
  usePolling(fetchActivities, POLL_MS, modalOpen || Boolean(deleteTarget));

  // Instant refetch the moment an educator adds/edits/deletes an event or
  // activity anywhere in the institution — the polling above is just the
  // fallback if this socket can't connect.
  useLiveSocket({ onEventsChanged: fetchEvents, onActivitiesChanged: fetchActivities });

  useEffect(() => {
    if (role === 'EDUCATOR') {
      calendarService.listMyCourses().then(setCourses).catch(() => setCourses([]));
    }
  }, [role]);

  // Timetable slots and the institution's semester range change rarely —
  // a fetch on mount is enough, no polling/live-socket needed.
  useEffect(() => {
    timetableService.list().then(setTimetableSlots).catch(() => setTimetableSlots([]));
    getSemester().then(setSemester).catch(() => setSemester({ semester_start: null, semester_end: null }));
  }, []);

  const mergedEvents = useMemo(
    () => [
      ...events,
      ...activitiesToPseudoEvents(activities),
      ...timetableSlotsToPseudoEvents(
        timetableSlots, semester.semester_start, semester.semester_end, range.start, range.end, role
      ),
    ],
    [events, activities, timetableSlots, semester, range, role]
  );

  const conflictIds = useMemo(() => findOverlaps(mergedEvents).conflictIds, [mergedEvents]);

  const goto = (delta) => {
    setAnchor((d) => {
      const next = new Date(d);
      if (viewMode === 'day') next.setDate(next.getDate() + delta);
      else if (viewMode === 'week') next.setDate(next.getDate() + delta * 7);
      else next.setMonth(next.getMonth() + delta);
      return next;
    });
    if (viewMode === 'month') setSelDay(null);
  };

  const goToday = () => {
    const now = new Date();
    setAnchor(now);
    setSelDay(now.getDate());
  };

  const openCreate = (date) => {
    if (!canEdit) return;
    setDefaultDate(date ?? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 9, 0));
    setEditingEvent(null);
    setModalOpen(true);
  };

  const openCreateForMonthDay = (day) => {
    openCreate(new Date(anchor.getFullYear(), anchor.getMonth(), day, 9, 0));
  };

  const openCreateForSlot = (day, hour) => {
    openCreate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0));
  };

  const openEdit = (ev) => {
    if (!canEdit) return;
    setEditingEvent(ev);
    setDefaultDate(null);
    setModalOpen(true);
  };

  // Activities and timetable slots are separate models managed on their own
  // pages — clicking one here goes to that page rather than opening the
  // (Event-only) edit form.
  const handleEventClick = (ev) => {
    if (ev.is_activity) {
      navigate(role === 'EDUCATOR' ? '/educator/activities' : '/my-courses');
      return;
    }
    if (ev.is_timetable) {
      navigate('/timetable');
      return;
    }
    openEdit(ev);
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editingEvent) {
        await calendarService.updateEvent(editingEvent.id, payload);
        toast.success('Event updated.');
      } else {
        await calendarService.createEvent(payload);
        toast.success('Event created.');
      }
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await calendarService.deleteEvent(deleteTarget.id);
      toast.success('Event deleted.');
      setDeleteTarget(null);
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete event.');
    } finally {
      setDeleting(false);
    }
  };

  const isToday = useMemo(() => {
    const now = new Date();
    return anchor.toDateString() === now.toDateString();
  }, [anchor]);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader title="Calendar" subtitle="All your classes, assignments, and events — by month, week, or day" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
        <Card className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => goto(-1)}
              aria-label="Previous"
              className="w-8 h-8 rounded-lg border border-ink/10 flex items-center justify-center text-ink-soft hover:bg-ink/[0.04] transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-ink font-display min-w-[180px] text-center">
              {headerLabel(viewMode, anchor, range)}
            </span>
            <button
              onClick={() => goto(1)}
              aria-label="Next"
              className="w-8 h-8 rounded-lg border border-ink/10 flex items-center justify-center text-ink-soft hover:bg-ink/[0.04] transition-colors"
            >
              <ChevronRight size={15} />
            </button>
            {!isToday && (
              <button
                onClick={goToday}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors ml-1"
              >
                <RotateCcw size={12} />
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-ink/10 p-0.5">
              {VIEW_MODES.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setViewMode(v.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${viewMode === v.value ? 'bg-brand-600 text-white shadow-soft' : 'text-ink-soft hover:bg-ink/[0.04]'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {canEdit && (
              <Button variant="brand" size="sm" icon={Plus} onClick={() => openCreate()}>
                New event
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        {viewMode === 'month' && (
          <MonthView
            anchor={anchor}
            events={mergedEvents}
            conflictIds={conflictIds}
            selDay={selDay}
            onSelectDay={setSelDay}
            onAddEvent={openCreateForMonthDay}
            onEditEvent={handleEventClick}
            loading={loading}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            anchor={anchor}
            events={mergedEvents}
            conflictIds={conflictIds}
            onSlotClick={openCreateForSlot}
            onEventClick={handleEventClick}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            anchor={anchor}
            events={mergedEvents}
            conflictIds={conflictIds}
            onSlotClick={openCreateForSlot}
            onEventClick={handleEventClick}
          />
        )}
      </motion.div>

      <EventFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingEvent ? () => setDeleteTarget(editingEvent) : undefined}
        role={role}
        courses={courses}
        initial={editingEvent}
        defaultDate={defaultDate}
        saving={saving}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this event?"
        message={deleteTarget ? `"${deleteTarget.title}" will be removed for everyone who can see it.` : ''}
        loading={deleting}
      />
    </div>
  );
}
