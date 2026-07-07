import {
  Building2,
  BookOpen,
  GraduationCap,
  Layers,
  User,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

const ACTION_STYLES = {
  CREATE: {
    icon: Plus,
    style: "bg-green-100 text-green-700",
  },
  UPDATE: {
    icon: Pencil,
    style: "bg-yellow-100 text-yellow-700",
  },
  DELETE: {
    icon: Trash2,
    style: "bg-red-100 text-red-700",
  },
};

const MODULE_ICONS = {
  INSTITUTION: Building2,
  COURSE: BookOpen,
  EDUCATOR: GraduationCap,
  BATCH: Layers,
  STUDENT: User,
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
      {activities.map(log => {
        const ModuleIcon = MODULE_ICONS[log.module] || ClipboardList;
        const ActionIcon = ACTION_STYLES[log.action]?.icon || ClipboardList;
        const actionStyle =
          ACTION_STYLES[log.action]?.style || "bg-gray-100 text-gray-600";

        return (
          <li key={log.id} className="py-3 flex items-start gap-3">

            {/* Module Icon */}
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <ModuleIcon className="w-4 h-4 text-gray-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">
                {log.description}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {log.timestamp}
              </p>
            </div>

            {/* Action Badge */}
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${actionStyle}`}>
              <ActionIcon className="w-3.5 h-3.5" />
              {log.action}
            </span>

          </li>
        );
      })}
    </ul>
  );
}