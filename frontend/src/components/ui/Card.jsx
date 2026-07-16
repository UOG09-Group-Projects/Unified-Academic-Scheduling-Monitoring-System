import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hover = false,
  as = 'div',
  padding = 'p-5',
  ...props
}) {
  const Comp = motion[as] ?? motion.div;

  return (
    <Comp
      whileHover={hover ? { y: -4, boxShadow: '0 16px 32px -16px rgba(18,20,28,0.22)' } : {}}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`bg-white border border-ink/[0.06] rounded-2xl shadow-soft ${padding} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
