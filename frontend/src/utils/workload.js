// Shared week-workload math, used by both the dashboard's WorkloadSummary
// widget and the full Workload page so "this week" always means the same
// thing in both places.
import { findOverlaps } from './eventConflicts';
import { dateKey, startOfWeek, endOfWeek, monthsTouched } from './dateRange';

export { dateKey, startOfWeek, endOfWeek, monthsTouched };

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Shared stacked-bar series config for the workload charts — one color per
// item type so a day's total visibly breaks down into events vs activities
// instead of one anonymous count. #F59E0B matches TYPE_COLOR.assignment in
// eventTypeColors.js, since activities render as 'assignment'-typed events
// everywhere else in the calendar.
export const WORKLOAD_SERIES = [
  { key: 'events', name: 'Events', color: '#00A0F5' },
  { key: 'activities', name: 'Activities', color: '#F59E0B' },
];

function eventHours(ev) {
  if (ev.all_day || !ev.end) return 0;
  const ms = new Date(ev.end).getTime() - new Date(ev.start).getTime();
  return ms > 0 ? ms / 3600000 : 0;
}

/** Per-weekday event count + scheduled hours, plus totals and conflicts, for the week starting at weekStart. */
export function computeWeekStats(events, weekStart) {
  const weekEnd = endOfWeek(weekStart);

  const weekEvents = events.filter((e) => {
    const t = new Date(e.start).getTime();
    return t >= weekStart.getTime() && t <= weekEnd.getTime();
  });

  const perDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayEvents = weekEvents.filter((e) => dateKey(e.start) === dateKey(d));
    const hours = dayEvents.reduce((sum, e) => sum + eventHours(e), 0);
    const activities = dayEvents.filter((e) => e.is_activity).length;
    return {
      name: WEEKDAY_LABELS[i],
      count: dayEvents.length,
      events: dayEvents.length - activities,
      activities,
      hours: Math.round(hours * 10) / 10,
    };
  });

  const totalHours = Math.round(perDay.reduce((sum, d) => sum + d.hours, 0) * 10) / 10;

  return {
    weekEvents,
    perDay,
    totalCount: weekEvents.length,
    totalHours,
    conflicts: findOverlaps(weekEvents).notices,
  };
}
