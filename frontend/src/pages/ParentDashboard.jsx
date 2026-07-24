import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, BookOpen, ClipboardList, Building2, FileText } from 'lucide-react';

import StatCard from "../components/StatCard";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import PageHeader from "../components/ui/PageHeader";
import Tabs from "../components/ui/Tabs";
import { SkeletonRows } from "../components/ui/Skeleton";
import BarChartCard from "../components/charts/BarChartCard";
import CourseActivityProgress from "../components/activities/CourseActivityProgress";
import MonthlyReportModal from "../components/parent/MonthlyReportModal";
import dashboardService from "../services/dashboardService";
import progressService from "../services/progressService";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function ParentDashboard() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeChild, setActiveChild] = useState(0);
  const [progressRecords, setProgressRecords] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);

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

  const childId = data?.children?.[activeChild]?.id;
  useEffect(() => {
    if (!childId) { setProgressRecords([]); return; }
    progressService.listForStudent(childId)
      .then(setProgressRecords)
      .catch(() => setProgressRecords([]));
  }, [childId]);

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

  const { guardian, children = [], total_children } = data ?? {};
  const child = children[activeChild] ?? null;

  const coursesPerChild = children.map((c) => ({ name: c.name, value: c.total_courses ?? 0 }));

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <PageHeader title="Parent dashboard" subtitle={`Welcome, ${guardian?.name ?? ''}`} />

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
      >
        <StatCard label="Children" value={total_children} tone="brand" icon={Users} />
      </motion.div>

      {!child ? (
        <Card>
          <EmptyState icon={User} title="No children linked" message="No children are linked to your account yet." />
        </Card>
      ) : (
        <div className="space-y-8">
          {children.length > 1 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
              <Tabs
                layoutId="parent-child-tabs"
                value={activeChild}
                onChange={setActiveChild}
                items={children.map((c, i) => ({ value: i, label: c.name, icon: User }))}
              />
            </motion.div>
          )}

          {children.length > 1 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1.5}>
              <BarChartCard title="Courses per child" icon={BookOpen} data={coursesPerChild} color="#00A0F5" />
            </motion.div>
          )}

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
            <Card className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-display font-semibold text-ink flex items-center gap-2">
                  <User className="w-5 h-5 text-ink-faint" />
                  {child.name}
                </h2>
                <p className="text-sm text-ink-faint mt-1">
                  {child.registration_no} · Batch: {child.batch || 'Not assigned'}
                </p>
                {child.institution && (
                  <p className="text-sm text-ink-faint flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" /> {child.institution}
                  </p>
                )}
                <p className="text-sm text-ink-faint">{child.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone="success">
                  <BookOpen className="w-3.5 h-3.5" />
                  {child.total_courses} course{child.total_courses !== 1 ? 's' : ''}
                </Badge>
                <Button variant="outline" size="sm" icon={FileText} onClick={() => setReportOpen(true)}>
                  Monthly report
                </Button>
              </div>
            </Card>
          </motion.div>

          <MonthlyReportModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            student={child}
          />

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
            <Card padding="p-0" className="overflow-hidden">
              <div className="px-5 py-4 border-b border-ink/[0.06] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-ink-faint" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
                  {child.name}'s courses
                </h2>
              </div>

              {child.courses.length === 0 ? (
                <EmptyState icon={BookOpen} title="No courses" message="No courses found." />
              ) : (
                <div className="divide-y divide-ink/[0.06]">
                  {child.courses.map((course) => (
                    <div key={course.id} className="px-5 py-3 hover:bg-ink/[0.02] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-brand-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink">{course.name}</p>
                            <p className="text-xs text-ink-faint">{course.code}</p>
                          </div>
                        </div>
                      </div>
                      <CourseActivityProgress courseId={course.id} progressRecords={progressRecords} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
            <Card padding="p-0" className="overflow-hidden">
              <div className="px-5 py-4 border-b border-ink/[0.06] flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-ink-faint" />
                  {child.name}'s enrollments
                </h2>
                <Badge tone="accent">{child.total_enrollments ?? 0}</Badge>
              </div>

              {!child.enrollments || child.enrollments.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No enrollments yet" message={`${child.name} hasn't self-enrolled in any courses yet.`} />
              ) : (
                <div className="divide-y divide-ink/[0.06]">
                  {child.enrollments.map((e) => (
                    <div key={e.id} className="px-5 py-3 flex items-center justify-between hover:bg-ink/[0.02] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                          <ClipboardList className="w-4 h-4 text-accent-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{e.course.name}</p>
                          <p className="text-xs text-ink-faint">{e.course.code}</p>
                        </div>
                      </div>
                      <span className="text-xs text-ink-faint shrink-0">
                        {new Date(e.enrolled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
