import { useState, useEffect } from "react";
import {
  Building2, Users, GraduationCap, BookOpen,
  Activity
} from "lucide-react";
import dashboardService from "../services/dashboardService";

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
           style={{ background: accent.bg }}>
        <Icon size={16} style={{ color: accent.icon }} />
      </div>
      <p className="text-2xl font-medium text-gray-900 leading-none mb-1">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

const ACCENTS = [
  { bg: '#F0F3FA', icon: '#395886' },   // blue — institutions
  { bg: '#e6f4f1', icon: '#1d6b5a' },   // teal — students
  { bg: '#eeecfe', icon: '#4b3eb5' },   // violet — educators
  { bg: '#fdf3e4', icon: '#a0610d' },   // amber — courses
  { bg: '#fdeaed', icon: '#9b1c30' },   // rose — active users
];

export default function SuperAdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const result = await dashboardService.getSuperAdminDashboard();
        if (!ignore) setData(result);
      } catch {
        if (!ignore) setError("Failed to load dashboard.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Loading dashboard...
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-400 text-sm">{error}</div>
  );

  const { summary, institutions } = data;

  const stats = [
    { label: 'Institutions',  value: summary.total_institutions, icon: Building2,    },
    { label: 'Students',      value: summary.total_students,     icon: Users,         },
    { label: 'Educators',     value: summary.total_educators,    icon: GraduationCap, },
    { label: 'Courses',       value: summary.total_courses,      icon: BookOpen,      },
    { label: 'Active users',  value: summary.total_users,        icon: Activity,      },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-medium text-gray-900 mb-1">Super admin dashboard</h1>
        <p className="text-sm text-gray-400">System-wide overview across all institutions</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} accent={ACCENTS[i]} />
        ))}
      </div>

      {/* Institutions table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900">Institutions</h2>
          <span className="text-xs text-gray-400">{institutions?.length ?? 0} total</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid gap-3 px-5 py-3 border-b border-gray-100
                          grid-cols-[1fr_70px_80px_90px]
                          max-sm:grid-cols-[1fr_90px]">
            {['Institution', 'Courses', 'Students', 'Status'].map((h, i) => (
              <span key={h}
                className={`text-[11px] font-medium text-gray-400 uppercase tracking-wide
                  ${i > 0 ? 'text-right' : ''}
                  ${i === 2 ? 'max-sm:hidden' : ''}
                  ${i === 1 ? 'max-sm:hidden' : ''}
                `}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {institutions?.map(inst => (
            <div key={inst.id}
              className="grid gap-3 px-5 py-3.5 border-b border-gray-100 last:border-0
                         items-center hover:bg-[#F0F3FA] transition-colors cursor-pointer
                         grid-cols-[1fr_70px_80px_90px]
                         max-sm:grid-cols-[1fr_90px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#D5DEEF] flex items-center
                                justify-center flex-shrink-0">
                  <Building2 size={13} className="text-[#395886]" />
                </div>
                <span className="text-sm font-medium text-gray-800 truncate">
                  {inst.name}
                </span>
              </div>
              <span className="text-sm text-gray-500 text-right max-sm:hidden">
                {inst.course_count}
              </span>
              <span className="text-sm text-gray-500 text-right max-sm:hidden">
                {inst.student_count}
              </span>
              <div className="flex justify-end">
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full
                  ${inst.is_active !== false
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                  {inst.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}