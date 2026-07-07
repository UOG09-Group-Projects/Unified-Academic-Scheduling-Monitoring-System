// src/pages/StudentDashboard.jsx
import { useReducer, useEffect } from 'react';
import { BookOpen, Calendar, BarChart3 } from 'lucide-react';

import StudentProfileCard from '../components/student/StudentProfileCard';
import StudentStatCards from '../components/student/StudentStatCards';
import StudentCourseList from '../components/student/StudentCourseList';
import StudentCalendar from '../components/student/StudentCalendar';
import dashboardService from '../services/dashboardService';

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

    dashboardService
      .getStudentDashboard()
      .then(result => {
        if (!ignore) dispatch({ type: 'SUCCESS', payload: result });
      })
      .catch(err => {
        if (!ignore) {
          dispatch({
            type: 'ERROR',
            payload: err?.message || 'Failed to load dashboard.',
          });
        }
      });

    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-400 text-sm">{error}</div>
    );
  }

  const { student, summary, courses } = data;

  const stats = [
    {
      label: "Enrolled Courses",
      value: summary?.total_courses,
      icon: BookOpen,
      accent: { bg: "#F0F3FA", icon: "#395886" },
    },
    {
      label: "Completed",
      value: summary?.completed_courses,
      icon: BarChart3,
      accent: { bg: "#e6f4f1", icon: "#1d6b5a" },
    },
    {
      label: "Upcoming",
      value: summary?.upcoming_classes,
      icon: Calendar,
      accent: { bg: "#fdf3e4", icon: "#a0610d" },
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-medium text-gray-900 mb-1">
          Student dashboard
        </h1>
        <p className="text-sm text-gray-400">
          Your learning progress and course activity
        </p>
      </div>

      {/* Profile Section */}
      <div className="mb-8 bg-white border border-gray-100 rounded-xl p-5">
        <StudentProfileCard student={student} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StudentStatCards summary={summary} />
      </div>

      {/* Courses Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900">Courses</h2>
          <span className="text-xs text-gray-400">
            {courses?.length ?? 0} total
          </span>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <StudentCourseList courses={courses} />
        </div>
      </div>

      {/* Calendar Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900">Schedule</h2>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <StudentCalendar />
        </div>
      </div>

    </div>
  );
}