export default function StudentTable({ students, onEdit, onView }) {
  return (
    <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm text-left text-slate-700">
        <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-[0.22em]">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Reg No</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Batch</th>
            <th className="px-4 py-3">Guardians</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                No students found.
              </td>
            </tr>
          ) : students.map(student => (
            <tr key={student.id} className="transition hover:bg-slate-50">
              <td className="px-4 py-4 text-slate-500">{student.id}</td>
              <td className="px-4 py-4 font-medium text-slate-900 cursor-pointer hover:text-sky-600"
                onClick={() => onEdit(student)}>
                {student.name}
              </td>
              <td className="px-4 py-3 text-gray-600">{student.registration_no}</td>
              <td className="px-4 py-4 text-slate-600">{student.email}</td>
              <td className="px-4 py-4 text-slate-600">{student.batch_name || '—'}</td>
              <td className="px-4 py-4">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {student.guardian_count}
                </span>
              </td>
              <td className="px-4 py-4 space-x-2">
                <button onClick={() => onView(student)}
                  className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100">
                  View
                </button>
                <button onClick={() => onEdit(student)}
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}