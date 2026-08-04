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
import StatGrid from "../components/ui/StatGrid";
import PageHeader from "../components/ui/PageHeader";
import BarChartCard from "../components/charts/BarChartCard";
import DonutChartCard from "../components/charts/DonutChartCard";
import { useSeriesColor } from "../components/charts/useSeriesColor";
import { SkeletonRows } from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import { fadeUp } from "../utils/motionVariants";

const TONES = ['ocean', 'success', 'violet', 'warning'];

// Batches are unbounded, so the pie only ever spends the validated 4-slot
// categorical theme on the biggest batches (already sorted desc by the
// backend) and folds the rest into one "Other" slice — never cycles the
// palette past what's been colorblind-validated (see chartColors.js).
// Takes the theme-resolved palette as params since this runs outside the
// component (where hooks like useSeriesColor can't be called).
function batchesToDonutData(studentsPerBatch, categoricalTheme, neutralColor) {
  const top = studentsPerBatch.slice(0, categoricalTheme.length);
  const rest = studentsPerBatch.slice(categoricalTheme.length);
  const otherCount = rest.reduce((sum, b) => sum + b.student_count, 0);

  const slices = top.map((b, i) => ({
    name: b.batch__name, value: b.student_count, color: categoricalTheme[i],
  }));
  if (otherCount > 0) {
    slices.push({ name: 'Other', value: otherCount, color: neutralColor });
  }
  return slices;
}

export default function ManagerDashboard() {
  const { color: SERIES_COLOR, categorical: CATEGORICAL_THEME } = useSeriesColor();
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
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <SkeletonRows rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
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
  const studentsPerBatchDonut = batchesToDonutData(students_per_batch ?? [], CATEGORICAL_THEME, SERIES_COLOR.neutral);

  const stats = [
    { label: "Courses",   value: summary.total_courses,   icon: BookOpen },
    { label: "Educators", value: summary.total_educators, icon: GraduationCap },
    { label: "Batches",   value: summary.total_batches,   icon: Layers },
    { label: "Students",  value: summary.total_students,  icon: Users },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Manager dashboard"
        subtitle={`Operational overview of ${summary.institution_name}`}
      />

      <StatGrid custom={0}>
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} tone={TONES[i]} />
        ))}
      </StatGrid>

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={1}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <BarChartCard title="Students per batch" icon={Users} data={studentsPerBatchChart} color={SERIES_COLOR.ocean} />
        <BarChartCard title="Educators per course" icon={GraduationCap} data={educatorsPerCourseChart} color={SERIES_COLOR.success} />
        <DonutChartCard title="Batches by size" icon={Layers} data={studentsPerBatchDonut} />
      </motion.div>
    </div>
  );
}
