// src/pages/StudentDashboard.jsx
import { useReducer, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
import BarChartCard from '../components/charts/BarChartCard';
import { SkeletonRows } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import dashboardService from '../services/dashboardService';
import progressService from '../services/progressService';
import studentService from '../services/studentService';

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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function StudentDashboard() {
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
      <div className="p-6 max-w-5xl mx-auto">
        <SkeletonRows rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
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
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Student dashboard" subtitle="Your learning progress and course activity" />

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-8">
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

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={1}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
      >
        <StudentStatCards summary={summary} progressRecords={progressRecords} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 mb-6 items-start">
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

        <BarChartCard title="Educators per course" data={educatorsPerCourse} color="#00A0F5" height={260} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mb-6">
        <EnrollmentList enrollments={enrollments ?? []} onChange={loadDashboard} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mb-6">
        <GuardianList guardians={guardians} onChange={loadGuardians} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5} className="mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3">Workload</h2>
        <WorkloadSummary />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Schedule</h2>
        </div>
        <EventCalendar role="STUDENT" />
      </motion.div>
    </div>
  );
}
