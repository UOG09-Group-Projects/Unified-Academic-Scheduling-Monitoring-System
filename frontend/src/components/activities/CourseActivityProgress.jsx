import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { SkeletonRows } from '../ui/Skeleton';
import activityService from '../../services/activityService';
import progressService from '../../services/progressService';
import { useToast } from '../ui/Toast';

export default function CourseActivityProgress({ courseId, studentId, progressRecords, canComplete = false, onChange }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
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

  const handleToggle = async (activityId, nextCompleted) => {
    setTogglingId(activityId);
    try {
      await progressService.markComplete(studentId, activityId, nextCompleted);
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update task.');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <SkeletonRows rows={1} className="mt-3" />;
  if (activities.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-ink/[0.06] flex flex-col gap-2.5">
      {activities.map((a) => {
        const record = recordByActivity.get(a.id);
        const value = record?.value;
        const completed = record?.completed ?? false;
        const pct = value != null ? Math.round(value * 100) : 0;

        return (
          <div key={a.id}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
                {a.name}
                {completed && <Check size={12} className="text-success shrink-0" />}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-ink-faint">{value != null ? `${pct}%` : 'Not graded yet'}</span>
                {canComplete && (
                  <label className="flex items-center gap-1.5 text-xs text-ink-faint cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="accent-brand-600"
                      checked={completed}
                      disabled={togglingId === a.id}
                      onChange={(e) => handleToggle(a.id, e.target.checked)}
                    />
                    Done
                  </label>
                )}
              </div>
            </div>
            <ProgressBar value={pct} tone={value != null ? 'ocean' : 'brand'} trackClassName="bg-ink/[0.06]" />
          </div>
        );
      })}
    </div>
  );
}
