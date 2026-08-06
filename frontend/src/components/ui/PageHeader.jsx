import { motion } from 'framer-motion';

// Mirrors StatCard's tone palette so a header icon badge reads as part of
// the same visual system as the stat tiles beneath it, not a one-off.
const TONES = {
  brand:   'bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow',
  accent:  'bg-gradient-to-br from-accent-400 to-accent-600 shadow-glow',
  success: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-glow',
  warning: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow',
  danger:  'bg-gradient-to-br from-red-400 to-red-600 shadow-glow',
  violet:  'bg-gradient-to-br from-violet-400 to-violet-600 shadow-glow',
  ocean:   'bg-ocean-gradient shadow-ocean-glow',
};

// `icon`/`tone` are opt-in: pages that don't pass an icon render exactly as
// before (plain title/subtitle), so this stays safe to use everywhere.
export default function PageHeader({ title, subtitle, actions, icon: Icon, tone = 'brand' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-start justify-between gap-4 mb-10"
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${TONES[tone] ?? TONES.brand}`}>
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className={`font-display font-semibold text-ink mb-1.5 tracking-tight ${Icon ? 'text-2xl md:text-3xl' : 'text-2xl'}`}>{title}</h1>
          {subtitle && <p className="text-sm text-ink-faint">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </motion.div>
  );
}
