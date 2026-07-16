const TONES = {
  brand:   'bg-brand-50 text-brand-700',
  accent:  'bg-accent-50 text-accent-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-700',
  neutral: 'bg-ink/[0.05] text-ink-soft',
};

export default function Badge({ tone = 'neutral', dot = false, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
        text-[11px] font-semibold tracking-wide ${TONES[tone] ?? TONES.neutral} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
