import { CheckCircle2 } from "lucide-react";

const MOCK_ROWS = [
  {
    time: "08:00",
    cells: [
      { type: "blue", text: "CS101\nLec A" },
      null,
      { type: "green", text: "MATH2\nHall B" },
      null,
      { type: "blue", text: "CS101\nLec A" },
    ],
  },
  {
    time: "10:00",
    cells: [
      null,
      { type: "amber", text: "ENG3\nRoom 4" },
      null,
      { type: "blue", text: "CS201\nLab 1" },
      null,
    ],
  },
  {
    time: "13:00",
    cells: [
      { type: "green", text: "PHY1\nHall C" },
      null,
      { type: "amber", text: "ENG3\nRoom 4" },
      null,
      { type: "green", text: "PHY1\nHall C" },
    ],
  },
  {
    time: "15:00",
    cells: [
      null,
      { type: "blue", text: "CS201\nLab 1" },
      null,
      { type: "amber", text: "MATH2\nHall B" },
      null,
    ],
  },
];

const EVENT_STYLES = {
  blue: "bg-blue-500/40 text-blue-200",
  green: "bg-emerald-500/40 text-emerald-200",
  amber: "bg-amber-500/40 text-yellow-200",
};

const POINTS = [
  {
    title: "Zero-configuration onboarding",
    desc: "Import your existing data and go live within a day. No lengthy setup sprints required.",
  },
  {
    title: "Role-based access control",
    desc: "Super admins, department heads, faculty, and students each see exactly what they need.",
  },
  {
    title: "Multi-campus & multi-term support",
    desc: "Manage several campuses and semester types from a single unified dashboard.",
  },
  {
    title: "Secure, cloud-hosted infrastructure",
    desc: "ISO 27001-aligned with automated backups, audit trails, and 99.9% uptime SLA.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="py-24 px-[5%] bg-white"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-[1100px] mx-auto">
        {/* Visual */}
        <div
  className="rounded-[18px] p-9 relative overflow-hidden"
  style={{
    backgroundColor: "#0F172A",
  }}
>
          <div
  className="absolute inset-0 pointer-events-none opacity-20"
  style={{
    backgroundImage: `
      linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)
    `,
    backgroundSize: "24px 24px",
  }}
/>
          <div className="relative z-10 bg-white/[0.04] border border-white/10 rounded-[10px] overflow-hidden">
            {/* Window bar */}
            <div className="bg-cobalt/30 px-4 py-2.5 flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            {/* Schedule grid */}
            <div
                className="grid gap-px"
                style={{
                    backgroundColor: "rgba(255,255,255,.06)",
                    gridTemplateColumns: "72px repeat(5, 1fr)",
                }}
                >
              {/* Day headers */}
              {["Time", "MON", "TUE", "WED", "THU", "FRI"].map((d) => (
                <div
                    className="px-4 py-2.5 flex gap-2 items-center"
                    style={{
                    backgroundColor: "rgba(37,99,235,.25)",
                    }}
                    >
                  {d}
                </div>
              ))}

              {/* Rows */}
              {MOCK_ROWS.map(({ time, cells }) => (
                <>
                  <div
                    key={`time-${time}`}
                   className="px-1.5 py-3.5 text-right text-white/30 text-[0.6rem]"
style={{ backgroundColor: "rgba(15,23,42,.8)" }}
                  >
                    {time}
                  </div>
                  {cells.map((cell, i) => (
                    <div
                      key={`${time}-${i}`}
                      className="p-1 min-h-[42px]"
style={{ backgroundColor: "rgba(15,23,42,.6)" }}
                    >
                      {cell && (
                        <div
                          className={`${
                            EVENT_STYLES[cell.type]
                          } rounded p-1 text-[0.58rem] font-semibold leading-[1.3] whitespace-pre-line`}
                        >
                          {cell.text}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-blue-600 mb-3">
            About LightLearn
          </p>
          <h2 className="font-syne font-bold text-[clamp(1.9rem,3.5vw,2.8rem)] leading-[1.15] tracking-[-0.5px] text-slate-800 mb-4 max-w-[400px]">
            Designed alongside real institutions
          </h2>
          <p className="text-[1.05rem] text-slate-500 leading-[1.7]">
            We built LightLearn by working directly with academic administrators,
            registrars, and students to solve the real friction in how
            institutions manage time.
          </p>

          <div className="mt-8 flex flex-col gap-5">
            {POINTS.map(({ title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <CheckCircle2
                  size={20}
                  className="text-emerald-500 flex-shrink-0 mt-0.5"
                />
                <div>
                  <h4 className="text-[0.95rem] font-semibold text-slate-800 mb-0.5">
                    {title}
                  </h4>
                  <p className="text-[0.875rem] text-slate-500 leading-[1.6]">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}