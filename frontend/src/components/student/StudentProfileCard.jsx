// src/components/student/StudentProfileCard.jsx

const COLOR_MAP = {
  blue: { avatar: 'bg-blue-500 text-white' },
};

export default function StudentProfileCard({ student }) {
  const initials = student.name
    ? student.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="rounded-xl border bg-white p-6 flex items-center gap-4">
      
      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-lg font-semibold text-gray-900">
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
                className="px-2.5 py-1 rounded-md border bg-gray-50 text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}