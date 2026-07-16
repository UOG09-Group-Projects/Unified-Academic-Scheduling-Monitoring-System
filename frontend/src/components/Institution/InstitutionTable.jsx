import { motion } from 'framer-motion';
import { Pencil, Trash2, Building2 } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const row = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.25, delay: Math.min(i, 8) * 0.03 },
  }),
};

const InstitutionTable = ({ institutions, onEdit, onDelete }) => {
  if (!institutions.length) {
    return <EmptyState icon={Building2} title="No institutions found" />;
  }

  const showActions = Boolean(onEdit || onDelete);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-ink/[0.02]">
            {['Institution', 'Owner', 'Email', 'Created'].map((h) => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wide border-b border-ink/[0.06]">
                {h}
              </th>
            ))}
            {showActions && <th className="px-6 py-3 w-24 border-b border-ink/[0.06]" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/[0.05]">
          {institutions.map((inst, i) => (
            <motion.tr
              key={inst.id}
              custom={i}
              variants={row}
              initial="hidden"
              animate="show"
              className="group hover:bg-ink/[0.02] transition-colors"
            >
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  {inst.logo
                    ? <img src={inst.logo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    : (
                      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                        <Building2 size={14} />
                      </div>
                    )}
                  <span className="font-medium text-ink">{inst.name}</span>
                </div>
              </td>
              <td className="px-6 py-3 text-ink-soft">{inst.owner?.username}</td>
              <td className="px-6 py-3 text-ink-faint">{inst.owner?.email}</td>
              <td className="px-6 py-3 text-ink-faint">
                {inst.created_at ? new Date(inst.created_at).toLocaleDateString() : '—'}
              </td>
              {showActions && (
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(inst)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-brand-700 hover:bg-brand-50 transition-colors"
                        aria-label="Edit institution"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(inst)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors"
                        aria-label="Delete institution"
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
    </div>
  );
};

export default InstitutionTable;
