// Shared "does this day have a scheduling conflict" logic, used by both the
// calendar grid (EventCalendar/CalendarPage) and the workload/conflict
// summary (WorkloadSummary/StudentWorkload) so all of them stay in agreement
// about what a conflict is. A day is a conflict either because two timed
// items truly overlap, or because DAY_OVERLOAD_THRESHOLD or more items
// (events and/or activities) land on the same day — activities are all-day
// with no end time, so they can only ever be caught by this second rule.
export const DAY_OVERLOAD_THRESHOLD = 3;

function dateKey(d) {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function groupEventsByDate(events) {
  const map = {};
  for (const ev of events) {
    const key = dateKey(ev.start);
    (map[key] ||= []).push(ev);
  }
  return map;
}

function overlaps(a, b) {
  if (a.all_day || b.all_day || !a.end || !b.end) return false;
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Returns { conflictIds: Set<number>, notices: [{ date, message }] }
 * describing every day that has a scheduling conflict: either a genuine
 * start/end overlap between two timed items, or DAY_OVERLOAD_THRESHOLD+
 * total items (events/activities) landing on the same day.
 */
export function findOverlaps(events) {
  const byDate = groupEventsByDate(events);
  const conflictIds = new Set();
  const notices = [];

  for (const dayEvents of Object.values(byDate)) {
    const overloaded = dayEvents.length >= DAY_OVERLOAD_THRESHOLD;

    if (overloaded) {
      dayEvents.forEach((e) => conflictIds.add(e.id));
      notices.push({
        date: dayEvents[0].start,
        message: `${dayEvents.length} items scheduled the same day: ${dayEvents.map((e) => e.title).join(', ')}`,
      });
    }

    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const a = dayEvents[i];
        const b = dayEvents[j];
        if (overlaps(a, b)) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
          // Already covered by the overload notice above — avoid double-reporting.
          if (!overloaded) {
            notices.push({ date: a.start, message: `"${a.title}" overlaps with "${b.title}"` });
          }
        }
      }
    }
  }

  return { conflictIds, notices };
}
