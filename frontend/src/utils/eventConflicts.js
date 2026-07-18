// Shared "does this day have overlapping events" logic, used by both the
// calendar grid (EventCalendar) and the workload/conflict summary
// (WorkloadSummary) so the two stay in agreement about what a conflict is.

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
 * Returns { conflictIds: Set<number>, pairs: [{ date, a, b }] } describing
 * every pair of events on the same day whose start/end ranges truly overlap.
 */
export function findOverlaps(events) {
  const byDate = groupEventsByDate(events);
  const conflictIds = new Set();
  const pairs = [];

  for (const [date, dayEvents] of Object.entries(byDate)) {
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const a = dayEvents[i];
        const b = dayEvents[j];
        if (overlaps(a, b)) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
          pairs.push({ date, a, b });
        }
      }
    }
  }

  return { conflictIds, pairs };
}
