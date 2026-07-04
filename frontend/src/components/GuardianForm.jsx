import { useState } from 'react';
import studentService from '../services/studentService';

export default function GuardianForm({ onCreated, onCancel }) {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name) return setError('Guardian name is required.');
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.createGuardian(form);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create guardian.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-blue-50 mb-4">
      <h3 className="text-sm font-semibold text-blue-800 mb-3">Add New Guardian</h3>

      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input name="name" value={form.name} onChange={handleChange}
            placeholder="Guardian name"
            className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input name="email" value={form.email} onChange={handleChange}
            placeholder="guardian@email.com"
            className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange}
            placeholder="+94771234567"
            className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange}
            placeholder="Login password"
            className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={loading}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Guardian'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}