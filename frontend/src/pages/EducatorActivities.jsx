// src/pages/EducatorActivities.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import EducatorCourseActivities from '../components/activities/EducatorCourseActivities';
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

export default function EducatorActivities() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    dashboardService.getEducatorDashboard()
      .then((result) => { if (!ignore) setData(result); })
      .catch(() => { if (!ignore) setError('Failed to load your courses.'); })
      .finally(() => { if (!ignore) setLoading(false); });
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

  const { courses = [] } = data;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader title="Activities" subtitle="Create and manage activities for every course you teach" />

      {courses.length === 0 ? (
        <Card>
          <EmptyState icon={BookOpen} title="No courses yet" message="You'll be able to add activities once you're assigned a course." />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course, i) => (
            <motion.div key={course.id} variants={fadeUp} initial="hidden" animate="show" custom={i}>
              <Card>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-base font-display font-semibold text-ink">{course.name}</p>
                    <p className="text-xs text-ink-faint mt-0.5">{course.code} · {course.institution}</p>
                  </div>
                  <Badge tone="brand">
                    {course.batch_count} batch{course.batch_count !== 1 ? 'es' : ''}
                  </Badge>
                </div>

                {course.batches?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {course.batches.map((b) => (
                      <Badge key={b.id} tone="neutral">{b.name}</Badge>
                    ))}
                  </div>
                )}

                <EducatorCourseActivities courseId={course.id} defaultOpen />
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
