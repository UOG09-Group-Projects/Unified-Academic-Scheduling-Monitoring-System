import { useEffect, useMemo, useRef } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { TYPE_COLOR } from '../eventTypeColors';
import { dateKey, startOfDay } from '../../../utils/dateRange';

const HOUR_HEIGHT = 48; // px
const GRID_HEIGHT = HOUR_HEIGHT * 24;
const VISIBLE_HEIGHT = 600; // scrollable viewport height

function minutesInDay(iso, day, fallbackDurationMin) {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const start = Math.max(new Date(iso.start).getTime(), dayStart);
  let end = iso.end ? new Date(iso.end).getTime() : start + fallbackDurationMin * 60000;
  end = Math.min(Math.max(end, start + fallbackDurationMin * 60000), dayEnd);
  return { startMin: (start - dayStart) / 60000, endMin: (end - dayStart) / 60000 };
}

// Greedy column assignment so overlapping events sit side-by-side instead of stacking.
function layoutColumns(items) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin);
  const colEnds = [];
  const placed = sorted.map((ev) => {
    let col = colEnds.findIndex((endMin) => ev.startMin >= endMin);
    if (col === -1) { col = colEnds.length; colEnds.push(ev.endMin); }
    else { colEnds[col] = ev.endMin; }
    return { ...ev, col };
  });
  const colCount = colEnds.length || 1;
  return placed.map((p) => ({ ...p, colCount }));
}

export default function TimeGrid({ days, events, conflictIds, onSlotClick, onEventClick }) {
  const scrollRef = useRef(null);
  const now = new Date();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, 7 * HOUR_HEIGHT - 40);
    }
  }, []);

  const byDay = useMemo(() => {
    return days.map((day) => {
      const key = dateKey(day);
      const dayEvents = events.filter((e) => dateKey(e.start) === key);
      const allDay = dayEvents.filter((e) => e.all_day);
      const timed = dayEvents
        .filter((e) => !e.all_day)
        .map((e) => ({ event: e, ...minutesInDay(e, day, 30) }));
      return { day, allDay, timed: layoutColumns(timed) };
    });
  }, [days, events]);

  const hours = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="rounded-2xl border border-ink/[0.06] bg-surface overflow-hidden shadow-soft">
      {/* Day headers */}
      <div className="flex border-b border-ink/[0.06]">
        <div className="w-14 shrink-0" />
        {byDay.map(({ day, allDay }) => {
          const isToday = dateKey(day) === dateKey(now);
          return (
            <div
              key={dateKey(day)}
              className="flex-1 min-w-0 px-2 py-2.5 text-center border-l border-ink/[0.06] first:border-l-0"
            >
              <p className="text-[10px] uppercase tracking-wide text-ink-faint font-semibold">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </p>
              <p className={`text-sm font-display mt-0.5 ${isToday ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white font-semibold' : 'text-ink font-semibold'}`}>
                {day.getDate()}
              </p>
              {allDay.length > 0 && (
                <div className="mt-1.5 flex flex-col gap-1">
                  {allDay.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      className="w-full truncate text-[10px] font-medium text-white rounded px-1.5 py-0.5"
                      style={{ backgroundColor: TYPE_COLOR[ev.event_type] || TYPE_COLOR.personal }}
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto scroll-thin" style={{ maxHeight: VISIBLE_HEIGHT }}>
        <div className="flex relative" style={{ height: GRID_HEIGHT }}>
          {/* Hour gutter */}
          <div className="w-14 shrink-0 relative">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 text-right pr-2 text-[10px] text-ink-faint -translate-y-1/2"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {h === 0 ? '' : `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`}
              </div>
            ))}
          </div>

          {byDay.map(({ day, timed }) => {
            const isToday = dateKey(day) === dateKey(now);
            const nowTop = isToday ? ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT : null;

            return (
              <div
                key={dateKey(day)}
                className="flex-1 min-w-0 relative border-l border-ink/[0.06] first:border-l-0"
                onClick={(e) => {
                  if (e.target !== e.currentTarget) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const hour = Math.floor((e.clientY - rect.top) / HOUR_HEIGHT);
                  onSlotClick(day, Math.min(23, Math.max(0, hour)));
                }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-ink/[0.04]"
                    style={{ top: h * HOUR_HEIGHT }}
                  />
                ))}

                {nowTop != null && (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                    <div className="w-full border-t-2 border-danger relative">
                      <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-danger" />
                    </div>
                  </div>
                )}

                {timed.map(({ event: ev, startMin, endMin, col, colCount }) => {
                  const top = (startMin / 60) * HOUR_HEIGHT;
                  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20);
                  const width = 100 / colCount;
                  const isConflict = conflictIds.has(ev.id);

                  return (
                    <button
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      className={`absolute rounded-md px-1.5 py-0.5 text-left text-white text-[11px] leading-tight overflow-hidden shadow-sm z-10
                        ${isConflict ? 'ring-2 ring-danger' : ''}`}
                      style={{
                        top,
                        height,
                        left: `${col * width}%`,
                        width: `calc(${width}% - 3px)`,
                        backgroundColor: TYPE_COLOR[ev.event_type] || TYPE_COLOR.personal,
                      }}
                    >
                      <span className="flex items-center gap-1 font-semibold truncate">
                        {isConflict && <AlertTriangle size={10} className="shrink-0" />}
                        {!ev.can_edit && <Lock size={9} className="shrink-0 opacity-80" />}
                        <span className="truncate">{ev.title}</span>
                      </span>
                      {height > 32 && (
                        <span className="block opacity-90 truncate">
                          {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
