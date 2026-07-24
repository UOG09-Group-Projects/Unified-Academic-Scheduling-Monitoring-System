import { motion } from "framer-motion";
import {
  CalendarDays,
  Building2,
  ClipboardList,
  UserCheck,
  Zap,
  BarChart3,
} from "lucide-react";
import Card from "./ui/Card";

const FEATURES = [
  {
    icon: CalendarDays,
    tone: "bg-ocean-50 text-ocean-700",
    title: "Live shared calendar",
    desc: "Classes, exams, and personal reminders sync in real time across every student and educator dashboard.",
  },
  {
    icon: Building2,
    tone: "bg-emerald-50 text-emerald-600",
    title: "Multi-institution support",
    desc: "Owners and managers run several institutions, batches, and terms from one unified workspace.",
  },
  {
    icon: ClipboardList,
    tone: "bg-accent-50 text-accent-600",
    title: "Course & batch management",
    desc: "Enroll students, allocate educators, and organize batches without spreadsheets or guesswork.",
  },
  {
    icon: UserCheck,
    tone: "bg-violet-50 text-violet-600",
    title: "Role-based access",
    desc: "Super admins, owners, managers, educators, students, and parents each see exactly what they need.",
  },
  {
    icon: Zap,
    tone: "bg-red-50 text-red-500",
    title: "Instant updates",
    desc: "Add or change an event and everyone watching sees it appear within seconds — no page refresh.",
  },
  {
    icon: BarChart3,
    tone: "bg-slate-100 text-slate-600",
    title: "Reports & activity logs",
    desc: "Track enrollment, faculty load, and every change made across the institution, in one feed.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Features() {
  return (
    <section id="features" className="py-28 px-[5%] bg-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-brand-700 mb-3">
          What's inside
        </p>
        <h2 className="font-display font-bold text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1.15] tracking-tight text-ink mb-4">
          Built for the full academic term
        </h2>
        <p className="text-[1.05rem] text-ink-faint leading-[1.7] max-w-[560px] mx-auto">
          From semester setup to exam week, every scheduling need handled in one
          calm, connected place.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1100px] mx-auto"
      >
        {FEATURES.map(({ icon: Icon, tone, title, desc }) => (
          <motion.div key={title} variants={item}>
            <Card hover padding="p-8" className="h-full group">
              <div className={`w-12 h-12 ${tone} rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110`}>
                <Icon size={22} />
              </div>
              <h3 className="font-display font-bold text-[1.05rem] text-ink mb-2">{title}</h3>
              <p className="text-[0.9rem] text-ink-faint leading-[1.65]">{desc}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
