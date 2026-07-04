// src/components/student/StudentStatCards.jsx
function StatCard({ label, value }) {
  return (
    <div className="bg-[#1A1D26] border border-[#2A2D3A] rounded-xl p-5 flex flex-col gap-2">
      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B7280]">
        {label}
      </span>
      <span className="text-[3.5rem] font-light leading-none tracking-tight text-[#F0F2F8]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

export default function StudentStatCards({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="My Courses" value={summary.total_courses} />
      <StatCard label="My Educators" value={summary.total_educators} />
    </div>
  );
}