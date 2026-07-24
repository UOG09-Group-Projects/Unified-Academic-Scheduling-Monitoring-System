import { motion } from 'framer-motion';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-start justify-between gap-4 mb-10"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-1.5">{title}</h1>
        {subtitle && <p className="text-sm text-ink-faint">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </motion.div>
  );
}
