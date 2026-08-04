import { motion } from 'framer-motion';
import { fadeUp } from '../../utils/motionVariants';

// Picks a column count from how many stat cards are actually there, instead
// of every dashboard hand-picking its own breakpoints — which is how a
// dashboard with exactly 1 card ends up in a `sm:grid-cols-3` grid with two
// empty slots, or 7 cards end up in a 4-col grid with an awkward last row.
function pickCols(count) {
  // 6 divides evenly into 3 columns (two clean rows) but not into 4 (a
  // lopsided 4+2) — worth special-casing since it's a common count here.
  if (count === 6) return 'grid-cols-2 sm:grid-cols-3';
  if (count >= 4) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
  return 'grid-cols-1';
}

/**
 * Animated, responsive grid for a row of StatCards. `children` is normally
 * an array of StatCard elements (falsy entries are filtered before counting
 * columns); pass an explicit `count` when children is a single component
 * that internally renders multiple cards (e.g. <StudentStatCards />).
 */
export default function StatGrid({ children, count, custom = 0, className = '' }) {
  const resolvedCount = count ?? (Array.isArray(children) ? children.filter(Boolean).length : 1);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={custom}
      className={`grid ${pickCols(resolvedCount)} gap-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}
