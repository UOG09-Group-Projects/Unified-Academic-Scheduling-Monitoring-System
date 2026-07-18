import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  Users,
  Layers,
} from 'lucide-react';

import dashboardService from "../services/dashboardService";
import StatCard from "../components/StatCard";
import PageHeader from "../components/ui/PageHeader";
import BarChartCard from "../components/charts/BarChartCard";
import { SkeletonRows } from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";

const TONES = ['ocean', 'success', 'violet', 'warning'];

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
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState message={error} />
      </div>
    );
  }

  const { summary, students_per_batch, educators_per_course } = data;

  const studentsPerBatchChart = (students_per_batch ?? []).map((i) => ({
    name: i.batch__name, value: i.student_count,
  }));
  const educatorsPerCourseChart = (educators_per_course ?? []).map((i) => ({
    name: i.course__name, value: i.educator_count,
  }));

  const stats = [
    { label: "Courses",   value: summary.total_courses,   icon: BookOpen },
    { label: "Educators", value: summary.total_educators, icon: GraduationCap },
    { label: "Batches",   value: summary.total_batches,   icon: Layers },
    { label: "Students",  value: summary.total_students,  icon: Users },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="Manager dashboard"
        subtitle={`Operational overview of ${summary.institution_name}`}
      />

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} tone={TONES[i]} />
        ))}
      </motion.div>

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={1}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <BarChartCard title="Students per batch" icon={Users} data={studentsPerBatchChart} color="#00A0F5" />
        <BarChartCard title="Educators per course" icon={GraduationCap} data={educatorsPerCourseChart} color="#1F9D6C" />
      </motion.div>
    </div>
  );
}
