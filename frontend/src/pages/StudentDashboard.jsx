// src/pages/StudentDashboard.jsx
import { useReducer, useEffect } from 'react';
import StudentProfileCard from '../components/student/StudentProfileCard';
import StudentStatCards from '../components/student/StudentStatCards';
import StudentCourseList from '../components/student/StudentCourseList';
import StudentCalendar from '../components/student/StudentCalendar';
import dashboardService from '../services/dashboardService';

// ── Reducer ──────────────────────────────────────────────
const initial = { data: null, loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { data: null, loading: true, error: null };
    case 'SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'ERROR':
      return { data: null, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function StudentDashboard() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { data, loading, error } = state;

  useEffect(() => {
    let ignore = false;

    // Single dispatch — one render, no cascade
    dispatch({ type: 'LOADING' });

    dashboardService
      .getStudentDashboard()
      .then(result => {
        if (!ignore) dispatch({ type: 'SUCCESS', payload: result });
      })
      .catch(err => {
        if (!ignore) dispatch({
          type: 'ERROR',
          payload: err?.message || 'Failed to load dashboard.',
        });
      });

    return () => { ignore = true; };
  }, []);

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
        <div className="max-w-[880px] mx-auto px-6 py-8 flex flex-col gap-3">
          <div className="h-4 w-24 bg-[#1A1D26] rounded animate-skeleton" />
          <div className="h-24 bg-[#1A1D26] rounded-xl animate-skeleton" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 bg-[#1A1D26] rounded-xl animate-skeleton" />
            <div className="h-28 bg-[#1A1D26] rounded-xl animate-skeleton" />
          </div>
          <div className="h-4 w-28 bg-[#1A1D26] rounded animate-skeleton mt-1" />
          <div className="h-28 bg-[#1A1D26] rounded-xl animate-skeleton" />
          <div className="h-28 bg-[#1A1D26] rounded-xl animate-skeleton" />
          <div className="h-4 w-20 bg-[#1A1D26] rounded animate-skeleton mt-1" />
          <div className="h-96 bg-[#1A1D26] rounded-xl animate-skeleton" />
        </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-sm text-red-400 mb-2">{error}</p>
            <button
              onClick={() => dispatch({ type: 'LOADING' })}
              className="text-[13px] text-[#2B4EFF] bg-transparent border-none
                         cursor-pointer underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
    );
  }

  const { student, summary, courses } = data;

  // ── Dashboard ─────────────────────────────────────────────
  return (
      <div className="max-w-[880px] mx-auto px-6 py-8 flex flex-col gap-5">

        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B7280]">
          Your Profile
        </span>

        <StudentProfileCard student={student} />

        <StudentStatCards summary={summary} />

        <StudentCourseList courses={courses} />

        <StudentCalendar />

      </div>
  );
}