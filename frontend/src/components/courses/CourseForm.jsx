import { useState } from 'react';
import BatchTransfer from './BatchTransfer';
import EducatorTransfer from './EducatorTransfer';

function buildInitialForm(selectedCourse, allBatches, allEducators) {
  if (!selectedCourse) {
    return {
      institution: '',
      name: '',
      code: '',
      batchesAvailable: allBatches,
      batchesAssigned: [],
      educatorsAvailable: allEducators,
      educatorsAssigned: [],
    };
  }

  const assignedBatchIds = selectedCourse.batches.map(b => b.batch);
  const assignedEducatorIds = selectedCourse.educators.map(e => e.educator);

  const batchesAssigned = allBatches.filter(b => assignedBatchIds.includes(b.id));
  const batchesAvailable = allBatches.filter(b => !assignedBatchIds.includes(b.id));

  const educatorsAssigned = allEducators.filter(e => assignedEducatorIds.includes(e.id));
  const educatorsAvailable = allEducators.filter(e => !assignedEducatorIds.includes(e.id));


  return {
    institution: selectedCourse.institution,
    name: selectedCourse.name,
    code: selectedCourse.code,
    batchesAvailable,
    batchesAssigned,
    educatorsAvailable,
    educatorsAssigned,
  };
}

export default function CourseForm({
  selectedCourse,
  institutions,
  allBatches,
  allEducators,
  onInsert,
  onUpdate,
  onDelete,
  onClear,
}) {

  const [form, setForm] = useState(() =>
    buildInitialForm(selectedCourse, allBatches, allEducators)
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buildPayload = () => ({
    institution: form.institution,
    name: form.name,
    code: form.code,
    batch_ids: form.batchesAssigned.map(b => b.id),
    educator_ids: form.educatorsAssigned.map(e => e.id),
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-base font-semibold text-gray-700 mb-4 border-b pb-2">Course Management</h2>

      {/* Institution */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
        <select name="institution" value={form.institution} onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">-- Select Institution --</option>
          {institutions.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
      </div>

      {/* Course Name */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
        <input name="name" value={form.name} onChange={handleChange}
          placeholder="e.g. Information Technology"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>

      {/* Course Code */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
        <input name="code" value={form.code} onChange={handleChange}
          placeholder="e.g. IT101"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>

      {/* Batch Transfer */}
      <div className="mb-4">
        <BatchTransfer
          available={form.batchesAvailable}
          assigned={form.batchesAssigned}
          onChange={({ available, assigned }) =>
            setForm(prev => ({ ...prev, batchesAvailable: available, batchesAssigned: assigned }))
          }
        />
      </div>

      {/* Educator Transfer */}
      <div className="mb-6">
        <EducatorTransfer
          available={form.educatorsAvailable}
          assigned={form.educatorsAssigned}
          onChange={({ available, assigned }) =>
            setForm(prev => ({ ...prev, educatorsAvailable: available, educatorsAssigned: assigned }))
          }
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onInsert(buildPayload())}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Insert
        </button>
        <button onClick={() => onUpdate(selectedCourse?.id, buildPayload())}
          disabled={!selectedCourse}
          className="px-4 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-40">
          Update
        </button>
        <button onClick={() => setShowDeleteDialog(true)}
          disabled={!selectedCourse}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-40">
          Delete
        </button>
        <button onClick={onClear}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
          Clear
        </button>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Course</h2>
            <p className="text-gray-600 mb-6">
              Delete <strong>{selectedCourse?.name}</strong>? This removes all batch and educator assignments.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
              <button onClick={() => { setShowDeleteDialog(false); onDelete(selectedCourse.id); }}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}