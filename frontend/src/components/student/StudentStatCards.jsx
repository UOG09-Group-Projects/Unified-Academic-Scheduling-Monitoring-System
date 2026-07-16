import { BookOpen, Users } from 'lucide-react';
import StatCard from '../StatCard';

export default function StudentStatCards({ summary }) {
  return (
    <>
      <StatCard label="My Courses" value={summary.total_courses} tone="brand" icon={BookOpen} />
      <StatCard label="My Educators" value={summary.total_educators} tone="violet" icon={Users} />
    </>
  );
}
