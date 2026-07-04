// src/components/student/EducatorInlineDetail.jsx
import { useReducer, useEffect } from 'react';
import dashboardService from '../../services/dashboardService';

// ── Reducer ──────────────────────────────────────────────
const initialState = { detail: null, loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { detail: null, loading: true, error: null };
    case 'SUCCESS':
      return { detail: action.payload, loading: false, error: null };
    case 'ERROR':
      return { detail: null, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function EducatorInlineDetail({ educatorId, educatorName, onClose }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { detail, loading, error } = state;

  useEffect(() => {
    if (!educatorId) return;

    let ignore = false;

    // Single dispatch — no cascading setState calls
    dispatch({ type: 'LOADING' });

    dashboardService
      .getEducatorDetail(educatorId)
      .then(data => {
        if (!ignore) dispatch({ type: 'SUCCESS', payload: data });
      })
      .catch(() => {
        if (!ignore) dispatch({ type: 'ERROR', payload: 'Failed to load educator details.' });
      });

    return () => { ignore = true; };
  }, [educatorId]);

  const initials = detail?.initials
    || (educatorName
      ? educatorName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : '??');

  return (
    <div className="bg-[#151820] border border-[#2A2D3A] rounded-[10px] p-4 mt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg bg-[#2B4EFF]/10 border border-[#2B4EFF]/20
                       flex items-center justify-center"
          >
            <span className="text-xs font-bold text-[#2B4EFF]">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F0F2F8]">
              {detail?.name || educatorName}
            </p>
            {detail?.email && (
              <p className="text-[11px] text-[#6B7280]">{detail.email}</p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md border border-[#2A2D3A] bg-transparent
                     text-[#6B7280] hover:text-[#F0F2F8] hover:border-[#4B5563]
                     flex items-center justify-center cursor-pointer transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-2 py-1">
          <div className="h-3 w-32 bg-[#2A2D3A] rounded animate-skeleton" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 bg-[#2A2D3A] rounded-lg animate-skeleton" />
            <div className="h-14 bg-[#2A2D3A] rounded-lg animate-skeleton" />
          </div>
          <div className="h-3 w-24 bg-[#2A2D3A] rounded animate-skeleton" />
          <div className="h-8 bg-[#2A2D3A] rounded-md animate-skeleton" />
          <div className="h-8 bg-[#2A2D3A] rounded-md animate-skeleton" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Content */}
      {detail && !loading && (
        <>
          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'Courses',  value: detail.total_courses  },
              { label: 'Students', value: detail.total_students },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-[#0F1117] border border-[#2A2D3A] rounded-lg px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#6B7280]">
                  {s.label}
                </p>
                <p className="text-2xl font-light text-[#F0F2F8] leading-none mt-1">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Courses taught */}
          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#6B7280] mb-2">
            Courses Taught
          </p>
          <div className="flex flex-col gap-1">
            {detail.courses.map((c, i) => (
              <div
                key={i}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-md
                  ${i % 2 === 0 ? 'bg-[#0F1117]' : 'bg-transparent'}
                `}
              >
                <div>
                  <p className="text-[13px] text-[#F0F2F8]">{c.course_name}</p>
                  <p className="text-[11px] text-[#6B7280]">
                    {c.course_code} · {c.institution}
                  </p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded
                             bg-[#2B4EFF]/10 text-[#2B4EFF]"
                >
                  {c.batch}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}