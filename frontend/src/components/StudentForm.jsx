import { useState, useEffect } from 'react';
import GuardianForm from './GuardianForm';
import studentService from '../services/studentService';

function buildInitialForm(student) {
  if (!student) {
    return {
      name: '', email: '', phone: '',
      registration_no: '', batch_id: '',
      password: '', guardian_ids: [],
    };
  }
  return {
    name:            student.name,
    email:           student.email,
    phone:           student.phone || '',
    registration_no: student.registration_no,
    batch_id:        student.batch || '',
    password:        '',
    guardian_ids: student.guardians?.map(g => g.id) || [],
  };
}

export default function StudentForm({
  selectedStudent,
  batches,
  onInsert, onUpdate, onDelete, onClear,
}) {
  const [form, setForm]                   = useState(() => buildInitialForm(selectedStudent));
  const [guardians, setGuardians]         = useState([]);
  const [showGuardianForm, setShowGuardianForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loadingGuardians, setLoadingGuardians] = useState(true);

  // Load all available guardians for the checkbox list
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await studentService.listGuardians();
        if (!ignore) setGuardians(data);
      } finally {
        if (!ignore) setLoadingGuardians(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleGuardian = (id) => {
    setForm(prev => ({
      ...prev,
      guardian_ids: prev.guardian_ids.includes(id)
        ? prev.guardian_ids.filter(g => g !== id)
        : [...prev.guardian_ids, id],
    }));
  };

  const handleGuardianCreated = (newGuardian) => {
    setGuardians(prev => [...prev, newGuardian]);
    setForm(prev => ({
      ...prev,
      guardian_ids: [...prev.guardian_ids, newGuardian.id],
    }));
    setShowGuardianForm(false);
  };
console.log("Batches received:", batches);
  const buildPayload = () => ({
    name:            form.name,
    email:           form.email,
    phone:           form.phone,
    registration_no: form.registration_no,
    batch_id:        form.batch_id,
    password:        form.password,
    guardian_ids:    form.guardian_ids,
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-5">
        Student profile
      </h2>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
          <input name="name" value={form.name} onChange={handleChange}
            placeholder="e.g. Kamal Perera"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900
                       focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Registration No</label>
          <input name="registration_no" value={form.registration_no} onChange={handleChange}
            placeholder="e.g. STU2024001"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900
                       focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            placeholder="student@email.com"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900
                       focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange}
            placeholder="+94771234567"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900
                       focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Batch</label>
          <select name="batch_id" value={form.batch_id} onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900
                       focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
            <option value="">Select batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {!selectedStudent && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password <span className="text-slate-400 font-normal">(login password)</span>
            </label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Set login password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900
                         focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-700">Guardians</label>
          <button onClick={() => setShowGuardianForm(true)}
            className="text-sm font-semibold text-slate-900 hover:text-slate-700">
            + Add guardian
          </button>
        </div>

        {showGuardianForm && (
          <GuardianForm
            onCreated={handleGuardianCreated}
            onCancel={() => setShowGuardianForm(false)}
          />
        )}

        <div className="max-h-44 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-3">
          {loadingGuardians ? (
            <p className="text-sm text-slate-400">Loading guardians…</p>
          ) : guardians.length === 0 ? (
            <p className="text-sm text-slate-400">No guardians yet. Add one above.</p>
          ) : guardians.map(g => (
            <label key={g.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-slate-700 transition hover:bg-white">
              <input type="checkbox"
                checked={form.guardian_ids.includes(g.id)}
                onChange={() => toggleGuardian(g.id)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
              <div>
                <div className="text-sm font-medium">{g.name}</div>
                {g.email && <div className="text-xs text-slate-400">{g.email}</div>}
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">{form.guardian_ids.length} guardian(s) selected</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => onInsert(buildPayload())}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
          Insert
        </button>
        <button onClick={() => onUpdate(selectedStudent?.id, buildPayload())}
          disabled={!selectedStudent}
          className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">
          Update
        </button>
        <button onClick={() => setShowDeleteDialog(true)}
          disabled={!selectedStudent}
          className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50">
          Delete
        </button>
        <button onClick={onClear}
          className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
          Clear
        </button>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Student</h2>
            <p className="text-gray-600 mb-6">
              Delete <strong>{selectedStudent?.name}</strong>? Their login account
              will also be deactivated.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
                Cancel
              </button>
              <button onClick={() => {
                setShowDeleteDialog(false);
                onDelete(selectedStudent.id);
              }}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}