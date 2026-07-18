import { motion } from 'framer-motion';

export default function Tabs({ items, value, onChange, layoutId = 'tabs-active' }) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-ink/[0.04]">
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${active ? 'text-white' : 'text-ink-soft hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-brand-600 rounded-lg -z-10"
              />
            )}
            {Icon && <Icon size={14} className="shrink-0" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
