import { EyeOff, Building2, BookOpen, Users, GraduationCap, CalendarDays, ClipboardList } from 'lucide-react';
import StatCard from './StatCard';
import Card from './ui/Card';

// Impersonation is always dummy-data-only — this is what every route renders
// in place of its real page (see DashboardLayout.jsx) whenever a SUPER_ADMIN
// is impersonating someone. Values are fixed, fabricated placeholders, never
// derived from any real record, so nothing about the target ever renders.
const PREVIEW_BY_ROLE = {
  OWNER: {
    stats: [
      { label: 'Institutions', value: '3', tone: 'brand', icon: Building2 },
      { label: 'Managers', value: '7', tone: 'accent', icon: Users },
      { label: 'Students', value: '482', tone: 'success', icon: GraduationCap },
      { label: 'Courses', value: '19', tone: 'ocean', icon: BookOpen },
    ],
    rows: ['Sample Institution A', 'Sample Institution B', 'Sample Institution C'],
  },
  MANAGER: {
    stats: [
      { label: 'Educators', value: '12', tone: 'brand', icon: Users },
      { label: 'Students', value: '156', tone: 'success', icon: GraduationCap },
      { label: 'Batches', value: '8', tone: 'accent', icon: ClipboardList },
      { label: 'Courses', value: '5', tone: 'ocean', icon: BookOpen },
    ],
    rows: ['Sample Batch A', 'Sample Batch B', 'Sample Batch C'],
  },
  EDUCATOR: {
    stats: [
      { label: 'My Courses', value: '4', tone: 'brand', icon: BookOpen },
      { label: 'Students', value: '63', tone: 'success', icon: GraduationCap },
      { label: 'Activities', value: '11', tone: 'accent', icon: ClipboardList },
      { label: 'This Week', value: '6', tone: 'ocean', icon: CalendarDays },
    ],
    rows: ['Sample Activity A', 'Sample Activity B', 'Sample Activity C'],
  },
  STUDENT: {
    stats: [
      { label: 'Enrolled Courses', value: '5', tone: 'brand', icon: BookOpen },
      { label: 'Progress', value: '68%', tone: 'success', icon: ClipboardList },
      { label: 'Upcoming', value: '3', tone: 'accent', icon: CalendarDays },
      { label: 'Batch', value: 'Sample Batch', tone: 'ocean', icon: Users },
    ],
    rows: ['Sample Course A', 'Sample Course B', 'Sample Course C'],
  },
  PARENT: {
    stats: [
      { label: 'Children', value: '1', tone: 'brand', icon: Users },
      { label: 'Courses', value: '4', tone: 'success', icon: BookOpen },
      { label: 'Progress', value: '72%', tone: 'accent', icon: ClipboardList },
      { label: 'Upcoming', value: '2', tone: 'ocean', icon: CalendarDays },
    ],
    rows: ['Sample Course A', 'Sample Course B', 'Sample Course C'],
  },
};

export default function ImpersonationPreview({ role }) {
  const preview = PREVIEW_BY_ROLE[role?.toUpperCase?.()] ?? PREVIEW_BY_ROLE.STUDENT;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <EyeOff size={15} />
        <span>Impersonation preview — every value below is placeholder data, not this account's real data.</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {preview.stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <Card>
        <h2 className="font-display text-base font-semibold text-ink mb-4">Overview</h2>
        <ul className="divide-y divide-ink/[0.06]">
          {preview.rows.map((row) => (
            <li key={row} className="py-3 flex items-center justify-between text-sm">
              <span className="text-ink-soft">{row}</span>
              <span className="text-ink-faint">—</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
