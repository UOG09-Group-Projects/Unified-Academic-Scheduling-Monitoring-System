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
import EmptyState from "./ui/EmptyState";
import Badge from "./ui/Badge";

const ACTION_STYLES = {
  CREATE: { icon: Plus,   tone: "success" },
  UPDATE: { icon: Pencil, tone: "warning" },
  DELETE: { icon: Trash2, tone: "danger" },
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
    return <EmptyState icon={ClipboardList} title="No activity yet" message="Nothing recorded yet." />;
  }

  return (
    <ul className="divide-y divide-ink/[0.06]">
      {activities.map((log) => {
        const ModuleIcon = MODULE_ICONS[log.module] || ClipboardList;
        const ActionIcon = ACTION_STYLES[log.action]?.icon || ClipboardList;
        const tone = ACTION_STYLES[log.action]?.tone || 'neutral';

        return (
          <li key={log.id} className="py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-ink/[0.04] flex items-center justify-center flex-shrink-0">
              <ModuleIcon className="w-4 h-4 text-ink-soft" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink">{log.description}</p>
              <p className="text-xs text-ink-faint mt-0.5">{log.timestamp}</p>
            </div>

            <Badge tone={tone}>
              <ActionIcon size={12} />
              {log.action}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
