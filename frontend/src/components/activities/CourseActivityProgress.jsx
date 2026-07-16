import { useEffect, useState } from 'react';
import ProgressBar from '../ui/ProgressBar';
import { SkeletonRows } from '../ui/Skeleton';
import activityService from '../../services/activityService';

export default function CourseActivityProgress({ courseId, progressRecords }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    activityService.listForCourse(courseId)
      .then((data) => { if (!ignore) setActivities(data); })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [courseId]);

  const progressByActivity = new Map(
    (progressRecords || [])
      .filter((p) => p.activity.course_id === courseId)
      .map((p) => [p.activity.id, p.value])
  );

  if (loading) return <SkeletonRows rows={1} className="mt-3" />;
  if (activities.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-ink/[0.06] flex flex-col gap-2.5">
      {activities.map((a) => {
        const value = progressByActivity.get(a.id);
        const pct = value != null ? Math.round(value * 100) : 0;
        return (
          <div key={a.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-ink-soft">{a.name}</span>
              <span className="text-xs text-ink-faint">{value != null ? `${pct}%` : 'Not graded yet'}</span>
            </div>
            <ProgressBar value={pct} tone={value != null ? 'ocean' : 'brand'} trackClassName="bg-ink/[0.06]" />
          </div>
        );
      })}
    </div>
  );
}
