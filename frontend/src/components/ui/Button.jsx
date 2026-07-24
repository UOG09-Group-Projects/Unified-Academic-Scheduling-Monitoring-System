import { motion } from 'framer-motion';

const VARIANTS = {
  primary:
    'bg-ink text-paper hover:bg-ink/90 shadow-soft',
  accent:
    'bg-accent-500 text-white hover:bg-accent-600 shadow-soft',
  brand:
    'bg-brand-600 text-white hover:bg-brand-700 shadow-soft',
  ocean:
    'bg-ocean-gradient text-white hover:brightness-[1.08] shadow-soft',
  outline:
    'border border-ink/15 text-ink hover:border-ink/30 hover:bg-ink/[0.03] bg-transparent',
  ghost:
    'text-ink-soft hover:bg-ink/[0.05] bg-transparent',
  danger:
    'bg-danger text-white hover:bg-danger/90 shadow-soft',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-xs gap-1.5 rounded-xl',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-2xl',
  lg: 'px-6 py-3.5 text-[0.95rem] gap-2 rounded-2xl',
};

export default function Button({
  as = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled = false,
  icon: Icon,
  ...props
}) {
  const Comp = typeof as === 'string' ? (motion[as] ?? motion.button) : motion(as);

  return (
    <Comp
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={as === 'button' ? disabled : undefined}
      className={`inline-flex items-center justify-center font-semibold
        transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        disabled:pointer-events-none select-none
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'lg' ? 18 : 15} className="shrink-0" />}
      {children}
    </Comp>
  );
}
