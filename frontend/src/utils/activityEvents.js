// Turns a course Activity (assignment with a due_date, from the Activities
// pages) into a read-only, all-day pseudo-event so it can render inside the
// same Month/Week/Day calendar as real calendar Events, without the two
// separate backend models needing to know about each other.
export function activityToPseudoEvent(activity) {
  if (!activity.due_date) return null;

  const start = new Date(`${activity.due_date}T${activity.due_time || '00:00'}:00`);
  if (Number.isNaN(start.getTime())) return null;

  return {
    id: `activity-${activity.id}`,
    title: activity.name,
    description: activity.description,
    event_type: 'assignment',
    start: start.toISOString(),
    end: null,
    all_day: !activity.due_time,
    course: { id: activity.course_id, name: activity.course_name },
    created_by: null,
    can_edit: false,
    is_activity: true,
    activity_id: activity.id,
  };
}

export function activitiesToPseudoEvents(activities) {
  return activities.map(activityToPseudoEvent).filter(Boolean);
}
