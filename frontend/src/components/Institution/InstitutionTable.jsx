import { useState } from 'react';
import { Trash2 } from 'lucide-react';

// =========================
// Confirm Delete Modal
// =========================
const ConfirmDeleteModal = ({ name, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[380px] max-w-[95vw] p-6">

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>

        {/* Text */}
        <h3 className="text-center text-base font-semibold text-gray-800 mb-1">
          Delete Institution
        </h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-700">"{name}"</span>?
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================
// Institution Table
// =========================
const InstitutionTable = ({ institutions, onView, onEdit, onDelete }) => {
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  const handleDeleteClick = (inst) => {
    setDeleteTarget({ id: inst.id, name: inst.name });
  };

  const handleConfirm = () => {
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleCancel = () => {
    setDeleteTarget(null);
  };

  if (!institutions.length)
    return <p className="text-center py-10 text-sm text-gray-400">No institutions found.</p>;

  return (
    <>
      {/* Delete Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {['ID', 'Name', 'Logo', 'Owner', 'Email', 'Actions'].map(h => (
                <th key={h}
                  className="px-3 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {institutions.map(inst => (
              <tr key={inst.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="px-3 py-2.5 text-xs text-gray-400">{inst.id}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">{inst.name}</td>
                <td className="px-3 py-2.5">
                  {inst.logo
                    ? <img src={inst.logo} alt="logo" className="w-8 h-8 rounded object-cover" />
                    : <span className="text-gray-300">—</span>
                  }
                </td>
                <td className="px-3 py-2.5 text-gray-700">{inst.owner?.username}</td>
                <td className="px-3 py-2.5 text-xs text-gray-400">{inst.owner?.email}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5">
                    <button onClick={() => onView(inst)}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
                      View
                    </button>
                    <button onClick={() => onEdit(inst)}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteClick(inst)}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InstitutionTable;