import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Clock3, AlertTriangle } from 'lucide-react';
import calendarService from '../../services/calendarService';
import activityService from '../../services/activityService';
import { activitiesToPseudoEvents } from '../../utils/activityEvents';
import { dateKey, startOfWeek, endOfWeek, monthsTouched, computeWeekStats, WORKLOAD_SERIES } from '../../utils/workload';
import StatCard from '../StatCard';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import BarChartCard from '../charts/BarChartCard';
import { SkeletonRows } from '../ui/Skeleton';

export default function WorkloadSummary() {
  const [events, setEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(weekStart);

    // The week can straddle a month boundary — fetch every month it touches.
    const months = monthsTouched([now, weekStart, weekEnd]);

    Promise.all([
      Promise.all(months.map(([y, mo]) => calendarService.listEvents(y, mo).catch(() => []))),
      activityService.listMine().catch(() => []),
    ])
      .then(([eventResults, activityResults]) => {
        if (ignore) return;
        setEvents(eventResults.flat());
        setActivities(activityResults);
      })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, []);

  const mergedEvents = useMemo(
    () => [...events, ...activitiesToPseudoEvents(activities)],
    [events, activities]
  );

  const { todayCount, weekCount, weekHours, chartData, conflicts } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const stats = computeWeekStats(mergedEvents, weekStart);

    return {
      todayCount: mergedEvents.filter((e) => dateKey(e.start) === dateKey(now)).length,
      weekCount: stats.totalCount,
      weekHours: stats.totalHours,
      chartData: stats.perDay.map((d) => ({ name: d.name, events: d.events, activities: d.activities })),
      conflicts: stats.conflicts,
    };
  }, [mergedEvents]);

  if (loading) {
    return <SkeletonRows rows={3} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Today" value={todayCount} tone="ocean" icon={CalendarClock} />
        <StatCard label="This week" value={weekCount} tone="violet" icon={CalendarClock} />
        <StatCard label="Hours" value={`${weekHours}h`} tone="accent" icon={Clock3} />
      </div>

      <BarChartCard title="Workload this week" data={chartData} series={WORKLOAD_SERIES} height={180} />

      {conflicts.length > 0 && (
        <Card className="border-danger/20 bg-red-50/40 dark:bg-red-500/10">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-danger" />
            Scheduling conflicts
          </h3>
          <div className="flex flex-col gap-2">
            {conflicts.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge tone="danger">
                  {new Date(c.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Badge>
                <span className="text-ink-soft">{c.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
