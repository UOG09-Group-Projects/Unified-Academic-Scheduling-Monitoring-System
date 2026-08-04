import { useEffect, useState } from 'react';
import { Circle, Clock3, CheckCircle2 } from 'lucide-react';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import activityService from '../../services/activityService';
import progressService from '../../services/progressService';
import { useToast } from '../ui/Toast';

const STATUSES = [
  { key: 'not_started', label: 'Not started', icon: Circle,       active: 'bg-ink/[0.08] text-ink-soft border-ink/10' },
  { key: 'in_progress', label: 'In progress',  icon: Clock3,       active: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30' },
  { key: 'completed',   label: 'Completed',    icon: CheckCircle2, active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30' },
];

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'completed') return false;
  return new Date(`${dueDate}T00:00:00`).getTime() < new Date().setHours(0, 0, 0, 0);
}

export default function CourseActivityProgress({ courseId, studentId, progressRecords, canComplete = false, onChange }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    let ignore = false;
    activityService.listForCourse(courseId)
      .then((data) => { if (!ignore) setActivities(data); })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [courseId]);

  const recordByActivity = new Map(
    (progressRecords || [])
      .filter((p) => p.activity.course_id === courseId)
      .map((p) => [p.activity.id, p])
  );

  const handleSetStatus = async (activityId, status) => {
    setUpdatingId(activityId);
    try {
      await progressService.setStatus(studentId, activityId, status);
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update task.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <SkeletonRows rows={1} className="mt-3" />;
  if (activities.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-ink/[0.06] flex flex-col gap-2">
      {activities.map((a) => {
        const record = recordByActivity.get(a.id);
        const value = record?.value;
        const status = record?.status ?? 'not_started';
        const pct = value != null ? Math.round(value * 100) : null;
        const overdue = isOverdue(a.due_date, status);

        return (
          <div key={a.id} className="rounded-xl border border-ink/[0.06] p-3 hover:bg-ink/[0.02] transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                {a.due_date && (
                  <p className={`text-[11px] mt-0.5 ${overdue ? 'text-danger font-medium' : 'text-ink-faint'}`}>
                    {overdue ? 'Overdue · due ' : 'Due '}
                    {new Date(`${a.due_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              <Badge tone={pct != null ? 'brand' : 'neutral'} className="shrink-0">
                {pct != null ? `${pct}% graded` : 'Not graded yet'}
              </Badge>
            </div>

            {canComplete ? (
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => {
                  const isActive = status === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleSetStatus(a.id, s.key)}
                      disabled={updatingId === a.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors disabled:opacity-50
                        ${isActive ? s.active : 'bg-transparent text-ink-faint border-transparent hover:bg-ink/[0.04]'}`}
                    >
                      <s.icon size={12} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Badge tone={status === 'completed' ? 'success' : status === 'in_progress' ? 'warning' : 'neutral'}>
                {STATUSES.find((s) => s.key === status)?.label}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
