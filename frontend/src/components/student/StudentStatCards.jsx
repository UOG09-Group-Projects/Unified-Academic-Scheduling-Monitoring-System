// src/components/student/StudentStatCards.jsx

const COLOR_MAP = {
  blue:   { card: 'bg-blue-50 border-blue-100',   icon: 'bg-blue-100 text-blue-600',   val: 'text-blue-700' },
  green:  { card: 'bg-green-50 border-green-100', icon: 'bg-green-100 text-green-600',  val: 'text-green-700' },
  purple: { card: 'bg-purple-50 border-purple-100',icon:'bg-purple-100 text-purple-600', val:'text-purple-700' },
  orange: { card: 'bg-orange-50 border-orange-100',icon:'bg-orange-100 text-orange-600', val:'text-orange-700' },
};

function StatCard({ label, value, color = 'blue' }) {
  const s = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div className={`rounded-xl border p-5 flex flex-col ${s.card}`}>
      <p className={`text-2xl font-bold ${s.val}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
    </div>
  );
}

export default function StudentStatCards({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="My Courses" value={summary.total_courses} color="blue" />
      <StatCard label="My Educators" value={summary.total_educators} color="purple" />
    </div>
  );
}