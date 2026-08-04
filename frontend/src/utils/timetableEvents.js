// Turns TimetableSlot rows (weekday + start/end time, no dates — the
// manager-built semester timetable) into read-only pseudo-events so they
// can render inside the same Month/Week/Day calendar as real calendar
// Events, without the Event model/backend needing to know TimetableSlot
// exists. Mirrors utils/activityEvents.js's activitiesToPseudoEvents,
// which does the same thing for course Activities.
import { startOfDay, endOfDay, addDays, dateKey } from './dateRange';

// Backend TimetableSlot.weekday: 0=Monday .. 6=Sunday.
// JS Date#getDay(): 0=Sunday .. 6=Saturday.
function jsDayToBackendWeekday(jsDay) {
  return (jsDay + 6) % 7;
}

function combineDateAndTime(day, timeStr) {
  const [h, m, s] = (timeStr || '00:00:00').split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, s || 0, 0);
  return d;
}

function laterOf(a, b) {
  return a > b ? a : b;
}

function earlierOf(a, b) {
  return a < b ? a : b;
}

/**
 * @param slots           TimetableSlot rows from timetableService.list()
 * @param semesterStart   "YYYY-MM-DD" or null/undefined
 * @param semesterEnd     "YYYY-MM-DD" or null/undefined
 * @param rangeStart      Date — start of the calendar's currently visible range
 * @param rangeEnd        Date — end of the calendar's currently visible range
 * @param viewerRole      the logged-in user's role, e.g. "STUDENT" — flips
 *                        whether each occurrence's title shows the educator
 *                        (for students/managers) or the batch (for educators,
 *                        who already know they're the educator).
 */
export function timetableSlotsToPseudoEvents(slots, semesterStart, semesterEnd, rangeStart, rangeEnd, viewerRole) {
  if (!slots?.length || !semesterStart || !semesterEnd) return [];

  const windowStart = laterOf(startOfDay(new Date(`${semesterStart}T00:00:00`)), startOfDay(rangeStart));
  const windowEnd = earlierOf(endOfDay(new Date(`${semesterEnd}T00:00:00`)), endOfDay(rangeEnd));
  if (windowStart > windowEnd) return [];

  const slotsByWeekday = {};
  for (const slot of slots) {
    (slotsByWeekday[slot.weekday] ??= []).push(slot);
  }

  const events = [];
  for (let day = windowStart; day <= windowEnd; day = addDays(day, 1)) {
    const daySlots = slotsByWeekday[jsDayToBackendWeekday(day.getDay())];
    if (!daySlots) continue;

    for (const slot of daySlots) {
      const detail = viewerRole === 'EDUCATOR' ? slot.batch_name : slot.educator_name;
      events.push({
        id: `timetable-${slot.id}-${dateKey(day)}`,
        title: detail ? `${slot.course_name} · ${detail}` : slot.course_name,
        event_type: 'class',
        start: combineDateAndTime(day, slot.start_time).toISOString(),
        end: combineDateAndTime(day, slot.end_time).toISOString(),
        all_day: false,
        course: { id: slot.course, name: slot.course_name },
        created_by: null,
        can_edit: false,
        is_timetable: true,
        timetable_slot_id: slot.id,
      });
    }
  }
  return events;
}
