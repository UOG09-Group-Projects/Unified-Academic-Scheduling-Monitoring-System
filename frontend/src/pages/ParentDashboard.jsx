import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from "../components/StatCard";
import dashboardService from "../services/dashboardService";

export default function ParentDashboard() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeChild, setActiveChild] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const result = await dashboardService.getParentDashboard();
        if (!ignore) setData(result);
      } catch {
        if (!ignore) setError('Failed to load dashboard.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="p-6 text-red-500">{error}</div>
    </DashboardLayout>
  );

  const { guardian, children, total_children } = data;
  const child = children[activeChild];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Parent Dashboard
        </h1>
        <p className="text-sm text-gray-500 mb-6">Welcome, {guardian.name}</p>

        <StatCard label="Children" value={total_children} color="blue" icon="👨‍👩‍👧" />

        {children.length === 0 ? (
          <p className="text-gray-400 text-sm mt-6">No children linked to your account.</p>
        ) : (
          <div className="mt-6">
            {/* Child Switcher */}
            {children.length > 1 && (
              <div className="flex gap-2 mb-4">
                {children.map((c, i) => (
                  <button key={c.id} onClick={() => setActiveChild(i)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activeChild === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border hover:bg-gray-50'
                      }`}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Child Info */}
            <div className="bg-white rounded-xl shadow p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{child.name}</h2>
                  <p className="text-sm text-gray-500">
                    {child.registration_no} · Batch: {child.batch || 'Not assigned'}
                  </p>
                  <p className="text-sm text-gray-500">{child.email}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                  {child.total_courses} course{child.total_courses !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Child's Courses */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="text-sm font-semibold text-gray-500 uppercase">
                  {child.name}'s Courses
                </h2>
              </div>
              {child.courses.length === 0 ? (
                <p className="text-gray-400 text-sm p-5">No courses found.</p>
              ) : child.courses.map(course => (
                <div key={course.id} className="px-5 py-3 border-b last:border-0
                                                 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{course.name}</p>
                    <p className="text-xs text-gray-500">{course.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}