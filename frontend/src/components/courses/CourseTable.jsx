import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2, BookOpen } from 'lucide-react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

const row = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.25, delay: Math.min(i, 8) * 0.03 },
  }),
};

export default function CourseTable({ courses, onEdit, onView, onDelete }) {
  if (!courses.length) {
    return <EmptyState icon={BookOpen} title="No courses found" />;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-ink/[0.02] text-ink-faint text-xs uppercase">
        <tr>
          <th className="px-6 py-3">Course</th>
          <th className="px-6 py-3">Code</th>
          <th className="px-6 py-3">Institution</th>
          <th className="px-6 py-3">Batches</th>
          <th className="px-6 py-3">Educators</th>
          <th className="px-6 py-3 w-28" />
        </tr>
      </thead>
      <tbody className="divide-y divide-ink/[0.05]">
        {courses.map((course, i) => (
          <motion.tr
            key={course.id}
            custom={i}
            variants={row}
            initial="hidden"
            animate="show"
            className="group hover:bg-ink/[0.02] transition-colors"
          >
            <td className="px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                  <BookOpen size={14} />
                </div>
                <span className="font-medium text-ink">{course.name}</span>
              </div>
            </td>
            <td className="px-6 py-3 text-ink-soft">{course.code}</td>
            <td className="px-6 py-3 text-ink-soft">{course.institution_name}</td>
            <td className="px-6 py-3"><Badge tone="brand">{course.batch_count}</Badge></td>
            <td className="px-6 py-3"><Badge tone="success">{course.educator_count}</Badge></td>
            <td className="px-6 py-3">
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onView(course)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-violet-700 hover:bg-violet-50 transition-colors"
                  aria-label="View course"
                >
                  <Eye size={14} />
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(course)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-brand-700 hover:bg-brand-50 transition-colors"
                    aria-label="Edit course"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(course)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors"
                    aria-label="Delete course"
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
