const COLOR_MAP = {
  blue:   { card: 'bg-blue-50   border-blue-100',  icon: 'bg-blue-100  text-blue-600',  val: 'text-blue-700'   },
  green:  { card: 'bg-green-50  border-green-100', icon: 'bg-green-100 text-green-600', val: 'text-green-700'  },
  purple: { card: 'bg-purple-50 border-purple-100',icon: 'bg-purple-100 text-purple-600',val:'text-purple-700' },
  orange: { card: 'bg-orange-50 border-orange-100',icon: 'bg-orange-100 text-orange-600',val:'text-orange-700' },
  red:    { card: 'bg-red-50    border-red-100',   icon: 'bg-red-100   text-red-600',   val: 'text-red-700'    },
};

export default function StatCard({ label, value, color = 'blue', icon: Icon }) {
  const s = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${s.card}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                       text-xl flex-shrink-0 ${s.icon}`}>
        <Icon />
      </div>
      <div>
        <p className={`text-2xl font-bold leading-none ${s.val}`}>{value ?? '—'}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
      </div>
    </div>
  );
}