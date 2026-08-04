import { useMemo } from 'react';
import TimeGrid from './TimeGrid';
import { startOfWeek, addDays } from '../../../utils/dateRange';

export default function WeekView({ anchor, events, conflictIds, onSlotClick, onEventClick }) {
  const days = useMemo(() => {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchor]);

  return (
    <TimeGrid
      days={days}
      events={events}
      conflictIds={conflictIds}
      onSlotClick={onSlotClick}
      onEventClick={onEventClick}
    />
  );
}
