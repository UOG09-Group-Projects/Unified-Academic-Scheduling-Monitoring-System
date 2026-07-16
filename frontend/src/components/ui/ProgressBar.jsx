import { motion } from 'framer-motion';

const TONES = {
  brand: 'bg-brand-600',
  accent: 'bg-accent-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  ocean: 'bg-ocean-600',
};

export default function ProgressBar({ value, label, tone = 'ocean', trackClassName = 'bg-ink/[0.06]', className = '' }) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-ink-soft">{label}</span>
          <span className="text-xs font-semibold text-ink">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`h-2 rounded-full overflow-hidden ${trackClassName}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${TONES[tone] ?? TONES.ocean}`}
        />
      </div>
    </div>
  );
}
