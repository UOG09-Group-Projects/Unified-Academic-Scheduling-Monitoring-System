import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Layers3, ArrowRight } from 'lucide-react';
import StatCard from "../components/StatCard";
import StatGrid from "../components/ui/StatGrid";
import EventCalendar from "../components/calendar/EventCalendar";
import WorkloadSummary from "../components/calendar/WorkloadSummary";
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import BarChartCard from '../components/charts/BarChartCard';
import { useSeriesColor } from '../components/charts/useSeriesColor';
import EducatorCourseActivities from '../components/activities/EducatorCourseActivities';
import { SkeletonRows } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import dashboardService from "../services/dashboardService";
import { fadeUp } from '../utils/motionVariants';

export default function EducatorDashboard() {
  const { color: SERIES_COLOR } = useSeriesColor();
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

  const coursesWithBatches = data.courses.filter((c) => c.batch_count > 0).length;
  const coverage = data.summary.total_courses > 0
    ? Math.round((coursesWithBatches / data.summary.total_courses) * 100)
    : 0;

  const batchesPerCourse = data.courses.map((c) => ({ name: c.code, value: c.batch_count }));

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader title="Educator dashboard" subtitle="Your courses, batches and schedule" />

      <StatGrid custom={0} className="mb-10">
        <StatCard label="My Courses" value={data.summary.total_courses} tone="ocean" icon={BookOpen} />
        <StatCard label="My Batches" value={data.summary.total_batches} tone="success" icon={GraduationCap} />
        <StatCard
          label="Courses with a batch assigned"
          value={`${coverage}%`}
          tone="accent"
          icon={Layers3}
          progress={coverage}
          progressLabel={`${coursesWithBatches} of ${data.summary.total_courses} courses covered`}
        />
      </StatGrid>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 mb-8 items-start">
        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">My Courses</h2>

          <Card padding="p-0" className="overflow-hidden">
            {data.courses.length === 0 ? (
              <EmptyState icon={BookOpen} title="No courses yet" message="No courses assigned yet." />
            ) : (
              data.courses.map((course) => (
                <div key={course.id} className="px-5 py-4 border-b border-ink/[0.06] last:border-0 hover:bg-ink/[0.02] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-ink">{course.name}</p>
                      <p className="text-xs text-ink-faint">{course.code} · {course.institution}</p>
                    </div>
                    <Badge tone="brand">
                      {course.batch_count} batch{course.batch_count !== 1 ? 'es' : ''}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {course.batches.map((b) => (
                      <Badge key={b.id} tone="neutral">{b.name}</Badge>
                    ))}
                  </div>

                  <EducatorCourseActivities courseId={course.id} />
                </div>
              ))
            )}
          </Card>
        </div>

        <BarChartCard title="Batches per course" data={batchesPerCourse} color={SERIES_COLOR.ocean} height={260} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} className="mb-8">
        <h2 className="text-sm font-semibold text-ink mb-3">Workload</h2>
        <WorkloadSummary />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Schedule</h2>
          <Link
            to="/calendar"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Open full calendar <ArrowRight size={12} />
          </Link>
        </div>
        <EventCalendar role="EDUCATOR" />
      </motion.div>
    </div>
  );
}
