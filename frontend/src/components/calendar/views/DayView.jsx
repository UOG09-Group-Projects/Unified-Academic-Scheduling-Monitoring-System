import { useMemo } from 'react';
import TimeGrid from './TimeGrid';
import { startOfDay } from '../../../utils/dateRange';

export default function DayView({ anchor, events, conflictIds, onSlotClick, onEventClick }) {
  const days = useMemo(() => [startOfDay(anchor)], [anchor]);

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
