import {
  CalendarDays,
  Building2,
  ClipboardList,
  UserCheck,
  Zap,
  BarChart3,
} from "lucide-react";

const FEATURES = [
  {
    icon: CalendarDays,
    colorClass: "bg-blue-50 text-[#2563EB]",
    title: "Smart Timetable Builder",
    desc: "Drag-and-drop schedule creation with automatic conflict detection across rooms, faculty, and student groups.",
  },
  {
    icon: Building2,
    colorClass: "bg-emerald-50 text-[#4ADE80]",
    title: "Room Management",
    desc: "Track capacity, equipment, and availability for every classroom, lab, and lecture hall in real time.",
  },
  {
    icon: ClipboardList,
    colorClass: "bg-amber-50 text-amber-500",
    title: "Course Registration",
    desc: "Students browse, enroll, and manage their timetable independently — with waitlist management built in.",
  },
  {
    icon: UserCheck,
    colorClass: "bg-violet-50 text-violet-500",
    title: "Faculty Allocation",
    desc: "Assign lecturers to courses with workload balancing and preference-aware scheduling.",
  },
  {
    icon: Zap,
    colorClass: "bg-red-50 text-red-500",
    title: "Conflict Resolution",
    desc: "Instant alerts when scheduling clashes occur, with suggested alternatives to resolve them fast.",
  },
  {
    icon: BarChart3,
    colorClass: "bg-slate-100 text-slate-500",
    title: "Reports & Analytics",
    desc: "Utilization rates, enrollment trends, and faculty load summaries — exportable to PDF or Excel.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-[5%] bg-slate-50">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2563EB] mb-3">
          What's inside
        </p>

        <h2 className="font-bold text-[clamp(1.9rem,3.5vw,2.8rem)] leading-[1.15] tracking-tight text-slate-800 mb-4">
          Built for the full academic lifecycle
        </h2>

        <p className="text-[1.05rem] text-slate-500 leading-[1.7] max-w-[560px] mx-auto">
          From semester setup to exam week, every scheduling need handled in one
          place.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
        {FEATURES.map(({ icon: Icon, colorClass, title, desc }) => (
          <div
            key={title}
            className="bg-white border border-slate-200 rounded-[14px] p-8 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div
              className={`w-[46px] h-[46px] ${colorClass} rounded-[10px] flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110`}
            >
              <Icon size={22} />
            </div>

            <h3 className="font-bold text-[1.05rem] text-slate-800 mb-2">
              {title}
            </h3>

            <p className="text-[0.9rem] text-slate-500 leading-[1.65]">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}