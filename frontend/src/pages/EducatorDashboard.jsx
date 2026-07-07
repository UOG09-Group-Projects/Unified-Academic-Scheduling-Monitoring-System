import { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap
} from 'lucide-react';
import StatCard from "../components/StatCard";
import dashboardService from "../services/dashboardService";

export default function EducatorDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const result = await dashboardService.getEducatorDashboard();
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
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  );
  if (error) return (
      <div className="p-6 text-red-500">{error}</div>
  );

  return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Educator Dashboard</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="My Courses" value={data.summary.total_courses} color="blue"  icon={BookOpen} />
          <StatCard label="My Batches" value={data.summary.total_batches} color="green" icon={GraduationCap} />
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">My Courses</h2>
          </div>
          {data.courses.length === 0 ? (
            <p className="text-gray-400 text-sm p-5">No courses assigned yet.</p>
          ) : data.courses.map(course => (
            <div key={course.id} className="px-5 py-4 border-b last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">{course.name}</p>
                  <p className="text-xs text-gray-500">{course.code} · {course.institution}</p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {course.batch_count} batch{course.batch_count !== 1 ? 'es' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {course.batches.map(b => (
                  <span key={b.id}
                    className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

  );
}