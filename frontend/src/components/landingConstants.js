// Shared across the landing page's section components (Hero, About,
// Footer) — kept separate from utils/motionVariants.js, which tunes a
// subtler/faster fade-in for the dashboards.

export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

// Reuses the real dashboard calendar's event-type color tokens
// (tailwind.config.js `event-*` colors) — one source of truth for every
// schedule mockup on the landing page (Hero's weekly preview + About's
// calendar preview), instead of each one inventing its own color keys.
export const EVENT_COLOR = {
  class:      'bg-event-class',
  meeting:    'bg-event-meeting',
  holiday:    'bg-event-holiday',
  assignment: 'bg-event-assignment',
};
