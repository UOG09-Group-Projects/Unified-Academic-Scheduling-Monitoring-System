import { ShieldCheck, GraduationCap, ArrowRight } from "lucide-react";

export default function Demo({ openAdmin, openStudent }) {
  return (
    <section
      id="demo"
      className="relative py-24 px-[5%] bg-navy text-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-pattern-demo pointer-events-none" />

      <div className="relative z-10">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-mint mb-4">
          Live Demo Access
        </p>
        <h2 className="font-syne font-bold text-[clamp(1.9rem,3.5vw,2.8rem)] leading-[1.15] tracking-[-0.5px] text-white mb-3">
          Two roles, one platform
        </h2>
        <p className="text-[1.05rem] text-white/55 max-w-[560px] mx-auto leading-[1.7] mb-12">
          Explore SchedEdu from both sides. Log in as a Super Admin to manage
          the full system, or create a student account to experience enrollment
          firsthand.
        </p>

        <div className="flex gap-6 justify-center flex-wrap">
          {/* Admin Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-9 w-[300px] text-left transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck size={16} className="text-mint" />
              <span className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-mint">
                Admin Access
              </span>
            </div>
            <h3 className="font-syne font-bold text-[1.2rem] text-white mb-2">
              Super Admin
            </h3>
            <p className="text-[0.865rem] text-white/50 leading-[1.65] mb-7">
              Access the full control panel — manage courses, rooms, faculty,
              and system-wide settings with pre-loaded demo data.
            </p>
            <button
              onClick={openAdmin}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-transparent border-[1.5px] border-mint text-mint font-semibold text-sm rounded-lg tracking-wide transition-colors duration-200 hover:bg-mint hover:text-navy cursor-pointer"
            >
              Login as Super Admin
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Student Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-9 w-[300px] text-left transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]">
            <div className="flex items-center gap-2 mb-5">
              <GraduationCap size={16} className="text-cobalt-light" />
              <span className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-cobalt-light">
                Student Access
              </span>
            </div>
            <h3 className="font-syne font-bold text-[1.2rem] text-white mb-2">
              Student Account
            </h3>
            <p className="text-[0.865rem] text-white/50 leading-[1.65] mb-7">
              Create a free demo student account and experience course browsing,
              timetable viewing, and enrollment.
            </p>
            <button
              onClick={openStudent}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-cobalt border-[1.5px] border-cobalt text-white font-semibold text-sm rounded-lg tracking-wide transition-colors duration-200 hover:bg-cobalt-light hover:border-cobalt-light cursor-pointer"
            >
              Create Student Account
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}