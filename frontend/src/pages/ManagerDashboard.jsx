import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  Activity,
  AlertCircle,
} from 'lucide-react';

import dashboardService from "../services/dashboardService";
import ActivityFeed from "../components/ActivityFeed";
import StatCard from "../components/StatCard";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import BarChartCard from "../components/charts/BarChartCard";
import { SkeletonRows } from "../components/ui/Skeleton";

const TONES = ['ocean', 'success', 'violet', 'warning', 'danger'];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
      <div className="p-6 max-w-6xl mx-auto">
        <SkeletonRows rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center gap-2 text-danger text-sm">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  const { summary, courses_per_institution, educators_per_course, recent_activity } = data;

  const coursesPerInstitutionChart = (courses_per_institution ?? []).map((i) => ({
    name: i.institution__name, value: i.course_count,
  }));
  const educatorsPerCourseChart = (educators_per_course ?? []).map((i) => ({
    name: i.course__name, value: i.educator_count,
  }));

  const stats = [
    { label: "Institutions", value: summary.total_institutions, icon: Building2 },
    { label: "Courses",      value: summary.total_courses,      icon: BookOpen },
    { label: "Educators",    value: summary.total_educators,    icon: GraduationCap },
    { label: "Batches",      value: summary.total_batches,      icon: Layers },
    { label: "Students",     value: summary.total_students,     icon: Users },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <PageHeader title="Manager dashboard" subtitle="Operational overview of your institutions" />

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
      >
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} tone={TONES[i]} />
        ))}
      </motion.div>

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={1}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <BarChartCard title="Courses per institution" icon={Building2} data={coursesPerInstitutionChart} color="#00A0F5" />
        <BarChartCard title="Educators per course" icon={GraduationCap} data={educatorsPerCourseChart} color="#1F9D6C" />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        <Card>
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-ink-faint" />
            Recent activity
          </h2>
          <ActivityFeed activities={recent_activity} />
        </Card>
      </motion.div>
    </div>
  );
}
