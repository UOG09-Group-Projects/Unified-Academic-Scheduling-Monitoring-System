import { BookOpen, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import StatCard from '../StatCard';

export default function StudentStatCards({ summary, progressRecords = [] }) {
  const graded = progressRecords.filter((p) => p.value != null);
  const overallProgress = graded.length > 0
    ? Math.round((graded.reduce((sum, p) => sum + p.value, 0) / graded.length) * 100)
    : null;

  const totalTasks = summary.total_tasks ?? 0;
  const completedTasks = summary.completed_tasks ?? 0;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <>
      <StatCard label="My Courses" value={summary.total_courses} tone="brand" icon={BookOpen} />
      <StatCard label="My Educators" value={summary.total_educators} tone="violet" icon={Users} />
      <StatCard
        label="My Progress"
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
    </>
  );
}
