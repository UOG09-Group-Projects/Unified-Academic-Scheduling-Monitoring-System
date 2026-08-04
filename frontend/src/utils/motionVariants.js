// Shared framer-motion variants, so every dashboard/section fades in with
// the same feel instead of each page carrying its own copy of the same
// object. `custom={i}` on the motion element staggers each section by
// i * 0.06s.
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};
