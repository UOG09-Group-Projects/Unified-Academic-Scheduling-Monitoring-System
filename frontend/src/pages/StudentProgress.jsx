// src/pages/StudentProgress.jsx
import { useReducer, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, BookOpen } from 'lucide-react';
import StatCard from '../components/StatCard';
import CourseActivityProgress from '../components/activities/CourseActivityProgress';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import dashboardService from '../services/dashboardService';
import progressService from '../services/progressService';

const initial = { data: null, loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'ERROR':
      return { data: null, loading: false, error: action.payload };
    default:
      return state;
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function StudentProgress() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { data, loading, error } = state;
  const [progressRecords, setProgressRecords] = useState([]);

  const loadDashboard = () => {
    dashboardService
      .getStudentDashboard()
      .then((result) => dispatch({ type: 'SUCCESS', payload: result }))
      .catch((err) => dispatch({ type: 'ERROR', payload: err?.message || 'Failed to load progress.' }));
  };

  useEffect(() => { loadDashboard(); }, []);

  const loadProgress = () => {
    if (!data?.student?.id) return;
    progressService.listForStudent(data.student.id)
      .then(setProgressRecords)
      .catch(() => {});
  };

  useEffect(loadProgress, [data?.student?.id]);

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
        <ErrorState message={error} onRetry={loadDashboard} />
      </div>
    );
  }

  const { student, summary, courses } = data;

  const graded = progressRecords.filter((p) => p.value != null);
  const overallProgress = graded.length > 0
    ? Math.round((graded.reduce((sum, p) => sum + p.value, 0) / graded.length) * 100)
    : null;

  const totalTasks = summary.total_tasks ?? 0;
  const completedTasks = summary.completed_tasks ?? 0;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader title="Progress" subtitle="Track and mark your progress across every course" />

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10"
      >
        <StatCard
          label="Overall progress"
          value={overallProgress != null ? `${overallProgress}%` : '—'}
          tone="success"
          icon={TrendingUp}
          progress={overallProgress ?? 0}
          progressLabel={
            graded.length > 0
              ? `Averaged across ${graded.length} graded activit${graded.length !== 1 ? 'ies' : 'y'}`
              : 'No graded activities yet'
          }
        />
        <StatCard
          label="Tasks completed"
          value={totalTasks > 0 ? `${completedTasks} / ${totalTasks}` : '—'}
          tone="ocean"
          icon={CheckCircle2}
          progress={completionPct}
          progressLabel={totalTasks > 0 ? `${completionPct}% marked done` : 'No tasks yet'}
        />
      </motion.div>

      {(!courses || courses.length === 0) ? (
        <Card>
          <EmptyState icon={BookOpen} title="No courses yet" message="Activities will show up here once you're enrolled in a course." />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course, i) => (
            <motion.div key={course.id} variants={fadeUp} initial="hidden" animate="show" custom={i + 1}>
              <Card>
                <p className="text-base font-display font-semibold text-ink">{course.name}</p>
                <p className="text-xs text-ink-faint mt-0.5">{course.code} · {course.institution}</p>
                <CourseActivityProgress
                  courseId={course.id}
                  studentId={student?.id}
                  progressRecords={progressRecords}
                  canComplete
                  onChange={loadProgress}
                />
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
