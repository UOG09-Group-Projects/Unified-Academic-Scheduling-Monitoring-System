// src/pages/StudentWorkload.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarClock, Clock3, AlertTriangle, RotateCcw } from 'lucide-react';
import calendarService from '../services/calendarService';
import activityService from '../services/activityService';
import { activitiesToPseudoEvents } from '../utils/activityEvents';
import { startOfWeek, endOfWeek, monthsTouched, computeWeekStats, WORKLOAD_SERIES } from '../utils/workload';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import BarChartCard from '../components/charts/BarChartCard';
import { SkeletonRows } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

function formatRange(weekStart, weekEnd) {
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startStr = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endStr = weekEnd.toLocaleDateString(undefined, sameMonth
    ? { day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

export default function StudentWorkload() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [direction, setDirection] = useState(0);
  const [events, setEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekEnd = useMemo(() => endOfWeek(weekStart), [weekStart]);

  const loadEvents = useCallback(() => {
    setLoading(true);
    setError(null);
    const months = monthsTouched([weekStart, weekEnd]);

    Promise.all([
      Promise.all(months.map(([y, mo]) => calendarService.listEvents(y, mo).catch(() => []))),
      activityService.listMine().catch(() => []),
    ])
      .then(([eventResults, activityResults]) => {
        setEvents(eventResults.flat());
        setActivities(activityResults);
      })
      .catch(() => setError('Failed to load workload.'))
      .finally(() => setLoading(false));
  }, [weekStart, weekEnd]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const mergedEvents = useMemo(
    () => [...events, ...activitiesToPseudoEvents(activities)],
    [events, activities]
  );

  const stats = useMemo(() => computeWeekStats(mergedEvents, weekStart), [mergedEvents, weekStart]);

  const goto = (delta) => {
    setDirection(delta);
    setWeekOffset((w) => w + delta);
  };

  const weekLabel = weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : (
    weekOffset > 0 ? `${weekOffset} weeks ahead` : `${Math.abs(weekOffset)} weeks ago`
  );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader title="Workload" subtitle="See your scheduled events, activities, and hours, week by week" />

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-8">
        <Card className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => goto(-1)}
              aria-label="Previous week"
              className="w-8 h-8 rounded-lg border border-ink/10 flex items-center justify-center text-ink-soft hover:bg-ink/[0.04] transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="min-w-[220px] text-center">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={weekOffset}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 16 }}
                  transition={{ duration: 0.18 }}
                >
                  <p className="text-sm font-semibold text-ink font-display">{weekLabel}</p>
                  <p className="text-xs text-ink-faint">{formatRange(weekStart, weekEnd)}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={() => goto(1)}
              aria-label="Next week"
              className="w-8 h-8 rounded-lg border border-ink/10 flex items-center justify-center text-ink-soft hover:bg-ink/[0.04] transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {weekOffset !== 0 && (
            <button
              onClick={() => { setDirection(weekOffset > 0 ? -1 : 1); setWeekOffset(0); }}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              <RotateCcw size={12} />
              Back to this week
            </button>
          )}
        </Card>
      </motion.div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEvents} />
      ) : (
        <>
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8"
          >
            <StatCard label="Events & activities" value={stats.totalCount} tone="ocean" icon={CalendarClock} />
            <StatCard label="Scheduled hours" value={`${stats.totalHours}h`} tone="violet" icon={Clock3} />
            <StatCard
              label="Conflicts"
              value={stats.conflicts.length}
              tone={stats.conflicts.length > 0 ? 'danger' : 'success'}
              icon={AlertTriangle}
            />
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            <BarChartCard
              title="Workload per day"
              data={stats.perDay.map((d) => ({ name: d.name, events: d.events, activities: d.activities }))}
              series={WORKLOAD_SERIES}
              height={220}
            />
            <BarChartCard
              title="Hours per day"
              icon={Clock3}
              data={stats.perDay.map((d) => ({ name: d.name, value: d.hours }))}
              color="#A78BFA"
              height={220}
            />
          </motion.div>

          {stats.conflicts.length > 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
              <Card className="border-danger/20 bg-red-50/40 dark:bg-red-500/10">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-danger" />
                  Scheduling conflicts
                </h3>
                <div className="flex flex-col gap-2">
                  {stats.conflicts.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge tone="danger">
                        {new Date(c.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Badge>
                      <span className="text-ink-soft">{c.message}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
