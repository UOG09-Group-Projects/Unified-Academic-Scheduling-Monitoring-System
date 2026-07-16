import { motion } from 'framer-motion';
import { GraduationCap, CalendarCheck2, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const HIGHLIGHTS = [
  { icon: CalendarCheck2, text: 'One live calendar for every class, exam and deadline' },
  { icon: Users, text: 'Built for institutions, educators, students and parents' },
  { icon: ShieldCheck, text: 'Role-based access, so everyone sees exactly what they need' },
];

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Branded panel — same ocean gradient as the dashboard sidebar */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative overflow-hidden flex-col justify-between p-10 xl:p-12">
        <div className="absolute inset-0 bg-ocean-gradient" />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(8,20,40,0.55) 0%, rgba(8,20,40,0.32) 40%, rgba(4,10,36,0.68) 100%)',
          }}
        />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
            <span className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap size={19} className="text-white" />
            </span>
            <span className="font-display text-lg font-bold text-white">LightLearn</span>
          </Link>
        </div>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-3xl font-bold text-white leading-tight mb-8 max-w-sm"
          >
            Every class, exam and deadline — in one place.
          </motion.h2>

          <div className="flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3"
              >
                <span className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-white" />
                </span>
                <p className="text-sm text-white/85 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">© 2026 LightLearn</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="absolute top-6 left-6 lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2 no-underline">
            <span className="w-8 h-8 rounded-lg bg-ocean-gradient flex items-center justify-center">
              <GraduationCap size={15} className="text-white" />
            </span>
            <span className="font-display text-base font-bold text-ink">LightLearn</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            {title && <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>}
            {subtitle && <p className="text-sm text-ink-faint mt-1">{subtitle}</p>}
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
