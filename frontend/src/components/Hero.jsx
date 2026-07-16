import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

const STATS = [
  { num: "50", suffix: "K+", label: "Students served" },
  { num: "120", suffix: "+", label: "Institutions" },
  { num: "98", suffix: "%", label: "Conflict-free" },
];

const WEEK = ["MON", "TUE", "WED", "THU", "FRI"];
// Reuses the exact event-type colors the real dashboard calendar uses —
// so the hero preview looks like the actual product, not a generic mockup.
const SCHEDULE = [
  { day: 0, top: "12%", height: "18%", color: "bg-event-class", label: "Data Structures" },
  { day: 1, top: "34%", height: "14%", color: "bg-event-meeting", label: "Lab · Physics" },
  { day: 2, top: "10%", height: "22%", color: "bg-event-holiday", label: "Algorithms" },
  { day: 3, top: "40%", height: "16%", color: "bg-event-assignment", label: "Seminar" },
  { day: 4, top: "18%", height: "18%", color: "bg-event-class", label: "Review Session" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="home"
      className="relative min-h-screen bg-paper flex items-center px-[5%] pt-[110px] pb-16 overflow-hidden"
    >
      {/* soft ambient shapes, tinted with the same ocean identity as the dashboards */}
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-ocean-100/70 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-32 w-[360px] h-[360px] rounded-full bg-brand-100/50 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center w-full">
        {/* Copy */}
        <div>
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-ink/[0.08] shadow-soft mb-6"
          >
            <Sparkles size={13} className="text-ocean-700" />
            <span className="text-xs font-semibold text-ink-soft tracking-wide">
              Built for academic scheduling
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="font-display font-bold leading-[1.06] tracking-tight text-ink max-w-[620px] mb-6 text-[clamp(2.4rem,5vw,3.75rem)]"
          >
            Every class, exam and
            <br />
            deadline —{" "}
            <span className="bg-gradient-to-r from-ocean-600 to-ocean-900 bg-clip-text text-transparent">in one place.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-lg text-ink-faint max-w-[480px] leading-[1.7] mb-9"
          >
            LightLearn gives institutions, educators, and students a shared, live
            calendar and one calm workspace to run the entire academic term —
            no spreadsheets, no group chats, no missed classes.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex gap-4 flex-wrap"
          >
            <Button variant="ocean" size="lg" icon={ArrowRight} className="flex-row-reverse" onClick={() => navigate("/login")}>
              Get started
            </Button>
            <Button as="a" href="#features" variant="outline" size="lg">
              See how it works
            </Button>
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="flex gap-10 flex-wrap mt-14 pt-8 border-t border-ink/[0.08] max-w-[480px]"
          >
            {STATS.map(({ num, suffix, label }) => (
              <div key={label}>
                <div className="text-3xl font-display font-bold text-ink">
                  {num}<span className="text-ocean-700">{suffix}</span>
                </div>
                <div className="text-xs uppercase tracking-wider text-ink-faint mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Live-looking weekly schedule visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white rounded-2xl border border-ink/[0.06] shadow-lift overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink/[0.06]">
              <div>
                <p className="text-xs text-ink-faint font-medium">This week</p>
                <p className="font-display font-semibold text-ink text-sm">Oct 12 – 16</p>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-300" />
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-px bg-ink/[0.04] px-3 pt-3">
              {WEEK.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-ink-faint pb-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="relative grid grid-cols-5 gap-2 px-3 pb-4 h-[220px]">
              {WEEK.map((_, i) => (
                <div key={i} className="relative h-full rounded-lg bg-ink/[0.02]">
                  {SCHEDULE.filter((s) => s.day === i).map((s, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + i * 0.07 }}
                      className={`absolute left-1 right-1 rounded-md px-1.5 py-1 text-[9px] font-semibold text-white leading-tight ${s.color}`}
                      style={{ top: s.top, height: s.height }}
                    >
                      {s.label}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>

          {/* floating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -left-8 bottom-8 bg-white rounded-xl border border-ink/[0.06] shadow-lift px-4 py-3 hidden sm:block"
          >
            <p className="text-[10px] text-ink-faint font-medium">Synced live</p>
            <p className="text-sm font-display font-semibold text-ink flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Updated just now
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
