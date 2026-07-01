
export default function CourseTable({ courses, onEdit, onView }) {
  return (
    <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Institution</th>
            <th className="px-4 py-3">Batches</th>
            <th className="px-4 py-3">Educators</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {courses.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-400">No courses found.</td>
            </tr>
          ) : courses.map(course => (
            <tr key={course.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500">{course.id}</td>
              <td className="px-4 py-3 font-medium text-gray-800"
                onClick={() => onEdit(course)}
                style={{ cursor: 'pointer' }}>
                {course.name}
              </td>
              <td className="px-4 py-3 text-gray-600">{course.code}</td>
              <td className="px-4 py-3 text-gray-600">{course.institution_name}</td>
              <td className="px-4 py-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {course.batch_count}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  {course.educator_count}
                </span>
              </td>
              <td className="px-4 py-3">
                <button onClick={() => onView(course)}
                  className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
                  View
                </button>
                <button onClick={() => onEdit(course)}
                  className="ml-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
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