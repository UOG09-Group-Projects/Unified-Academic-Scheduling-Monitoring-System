// src/pages/StudentCourses.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import EnrollmentList from '../components/student/EnrollmentList';
import { SkeletonRows } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import dashboardService from '../services/dashboardService';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function StudentCourses() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    dashboardService.getStudentDashboard()
      .then(setData)
      .catch(() => setError('Failed to load your courses.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

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
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  const { courses = [], enrollments = [] } = data;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader title="My Courses" subtitle="Courses from your batch, plus any you've enrolled in yourself" />

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Batch courses</h2>
          <span className="text-xs text-ink-faint">{courses.length} total</span>
        </div>

        {courses.length === 0 ? (
          <Card>
            <EmptyState icon={BookOpen} title="No batch courses" message="No courses are assigned to your batch yet." />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id}>
                <p className="text-base font-display font-semibold text-ink">{course.name}</p>
                <p className="text-xs text-ink-faint mt-0.5">{course.code} · {course.institution}</p>
                {course.educators?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {course.educators.map((edu) => (
                      <Badge key={edu.id} tone="neutral">
                        <Users size={11} />
                        {edu.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
        <EnrollmentList enrollments={enrollments} onChange={load} />
      </motion.div>
    </div>
  );
}
