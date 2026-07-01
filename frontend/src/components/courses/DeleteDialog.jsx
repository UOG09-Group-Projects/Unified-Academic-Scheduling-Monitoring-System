
export default function DeleteDialog({ isOpen, onConfirm, onCancel, courseName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Course</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{courseName}</strong>? This will also remove all
          batch assignments and educator allocations.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}