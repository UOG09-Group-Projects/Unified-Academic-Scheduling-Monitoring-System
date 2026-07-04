// src/components/student/StudentProfileCard.jsx
export default function StudentProfileCard({ student }) {
  const initials = student.name
    ? student.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="bg-[#1A1D26] border border-[#2A2D3A] rounded-xl p-6 flex items-center gap-4">
      {/* Avatar */}
      <div className="w-[52px] h-[52px] rounded-xl bg-[#2B4EFF] flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-base tracking-wide">
          {initials}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-lg font-semibold text-[#F0F2F8] leading-tight">
          {student.name}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            student.registration_no,
            student.batch ? `Batch ${student.batch}` : null,
            student.email,
          ]
            .filter(Boolean)
            .map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md border border-[#2A2D3A]
                           text-[11px] text-[#6B7280] bg-[#0F1117]"
              >
                {tag}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}