// Generic calendar date-range helpers, shared by the workload widgets and
// the full Calendar page so "this week"/"this month" always mean the same
// thing everywhere in the app.

export function dateKey(d) {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday-start week
  d.setDate(d.getDate() + diff);
  return d;
}

export function endOfWeek(weekStart) {
  return endOfDay(addDays(weekStart, 6));
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** Every "YYYY-M" month touched by the given dates, as [year, month(1-based)] pairs. */
export function monthsTouched(dates) {
  const set = new Set(dates.map((d) => `${d.getFullYear()}-${d.getMonth() + 1}`));
  return [...set].map((m) => m.split('-').map(Number));
}

/** The [start, end] window a given calendar view mode should display around anchor. */
export function visibleRange(viewMode, anchor) {
  if (viewMode === 'day') {
    return { start: startOfDay(anchor), end: endOfDay(anchor) };
  }
  if (viewMode === 'week') {
    const start = startOfWeek(anchor);
    return { start, end: endOfWeek(start) };
  }
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}
