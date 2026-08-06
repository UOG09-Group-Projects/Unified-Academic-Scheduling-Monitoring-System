// src/pages/StudentDashboard.jsx
import { useReducer, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap } from 'lucide-react';

import StudentProfileCard from '../components/student/StudentProfileCard';
import StudentStatCards from '../components/student/StudentStatCards';
import StudentCourseList from '../components/student/StudentCourseList';
import EnrollmentList from '../components/student/EnrollmentList';
import GuardianList from '../components/student/GuardianList';
import EventCalendar from '../components/calendar/EventCalendar';
import WorkloadSummary from '../components/calendar/WorkloadSummary';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import Card from '../components/ui/Card';
import StatGrid from '../components/ui/StatGrid';
import BarChartCard from '../components/charts/BarChartCard';
import { useSeriesColor } from '../components/charts/useSeriesColor';
import { SkeletonRows } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import dashboardService from '../services/dashboardService';
import progressService from '../services/progressService';
import studentService from '../services/studentService';
import { fadeUp } from '../utils/motionVariants';

const initial = { data: null, loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { data: null, loading: true, error: null };
    case 'SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'ERROR':
      return { data: null, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function StudentDashboard() {
  const { color: SERIES_COLOR } = useSeriesColor();
  const [state, dispatch] = useReducer(reducer, initial);
  const { data, loading, error } = state;
  const [progressRecords, setProgressRecords] = useState([]);
  const [guardians, setGuardians] = useState([]);

  const loadDashboard = () => {
    dashboardService
      .getStudentDashboard()
      .then((result) => dispatch({ type: 'SUCCESS', payload: result }))
      .catch((err) => dispatch({ type: 'ERROR', payload: err?.message || 'Failed to load dashboard.' }));
  };

  const loadGuardians = () => {
    studentService.listMyGuardians()
      .then(setGuardians)
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
    loadGuardians();
  }, []);

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

  const { student, summary, courses, enrollments } = data;

  const profileFields = [student?.name, student?.email, student?.registration_no, student?.batch];
  const profileCompleteness = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  const educatorsPerCourse = (courses ?? []).map((c) => ({
    name: c.code,
    value: c.educators?.length ?? 0,
  }));

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Student dashboard"
        subtitle="Your learning progress and course activity"
        icon={GraduationCap}
        tone="brand"
      />

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-10">
        <Card className="flex flex-col gap-4">
          <StudentProfileCard student={student} />
          <ProgressBar
            value={profileCompleteness}
            label="Profile completeness"
            tone="ocean"
            trackClassName="bg-ocean-50"
          />
        </Card>
      </motion.div>

      <StatGrid count={4} custom={1} className="mb-10">
        <StudentStatCards summary={summary} progressRecords={progressRecords} />
      </StatGrid>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 mb-8 items-start">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">Courses</h2>
            <span className="text-xs text-ink-faint">{courses?.length ?? 0} total</span>
          </div>
          <StudentCourseList
            courses={courses}
            progressRecords={progressRecords}
            studentId={student?.id}
            onProgressChange={loadProgress}
          />
        </div>

        <BarChartCard title="Educators per course" data={educatorsPerCourse} color={SERIES_COLOR.ocean} height={260} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mb-8">
        <EnrollmentList enrollments={enrollments ?? []} onChange={loadDashboard} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mb-8">
        <GuardianList guardians={guardians} onChange={loadGuardians} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Workload</h2>
          <Link
            to="/workload"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all weeks <ArrowRight size={12} />
          </Link>
        </div>
        <WorkloadSummary />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Schedule</h2>
          <Link
            to="/calendar"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Open full calendar <ArrowRight size={12} />
          </Link>
        </div>
        <EventCalendar role="STUDENT" />
      </motion.div>
    </div>
  );
}
