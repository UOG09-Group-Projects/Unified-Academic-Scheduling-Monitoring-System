import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2, GraduationCap } from 'lucide-react';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';

const row = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.25, delay: Math.min(i, 8) * 0.03 },
  }),
};

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export default function StudentTable({ students, onEdit, onView, onDelete }) {
  if (!students.length) {
    return <EmptyState icon={GraduationCap} title="No students found" />;
  }

  return (
    <table className="min-w-full text-sm text-left text-ink-soft">
      <thead className="bg-ink/[0.02] text-ink-faint text-[11px] uppercase tracking-[0.12em]">
        <tr>
          <th className="px-6 py-3">Name</th>
          <th className="px-6 py-3">Reg No</th>
          <th className="px-6 py-3">Email</th>
          <th className="px-6 py-3">Batch</th>
          <th className="px-6 py-3">Guardians</th>
          <th className="px-6 py-3 w-28" />
        </tr>
      </thead>
      <tbody className="divide-y divide-ink/[0.05]">
        {students.map((student, i) => (
          <motion.tr
            key={student.id}
            custom={i}
            variants={row}
            initial="hidden"
            animate="show"
            className="group hover:bg-ink/[0.02] transition-colors"
          >
            <td className="px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {initials(student.name)}
                </div>
                <span className="font-medium text-ink">{student.name}</span>
              </div>
            </td>
            <td className="px-6 py-3">{student.registration_no}</td>
            <td className="px-6 py-3">{student.email}</td>
            <td className="px-6 py-3">{student.batch_name || '—'}</td>
            <td className="px-6 py-3"><Badge tone="neutral">{student.guardian_count}</Badge></td>
            <td className="px-6 py-3">
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onView(student)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-violet-700 hover:bg-violet-50 transition-colors"
                  aria-label="View student"
                >
                  <Eye size={14} />
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(student)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-brand-700 hover:bg-brand-50 transition-colors"
                    aria-label="Edit student"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(student)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors"
                    aria-label="Delete student"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}
