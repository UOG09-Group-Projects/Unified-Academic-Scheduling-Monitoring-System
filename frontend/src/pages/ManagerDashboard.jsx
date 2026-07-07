import { useState, useEffect } from 'react';
import {
  Building2,
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  Activity,
  AlertCircle
} from 'lucide-react';

import dashboardService from "../services/dashboardService";
import ActivityFeed from "../components/ActivityFeed";

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ background: accent.bg }}
      >
        <Icon size={16} style={{ color: accent.icon }} />
      </div>

      <p className="text-2xl font-medium text-gray-900 leading-none mb-1">
        {value ?? 0}
      </p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

const ACCENTS = [
  { bg: '#F0F3FA', icon: '#395886' }, // blue
  { bg: '#e6f4f1', icon: '#1d6b5a' }, // green
  { bg: '#eeecfe', icon: '#4b3eb5' }, // purple
  { bg: '#fdf3e4', icon: '#a0610d' }, // orange
  { bg: '#fdeaed', icon: '#9b1c30' }, // red
];

export default function ManagerDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await dashboardService.getManagerDashboard();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center gap-2 text-red-500 text-sm">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  const {
    summary,
    courses_per_institution,
    educators_per_course,
    recent_activity
  } = data;

  const stats = [
    { label: "Institutions", value: summary.total_institutions, icon: Building2 },
    { label: "Courses",      value: summary.total_courses,      icon: BookOpen },
    { label: "Educators",    value: summary.total_educators,    icon: GraduationCap },
    { label: "Batches",      value: summary.total_batches,      icon: Layers },
    { label: "Students",     value: summary.total_students,     icon: Users },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-medium text-gray-900">
          Manager Dashboard
        </h1>
        <p className="text-sm text-gray-400">
          Operational overview of your institutions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            {...s}
            accent={ACCENTS[i]}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Courses per Institution */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            Courses per Institution
          </h2>

          <div className="space-y-3">
            {courses_per_institution?.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate">
                  {item.institution__name}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {item.course_count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Educators per Course */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            Educators per Course
          </h2>

          <div className="space-y-3">
            {educators_per_course?.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate">
                  {item.course__name}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {item.educator_count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Activity */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500" />
          Recent Activity
        </h2>

        <ActivityFeed activities={recent_activity} />
      </div>

    </div>
  );
}