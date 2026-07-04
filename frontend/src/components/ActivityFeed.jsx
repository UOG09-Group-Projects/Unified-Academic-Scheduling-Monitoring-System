const ACTION_COLORS = {
  CREATE: 'bg-green-100  text-green-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100    text-red-700',
};

const MODULE_ICONS = {
  INSTITUTION: '🏫',
  COURSE:      '📚',
  EDUCATOR:    '👨‍🏫',
  BATCH:       '🎓',
  STUDENT:     '👤',
};

export default function ActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {activities.map(log => (
        <li key={log.id} className="py-3 flex items-start gap-3">
          <span className="text-xl mt-0.5">
            {MODULE_ICONS[log.module] || '📋'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">{log.description}</p>
            <p className="text-xs text-gray-400 mt-0.5">{log.timestamp}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0
            ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
            {log.action}
          </span>
        </li>
      ))}
    </ul>
  );
}