import { Fragment } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const MOCK_ROWS = [
  { time: "08:00", cells: [{ type: "blue", text: "CS101\nLec A" }, null, { type: "green", text: "MATH2\nHall B" }, null, { type: "blue", text: "CS101\nLec A" }] },
  { time: "10:00", cells: [null, { type: "amber", text: "ENG3\nRoom 4" }, null, { type: "blue", text: "CS201\nLab 1" }, null] },
  { time: "13:00", cells: [{ type: "green", text: "PHY1\nHall C" }, null, { type: "amber", text: "ENG3\nRoom 4" }, null, { type: "green", text: "PHY1\nHall C" }] },
  { time: "15:00", cells: [null, { type: "blue", text: "CS201\nLab 1" }, null, { type: "amber", text: "MATH2\nHall B" }, null] },
];

// Reuses the real dashboard calendar's event-type colors.
const EVENT_STYLES = {
  blue: "bg-event-class text-white",
  green: "bg-event-holiday text-white",
  amber: "bg-event-assignment text-white",
};

const POINTS = [
  { title: "Zero-configuration onboarding", desc: "Import your existing data and go live within a day. No lengthy setup sprints required." },
  { title: "Role-based access control", desc: "Super admins, department heads, faculty, and students each see exactly what they need." },
  { title: "Multi-campus & multi-term support", desc: "Manage several campuses and semester types from a single unified dashboard." },
  { title: "Live, always-current schedules", desc: "Every event syncs across dashboards in seconds — everyone works from the same calendar." },
];

export default function About() {
  return (
    <section id="about" className="py-28 px-[5%] bg-paper-soft">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-[1100px] mx-auto">
        {/* Visual — a light glass preview, consistent with the product's real dashboards */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl p-2 relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-glass"
        >
          <div className="relative z-10 bg-white rounded-2xl overflow-hidden border border-ink/[0.06]">
            <div className="px-4 py-2.5 flex items-center justify-between bg-paper-soft">
              <span className="text-[10px] font-semibold text-ink-faint tracking-wide">This week</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-ink-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </div>

            <div
              className="grid gap-px bg-ink/[0.06]"
              style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}
            >
              {["", "MON", "TUE", "WED", "THU", "FRI"].map((d) => (
                <div key={d} className="px-2 py-2.5 flex gap-2 items-center justify-center text-[10px] font-semibold text-ink-faint bg-paper-soft">
                  {d}
                </div>
              ))}

              {MOCK_ROWS.map(({ time, cells }) => (
                <Fragment key={time}>
                  <div className="px-1.5 py-3.5 text-right text-ink-faint text-[0.6rem] bg-paper-soft">
                    {time}
                  </div>
                  {cells.map((cell, i) => (
                    <div key={`${time}-${i}`} className="p-1 min-h-[42px] bg-white">
                      {cell && (
                        <div className={`${EVENT_STYLES[cell.type]} rounded p-1 text-[0.58rem] font-semibold leading-[1.3] whitespace-pre-line shadow-sm`}>
                          {cell.text}
                        </div>
                      )}
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-brand-700 mb-3">
            About LightLearn
          </p>
          <h2 className="font-display font-bold text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1.15] tracking-tight text-ink mb-4 max-w-[400px]">
            Designed alongside real institutions
          </h2>
          <p className="text-[1.05rem] text-ink-faint leading-[1.7]">
            We built LightLearn by working directly with academic administrators,
            registrars, and students to solve the real friction in how
            institutions manage time.
          </p>

          <div className="mt-8 flex flex-col gap-5">
            {POINTS.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex gap-4 items-start"
              >
                <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[0.95rem] font-semibold text-ink mb-0.5">{title}</h4>
                  <p className="text-[0.875rem] text-ink-faint leading-[1.6]">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
