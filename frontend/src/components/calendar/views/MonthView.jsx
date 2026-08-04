import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Pencil, Lock, CalendarDays, AlertTriangle } from 'lucide-react';
import { TYPE_COLOR } from '../eventTypeColors';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MonthView({
  anchor, events, conflictIds, selDay, onSelectDay, onAddEvent, onEditEvent, loading,
}) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const now = new Date();

  const byDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const d = new Date(ev.start).getDate();
      if (new Date(ev.start).getMonth() !== month || new Date(ev.start).getFullYear() !== year) continue;
      (map[d] ||= []).push(ev);
    }
    return map;
  }, [events, month, year]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayNum = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selEvents = selDay ? byDate[selDay] || [] : [];

  return (
    <div className="rounded-2xl border border-ink/[0.06] bg-surface overflow-hidden shadow-soft p-5">
      <div className="grid grid-cols-7 mb-2 text-[11px] font-semibold text-ink-faint">
        {DAYS.map((d) => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>

      <div className="overflow-hidden relative min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-7 gap-1"
          >
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="h-14" />;

              const dayEvts = byDate[day] || [];
              const isToday = day === todayNum;
              const isSel = day === selDay;
              const hasConflict = dayEvts.some((e) => conflictIds.has(e.id));

              return (
                <button
                  key={day}
                  onClick={() => onSelectDay(isSel ? null : day)}
                  className={`h-14 rounded-lg text-sm font-medium transition-all relative
                    ${isSel
                      ? 'bg-brand-600 text-white shadow-soft'
                      : isToday
                      ? 'bg-accent-50 text-accent-700 font-bold'
                      : 'text-ink-soft hover:bg-ink/[0.04]'
                    }
                    ${hasConflict ? 'ring-2 ring-danger/60' : ''}`}
                >
                  {hasConflict && (
                    <AlertTriangle
                      size={10}
                      className={`absolute top-0.5 right-0.5 ${isSel ? 'text-white' : 'text-danger'}`}
                    />
                  )}
                  {day}
                  {dayEvts.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {dayEvts.slice(0, 3).map((e, i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSel ? '#fff' : (TYPE_COLOR[e.event_type] || TYPE_COLOR.personal) }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {selDay !== null && (
          <motion.div
            key={selDay}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-4 pt-4 border-t border-ink/[0.06]"
          >
            <p className="text-xs uppercase tracking-widest text-ink-faint font-semibold mb-2.5">
              {MONTHS[month]} {selDay}
            </p>

            {loading ? (
              <p className="text-sm text-ink-faint">Loading…</p>
            ) : selEvents.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No events"
                message="Nothing scheduled for this day."
                action={
                  <Button variant="outline" size="sm" icon={Plus} onClick={() => onAddEvent(selDay)}>
                    Add event
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {selEvents.map((ev) => {
                  // Personal events never reveal whose they are, even to
                  // an educator who can otherwise see them for conflict-checking.
                  const label = ev.course?.name || 'Personal';

                  return (
                    <button
                      key={ev.id}
                      onClick={() => onEditEvent(ev)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-ink/[0.03] border border-transparent hover:border-ink/[0.06] group
                        ${conflictIds.has(ev.id) ? 'border-danger/30 bg-red-50/40 dark:bg-red-500/10' : ''}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: TYPE_COLOR[ev.event_type] || TYPE_COLOR.personal }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate flex items-center gap-1.5">
                          {ev.title}
                          {conflictIds.has(ev.id) && <AlertTriangle size={12} className="text-danger shrink-0" />}
                        </p>
                        <p className="text-xs text-ink-faint truncate">
                          {label}
                          {!ev.all_day && ` · ${new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      {ev.can_edit ? (
                        <Pencil size={13} className="text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      ) : (
                        <Lock size={12} className="text-ink-faint/50 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 pt-3 border-t border-ink/[0.06] flex gap-4 flex-wrap">
        {Object.entries(TYPE_COLOR).map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5 text-[11px] text-ink-faint capitalize">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            {k}
          </div>
        ))}
      </div>
    </div>
  );
}
