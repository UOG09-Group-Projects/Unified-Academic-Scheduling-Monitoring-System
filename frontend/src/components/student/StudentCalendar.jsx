// src/components/student/StudentCalendar.jsx
import { useState, useEffect, useReducer } from 'react';
import dashboardService from '../../services/dashboardService';

// ── Reducer ──────────────────────────────────────────────
const eventsInitial = { events: [], loading: true, error: false };

function eventsReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { events: [], loading: true, error: false };
    case 'SUCCESS':
      return { events: action.payload, loading: false, error: false };
    case 'ERROR':
      return { events: [], loading: false, error: true };
    default:
      return state;
  }
}

// ── Constants ─────────────────────────────────────────────
const EVENT_STYLES = {
  class:      { bg: 'bg-[#1A2466]', text: 'text-[#2B4EFF]', dot: '#2B4EFF' },
  assignment: { bg: 'bg-[#2D1F00]', text: 'text-[#F59E0B]', dot: '#F59E0B' },
  exam:       { bg: 'bg-[#2D0000]', text: 'text-[#EF4444]', dot: '#EF4444' },
  holiday:    { bg: 'bg-[#0D2D1A]', text: 'text-[#22C55E]', dot: '#22C55E' },
  meeting:    { bg: 'bg-[#1F1040]', text: 'text-[#A78BFA]', dot: '#A78BFA' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function StudentCalendar() {
  const now = new Date();

  // Calendar navigation state — these are fine as useState
  // because they're changed by user clicks, not inside effects
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [selDay, setSelDay] = useState(null);

  // Async data state — use reducer to batch all updates
  const [state, dispatch] = useReducer(eventsReducer, eventsInitial);
  const { events, loading } = state;

  useEffect(() => {
    let ignore = false;

    // Single dispatch — replaces setLoading(true) + setError(null)
    dispatch({ type: 'LOADING' });

    dashboardService
      .getCalendarEvents(year, month + 1)
      .then(data => {
        if (!ignore) dispatch({ type: 'SUCCESS', payload: data });
      })
      .catch(() => {
        if (!ignore) dispatch({ type: 'ERROR' });
      });

    return () => { ignore = true; };
  }, [year, month]);

  // ── Derived values ────────────────────────────────────────
  const byDate = events.reduce((acc, ev) => {
    const d = new Date(ev.date).getDate();
    if (!acc[d]) acc[d] = [];
    acc[d].push(ev);
    return acc;
  }, {});

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const todayNum    =
    now.getFullYear() === year && now.getMonth() === month
      ? now.getDate()
      : null;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selEvents = selDay ? byDate[selDay] || [] : [];

  // ── Month navigation ──────────────────────────────────────
  const prev = () => {
    setSelDay(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const next = () => {
    setSelDay(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="bg-[#1A1D26] border border-[#2A2D3A] rounded-xl overflow-hidden">

      {/* ── Calendar Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2D3A]">
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B7280]">
          Calendar
        </span>
        <div className="flex items-center gap-2.5">
          {/* Prev */}
          <button
            onClick={prev}
            className="w-7 h-7 rounded-lg border border-[#2A2D3A] bg-transparent
                       text-[#6B7280] hover:text-[#F0F2F8] hover:border-[#4B5563]
                       flex items-center justify-center cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-sm font-medium text-[#F0F2F8] min-w-[130px] text-center">
            {MONTHS[month]} {year}
          </span>

          {/* Next */}
          <button
            onClick={next}
            className="w-7 h-7 rounded-lg border border-[#2A2D3A] bg-transparent
                       text-[#6B7280] hover:text-[#F0F2F8] hover:border-[#4B5563]
                       flex items-center justify-center cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* ── Day labels ── */}
        <div className="grid grid-cols-7 mb-1.5">
          {DAYS.map(d => (
            <div
              key={d}
              className="text-center text-[10px] font-semibold tracking-[0.1em]
                         uppercase text-[#6B7280] py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── Day grid ── */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="h-[42px]" />;

            const dayEvts = byDate[day] || [];
            const isToday = day === todayNum;
            const isSel   = day === selDay;
            const hasEvts = dayEvts.length > 0;

            return (
              <button
                key={day}
                onClick={() => setSelDay(isSel ? null : day)}
                className={`
                  relative h-[42px] flex flex-col items-center justify-center
                  rounded-lg text-sm border-none cursor-pointer transition-colors
                  ${isSel
                    ? 'bg-[#2B4EFF] text-white font-medium'
                    : isToday
                    ? 'bg-[#2A2D3A] text-[#F0F2F8] font-semibold'
                    : 'bg-transparent text-[#F0F2F8] hover:bg-[#2A2D3A]/50'
                  }
                `}
              >
                {day}
                {hasEvts && !isSel && (
                  <div className="flex gap-0.5 absolute bottom-1">
                    {dayEvts.slice(0, 3).map((e, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{
                          backgroundColor:
                            EVENT_STYLES[e.event_type]?.dot || '#6B7280',
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Loading skeleton overlay ── */}
        {loading && (
          <div className="mt-2 flex flex-col gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-3 bg-[#2A2D3A] rounded animate-skeleton"
                style={{ width: `${60 + i * 15}%` }}
              />
            ))}
          </div>
        )}

        {/* ── Selected day events ── */}
        {selDay !== null && !loading && (
          <div className="mt-4 border-t border-[#2A2D3A] pt-4">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase
                          text-[#6B7280] mb-2.5">
              {MONTHS[month]} {selDay}
            </p>

            {selEvents.length === 0 ? (
              <p className="text-[13px] text-[#6B7280] italic">
                No events scheduled
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {selEvents.map((ev, i) => {
                  const es = EVENT_STYLES[ev.event_type] || EVENT_STYLES.class;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${es.bg}`}>
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: es.dot }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${es.text}`}>{ev.title}</p>
                        {ev.course_name && (
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            {ev.course_name}
                          </p>
                        )}
                        {ev.time && (
                          <p className="text-[11px] text-[#6B7280]">
                            {ev.time.slice(0, 5)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5
                                    rounded shrink-0 ${es.text}`}
                        style={{ backgroundColor: es.dot + '33' }}
                      >
                        {ev.event_type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Legend ── */}
        <div className="mt-4 border-t border-[#2A2D3A] pt-3 flex flex-wrap gap-3">
          {Object.entries(EVENT_STYLES).map(([type, s]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: s.dot }}
              />
              <span className="text-[11px] text-[#6B7280] capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}