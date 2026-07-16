import Badge from '../ui/Badge';

export default function StudentProfileCard({ student }) {
  const initials = student.name
    ? student.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-bold shrink-0">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-lg font-display font-semibold text-ink">{student.name}</p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            student.registration_no,
            student.batch ? `Batch ${student.batch}` : null,
            student.email,
          ]
            .filter(Boolean)
            .map((tag, i) => (
              <Badge key={i} tone="neutral">{tag}</Badge>
            ))}
        </div>
      </div>
    </div>
  );
}
