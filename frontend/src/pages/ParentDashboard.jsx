import { useState, useEffect } from 'react';
import {
  Users,
  User,
  BookOpen,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';

import StatCard from "../components/StatCard";
import dashboardService from "../services/dashboardService";

export default function ParentDashboard() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeChild, setActiveChild] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await dashboardService.getParentDashboard();
        if (!ignore) setData(result);
      } catch (err) {
        console.error('Parent dashboard error:', err.response?.status, err.response?.data);
        if (!ignore) setError('Failed to load dashboard.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center gap-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  const { guardian, children = [], total_children } = data ?? {};
  const child = children[activeChild] ?? null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          Parent Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Welcome, {guardian?.name}
        </p>
      </div>

      {/* Stat Card */}
      <StatCard
  label="Children"
  value={total_children}
  icon={Users}
/>

      {/* No children */}
      {!child ? (
        <div className="p-6 rounded-xl border bg-gray-50 text-gray-500 text-sm">
          No children linked to your account.
        </div>
      ) : (
        <div className="space-y-6">

          {/* Child Switcher */}
          {children.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {children.map((c, i) => {
                const active = activeChild === i;

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChild(i)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition
                      ${active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <User className="w-4 h-4" />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Child Info Card */}
          <div className="rounded-xl border bg-white p-5 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                {child.name}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {child.registration_no} · Batch: {child.batch || 'Not assigned'}
              </p>

              <p className="text-sm text-gray-500">
                {child.email}
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              <BookOpen className="w-4 h-4" />
              {child.total_courses} course{child.total_courses !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Courses */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                {child.name}'s Courses
              </h2>
            </div>

            {child.courses.length === 0 ? (
              <div className="p-5 text-sm text-gray-500">
                No courses found.
              </div>
            ) : (
              <div className="divide-y">
                {child.courses.map(course => (
                  <div
                    key={course.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {course.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.code}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}