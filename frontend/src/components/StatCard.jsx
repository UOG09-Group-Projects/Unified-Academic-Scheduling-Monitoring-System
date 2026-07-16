import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TONES = {
  brand:   { bg: 'bg-brand-50',   icon: 'bg-brand-100 text-brand-700',     val: 'text-brand-800',   bar: 'bg-brand-500'   },
  accent:  { bg: 'bg-accent-50',  icon: 'bg-accent-100 text-accent-700',   val: 'text-accent-800',  bar: 'bg-accent-500'  },
  success: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-700', val: 'text-emerald-800', bar: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-700',     val: 'text-amber-800',   bar: 'bg-amber-500'   },
  danger:  { bg: 'bg-red-50',     icon: 'bg-red-100 text-red-700',         val: 'text-red-800',     bar: 'bg-red-500'     },
  violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-700',   val: 'text-violet-800',  bar: 'bg-violet-500'  },
  ocean:   { bg: 'bg-ocean-50',   icon: 'bg-ocean-100 text-ocean-800',     val: 'text-ocean-900',   bar: 'bg-ocean-600'   },
};

export default function StatCard({
  label,
  value,
  tone = 'brand',
  color,
  icon: Icon,
  progress,       // optional 0-100
  progressLabel,  // optional caption under the bar
  trend,          // optional { value: '+12%', direction: 'up' | 'down' }
}) {
  const t = TONES[tone] ?? TONES[color] ?? TONES.brand;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className={`rounded-2xl border border-ink/[0.05] p-5 flex flex-col gap-3 ${t.bg}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${t.icon}`}>
            <Icon size={19} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-display font-bold leading-none ${t.val}`}>{value ?? '—'}</p>
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                trend.direction === 'down' ? 'text-danger' : 'text-success'
              }`}>
                {trend.direction === 'down' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                {trend.value}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-faint font-medium mt-1.5 truncate">{label}</p>
        </div>
      </div>

      {typeof progress === 'number' && (
        <div>
          <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${t.bar}`}
            />
          </div>
          {progressLabel && (
            <p className="text-[10px] text-ink-faint mt-1">{progressLabel}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
