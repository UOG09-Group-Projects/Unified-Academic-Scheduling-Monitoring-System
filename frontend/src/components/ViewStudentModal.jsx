export default function ViewStudentModal({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center
                    justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{student.name}</h2>
            <p className="text-sm text-gray-500">{student.registration_no}</p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light">
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <span className="text-sm font-medium text-gray-500 w-24">Email</span>
            <span className="text-sm text-gray-800">{student.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-sm font-medium text-gray-500 w-24">Phone</span>
            <span className="text-sm text-gray-800">{student.phone || '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-sm font-medium text-gray-500 w-24">Batch</span>
            <span className="text-sm text-gray-800">{student.batch_name || '—'}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Guardians</p>
          {student.guardians?.length === 0 ? (
            <p className="text-sm text-gray-400">No guardians linked.</p>
          ) : (
            <div className="space-y-2">
              {student.guardians?.map(g => (
                <div key={g.id}
                  className="flex items-center gap-3 px-3 py-2 bg-purple-50
                             rounded text-sm">
                  <span className="font-medium text-purple-800">{g.name}</span>
                  {g.email && (
                    <span className="text-gray-500 text-xs">{g.email}</span>
                  )}
                  {g.phone && (
                    <span className="text-gray-500 text-xs">{g.phone}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={onClose}
          className="w-full mt-5 py-2 bg-gray-100 hover:bg-gray-200
                     rounded text-sm text-gray-700">
          Close
        </button>
      </div>
    </div>
  );
}