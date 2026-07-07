import { ArrowRight, ChevronDown } from "lucide-react";

const STATS = [
  { num: "50", suffix: "K+", label: "Students Served" },
  { num: "120", suffix: "+", label: "Institutions" },
  { num: "98", suffix: "%", label: "Conflict-Free" },
  { num: "4.8", suffix: "★", label: "Avg Rating" },
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen bg-[#0F172A] flex flex-col justify-center items-center text-center px-[5%] pt-[100px] pb-[60px] overflow-hidden"
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow Blob */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)",
        }}
      />

      {/* Eyebrow */}
      <div className="relative z-10 flex items-center gap-2 mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#4ADE80]">
          Academic Scheduling System
        </p>
        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
      </div>

      {/* Title */}
      <h1 className="relative z-10 font-extrabold leading-[1.05] tracking-tight text-white max-w-[820px] mb-6 text-[clamp(2.8rem,6vw,5rem)]">
        Schedules that work
        <br />
        <span className="bg-gradient-to-r from-[#4ADE80] to-[#3B82F6] bg-clip-text text-transparent">
          for everyone
        </span>
      </h1>

      {/* Subtitle */}
      <p className="relative z-10 text-lg text-white/70 max-w-[520px] leading-[1.7] mb-10">
        One platform to manage timetables, room assignments, course
        registrations, and conflict resolution — for your entire institution.
      </p>

      {/* CTA Buttons */}
      <div className="relative z-10 flex gap-4 flex-wrap justify-center">
        <a
          href="#demo"
          className="flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#2563EB] text-white font-semibold transition-all duration-200 hover:bg-[#3B82F6] hover:-translate-y-1 no-underline"
        >
          Try the Demo
          <ArrowRight size={16} />
        </a>

        <a
          href="#features"
          className="flex items-center gap-2 px-8 py-3.5 rounded-lg border border-white/20 text-white/80 hover:border-white/60 hover:text-white transition-all duration-200 no-underline"
        >
          See Features
          <ChevronDown size={16} />
        </a>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex gap-12 flex-wrap justify-center mt-14 pt-12 border-t border-white/10 w-full max-w-2xl">
        {STATS.map(({ num, suffix, label }) => (
          <div key={label} className="text-center">
            <div className="text-4xl font-bold text-white">
              {num}
              <span className="text-[#4ADE80]">{suffix}</span>
            </div>

            <div className="text-xs uppercase tracking-wider text-white/50 mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}