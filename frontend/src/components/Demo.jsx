import { motion } from "framer-motion";
import { GraduationCap, Presentation, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "./ui/Card";
import Button from "./ui/Button";

const PORTALS = [
  {
    icon: Presentation,
    tone: "bg-brand-50 text-brand-600",
    role: "For educators",
    title: "Plan and publish in minutes",
    desc: "Schedule classes, assignments and exams for your courses. Students see updates the moment you publish.",
    points: ["Course-scoped calendar events", "Batch & allocation overview", "Instant sync to every student"],
  },
  {
    icon: GraduationCap,
    tone: "bg-accent-50 text-accent-600",
    role: "For students",
    title: "One calendar for everything",
    desc: "Every enrolled course's schedule plus your own personal reminders, always current, always in one view.",
    points: ["Live course schedule", "Personal study reminders", "No missed deadlines"],
  },
];

export default function Demo() {
  const navigate = useNavigate();

  return (
    <section id="demo" className="py-28 px-[5%] bg-paper-soft">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-ocean-700 mb-3">
          Two roles, one platform
        </p>
        <h2 className="font-display font-bold text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1.15] tracking-tight text-ink mb-4">
          Built around how you actually work
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1000px] mx-auto">
        {PORTALS.map(({ icon: Icon, tone, role, title, desc, points }, i) => (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card hover padding="p-9" className="h-full flex flex-col">
              <div className={`w-12 h-12 ${tone} rounded-xl flex items-center justify-center mb-5`}>
                <Icon size={22} />
              </div>
              <p className="text-xs font-semibold tracking-wide uppercase text-ink-faint mb-2">{role}</p>
              <h3 className="font-display font-bold text-xl text-ink mb-2.5">{title}</h3>
              <p className="text-sm text-ink-faint leading-relaxed mb-5">{desc}</p>

              <ul className="flex flex-col gap-2 mb-7 mt-auto">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-ink-soft">
                    <span className="w-1.5 h-1.5 rounded-full bg-ocean-600 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                size="md"
                icon={ArrowRight}
                className="flex-row-reverse self-start"
                onClick={() => navigate("/login")}
              >
                Try it
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
