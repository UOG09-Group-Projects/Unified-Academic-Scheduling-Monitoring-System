// src/components/student/StudentCalendar.jsx
import { useState, useEffect, useReducer } from 'react';
import dashboardService from '../../services/dashboardService';

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

const EVENT_STYLES = {
  class:      { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: '#3B82F6' },
  assignment: { bg: 'bg-orange-50', text: 'text-orange-700', dot: '#F59E0B' },
  exam:       { bg: 'bg-red-50',    text: 'text-red-700',    dot: '#EF4444' },
  holiday:    { bg: 'bg-green-50',  text: 'text-green-700',  dot: '#22C55E' },
  meeting:    { bg: 'bg-purple-50', text: 'text-purple-700', dot: '#A78BFA' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function StudentCalendar() {
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selDay, setSelDay] = useState(null);

  const [state, dispatch] = useReducer(eventsReducer, eventsInitial);
  const { events, loading } = state;

  useEffect(() => {
    let ignore = false;
    dispatch({ type: 'LOADING' });

    dashboardService
      .getCalendarEvents(year, month + 1)
      .then(data => !ignore && dispatch({ type: 'SUCCESS', payload: data }))
      .catch(() => !ignore && dispatch({ type: 'ERROR' }));

    return () => { ignore = true; };
  }, [year, month]);

  const byDate = events.reduce((acc, ev) => {
    const d = new Date(ev.date).getDate();
    if (!acc[d]) acc[d] = [];
    acc[d].push(ev);
    return acc;
  }, {});

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayNum =
    now.getFullYear() === year && now.getMonth() === month
      ? now.getDate()
      : null;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selEvents = selDay ? byDate[selDay] || [] : [];

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

  return (
    <div className="rounded-xl border bg-white overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b">
        <p className="text-xs uppercase tracking-widest text-gray-500">
          Calendar
        </p>

        <div className="flex items-center gap-3">
          <button onClick={prev} className="px-2 py-1 border rounded hover:bg-gray-100">‹</button>
          <span className="text-sm font-medium">
            {MONTHS[month]} {year}
          </span>
          <button onClick={next} className="px-2 py-1 border rounded hover:bg-gray-100">›</button>
        </div>
      </div>

      <div className="p-5">

        {/* Days */}
        <div className="grid grid-cols-7 mb-2 text-xs text-gray-500">
          {DAYS.map(d => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} className="h-10" />;

            const dayEvts = byDate[day] || [];
            const isToday = day === todayNum;
            const isSel = day === selDay;

            return (
              <button
                key={day}
                onClick={() => setSelDay(isSel ? null : day)}
                className={`h-10 rounded text-sm transition
                  ${isSel
                    ? 'bg-blue-500 text-white'
                    : isToday
                    ? 'bg-gray-100 font-semibold'
                    : 'hover:bg-gray-100'
                  }`}
              >
                {day}

                {dayEvts.length > 0 && !isSel && (
                  <div className="flex justify-center gap-1 mt-1">
                    {dayEvts.slice(0, 3).map((e, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: EVENT_STYLES[e.event_type]?.dot }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Events */}
        {selDay !== null && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs uppercase text-gray-500 mb-2">
              {MONTHS[month]} {selDay}
            </p>

            {selEvents.length === 0 ? (
              <p className="text-sm text-gray-500">No events scheduled</p>
            ) : (
              <div className="flex flex-col gap-2">
                {selEvents.map((ev, i) => {
                  const es = EVENT_STYLES[ev.event_type] || EVENT_STYLES.class;

                  return (
                    <div key={i} className={`p-3 rounded ${es.bg}`}>
                      <p className={`font-medium ${es.text}`}>{ev.title}</p>
                      <p className="text-xs text-gray-500">
                        {ev.course_name}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t flex gap-4 flex-wrap">
          {Object.entries(EVENT_STYLES).map(([k, s]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
              {k}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}