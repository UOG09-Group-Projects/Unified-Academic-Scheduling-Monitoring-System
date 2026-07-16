import { useState } from 'react';
import studentService from '../services/studentService';
import Card from './ui/Card';
import Button from './ui/Button';
import { Input } from './ui/Field';

export default function GuardianForm({ onCreated, onCancel }) {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
    <Card padding="p-4" className="bg-brand-50/60 border-brand-100 mb-4">
      <h3 className="text-sm font-semibold text-brand-700 mb-3">Add new guardian</h3>

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="Name *" name="name" value={form.name} onChange={handleChange} placeholder="Guardian name" />
        <Input label="Email" name="email" value={form.email} onChange={handleChange} placeholder="guardian@email.com" />
        <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+94771234567" />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Login password" />
      </div>

      <div className="flex gap-2">
        <Button variant="brand" size="sm" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Saving…' : 'Save guardian'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}
