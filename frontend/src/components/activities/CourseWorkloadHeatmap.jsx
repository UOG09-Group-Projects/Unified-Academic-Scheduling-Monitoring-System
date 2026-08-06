import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import activityService from '../../services/activityService';
import Card from '../ui/Card';
import BarChartCard from '../charts/BarChartCard';
import { TYPE_COLOR } from '../calendar/eventTypeColors';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WORKLOAD_TYPES = ['assignment', 'exam'];

// 0 = free, 3+ matches the backend's DAY_OVERLOAD_THRESHOLD for "overloaded".
const LEVEL_STYLE = [
  {},
  { backgroundColor: 'rgba(239,68,68,0.16)' },
  { backgroundColor: 'rgba(239,68,68,0.36)' },
  { backgroundColor: 'rgba(239,68,68,0.62)', color: '#fff' },
];

function dateKeyForDay(year, month, day) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function busyLevel(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

/**
 * Busy-day heatmap + breakdown chart for a course's enrolled students,
 * counting deadlines across every course those students take (not just this
 * one) — so an educator can spot a genuinely free day before assigning a
 * new activity. Clicking a day fills it into the due-date field via
 * onSelectDate.
 */
export default function CourseWorkloadHeatmap({ courseId, selectedDate, onSelectDate }) {
  const [anchor, setAnchor] = useState(() => {
    if (selectedDate) {
      const d = new Date(`${selectedDate}T00:00:00`);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [types, setTypes] = useState(() => new Set(WORKLOAD_TYPES));
  const [counts, setCounts] = useState({});

  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  useEffect(() => {
    if (!courseId) return;
    let ignore = false;
    activityService.courseWorkload(courseId, year, month + 1)
      .then((data) => { if (!ignore) setCounts(data); })
      .catch(() => { if (!ignore) setCounts({}); });
    return () => { ignore = true; };
  }, [courseId, year, month]);

  const toggleType = (t) => {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next.size === 0 ? prev : next;
    });
  };

  const dayCount = (day) => {
    const entry = counts[dateKeyForDay(year, month, day)];
    if (!entry) return 0;
    let total = 0;
    if (types.has('assignment')) total += entry.assignment || 0;
    if (types.has('exam')) total += entry.exam || 0;
    return total;
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goto = (delta) => setAnchor(new Date(year, month + delta, 1));

  const chartData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const entry = counts[dateKeyForDay(year, month, day)] || { assignment: 0, exam: 0 };
      return { name: String(day), assignment: entry.assignment || 0, exam: entry.exam || 0 };
    }).filter((d) => d.assignment > 0 || d.exam > 0);
  }, [counts, year, month, daysInMonth]);

  const chartSeries = [
    types.has('assignment') && { key: 'assignment', name: 'Assignments', color: TYPE_COLOR.assignment },
    types.has('exam') && { key: 'exam', name: 'Exams', color: TYPE_COLOR.exam },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      <Card padding="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-ink-faint font-semibold flex items-center gap-1.5">
            <Flame size={13} className="text-danger" />
            Student workload
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goto(-1)}
              className="w-6 h-6 rounded-lg border border-ink/10 flex items-center justify-center text-ink-soft hover:bg-ink/[0.04] transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-xs font-semibold text-ink w-[92px] text-center">{MONTHS[month]} {year}</span>
            <button
              type="button"
              onClick={() => goto(1)}
              className="w-6 h-6 rounded-lg border border-ink/10 flex items-center justify-center text-ink-soft hover:bg-ink/[0.04] transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {WORKLOAD_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-[11px] text-ink-faint cursor-pointer select-none">
              <input
                type="checkbox"
                checked={types.has(t)}
                onChange={() => toggleType(t)}
                className="w-3 h-3 rounded accent-brand-600 cursor-pointer"
              />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLOR[t] }} />
              {t === 'assignment' ? 'Assignments' : 'Exams'}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-ink-faint">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="h-8" />;
            const count = dayCount(day);
            const level = busyLevel(count);
            const key = dateKeyForDay(year, month, day);
            const isSelected = key === selectedDate;

            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDate?.(key)}
                title={count ? `${count} due this day` : 'Free day'}
                style={LEVEL_STYLE[level]}
                className={`h-8 rounded-lg text-[11px] font-medium flex items-center justify-center transition-all
                  ${isSelected ? 'ring-2 ring-brand-600' : ''}
                  ${level === 0 ? 'text-ink-soft hover:bg-ink/[0.06]' : 'hover:brightness-95'}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-ink-faint">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.16)' }} /> Light
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.36)' }} /> Busy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.62)' }} /> Very busy
          </span>
        </div>
      </Card>

      {chartSeries.length > 0 && (
        <BarChartCard title="Deadlines this month" data={chartData} series={chartSeries} height={140} />
      )}
    </div>
  );
}
