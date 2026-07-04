import { useState, useEffect } from "react";
import { Building2, Users, GraduationCap, BookOpen, Activity } from "lucide-react";
import dashboardService from "../services/dashboardService";

function StatCard({ label, value, icon: Icon, lightColor, textColor, trend }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border">
      <div className={`w-11 h-11 ${lightColor} flex items-center justify-center rounded-lg`}>
        <Icon className={textColor} size={20} />
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {trend && <p className="text-xs text-slate-400 mt-0.5">{trend}</p>}
    </div>
  );
}

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
    <div className="flex items-center justify-center h-64 text-gray-400">
      Loading dashboard...
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500">{error}</div>
  );

  const { summary, recent_institutions } = data;

  const stats = [
    {
      label:      "Total Institutions",
      value:      summary.total_institutions,
      icon:       Building2,
      lightColor: "bg-blue-50",
      textColor:  "text-blue-600",
    },
    {
      label:      "Total Students",
      value:      summary.total_students,
      icon:       Users,
      lightColor: "bg-emerald-50",
      textColor:  "text-emerald-600",
    },
    {
      label:      "Total Educators",
      value:      summary.total_educators,
      icon:       GraduationCap,
      lightColor: "bg-violet-50",
      textColor:  "text-violet-600",
    },
    {
      label:      "Total Courses",
      value:      summary.total_courses,
      icon:       BookOpen,
      lightColor: "bg-amber-50",
      textColor:  "text-amber-600",
    },
    {
      label:      "Total Active Users",
      value:      summary.total_active_users,
      icon:       Activity,
      lightColor: "bg-rose-50",
      textColor:  "text-rose-600",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Super Admin Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent institutions */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">
          Recent Institutions
        </h2>
        {recent_institutions?.length === 0 ? (
          <p className="text-sm text-gray-400">No institutions yet.</p>
        ) : (
          recent_institutions?.map(inst => (
            <div key={inst.id}
              className="flex items-center justify-between py-2.5 border-b last:border-0 text-sm">
              <span className="text-gray-800">{inst.name}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                inst.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {inst.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}