import { motion } from 'framer-motion';
import { Layers3, Pencil, Trash2 } from 'lucide-react';
import EmptyState from './ui/EmptyState';

const row = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.25, delay: Math.min(i, 8) * 0.03 },
  }),
};

export default function BatchTable({ batches, onEdit, onDelete }) {
  if (!batches.length) {
    return <EmptyState icon={Layers3} title="No batches found" />;
  }

  const showActions = Boolean(onEdit || onDelete);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
          <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Batch name</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Institution</th>
          {showActions && <th className="px-6 py-3 w-24" />}
        </tr>
      </thead>
      <tbody className="divide-y divide-ink/[0.05]">
        {batches.map((batch, i) => (
          <motion.tr
            key={batch.id}
            custom={i}
            variants={row}
            initial="hidden"
            animate="show"
            className="group hover:bg-ink/[0.02] transition-colors"
          >
            <td className="px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                  <Layers3 size={14} />
                </div>
                <span className="text-ink-soft font-medium">{batch.name}</span>
              </div>
            </td>
            <td className="px-6 py-3 text-ink-faint">{batch.institution_name ?? batch.institution}</td>
            {showActions && (
              <td className="px-6 py-3">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(batch)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-brand-700 hover:bg-brand-50 transition-colors"
                      aria-label="Edit batch"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(batch)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors"
                      aria-label="Delete batch"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            )}
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}
