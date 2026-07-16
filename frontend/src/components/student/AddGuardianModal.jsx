import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import studentService from '../../services/studentService';
import { useToast } from '../ui/Toast';

const EMPTY = { name: '', email: '', phone: '', password: '' };

export default function AddGuardianModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    setForm(EMPTY);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await studentService.addMyGuardian(form);
      toast.success(res.message || 'Guardian added.');
      setForm(EMPTY);
      onAdded?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add guardian.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add a guardian"
      footer={
        <>
          <Button variant="outline" size="md" onClick={handleClose}>Cancel</Button>
          <Button variant="brand" size="md" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Add guardian'}
          </Button>
        </>
      }
    >
      <p className="text-xs text-ink-faint mb-4">
        If a guardian with this email already has an account (e.g. a sibling
        already added them), we'll link the existing account instead of
        creating a new one — no password needed in that case.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Guardian's full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Jane Doe"
          required
        />
        <Input
          label="Guardian's email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="guardian@example.com"
          required
        />
        <Input
          label="Guardian's phone"
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Optional"
        />
        <Input
          label="Password for guardian's account"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Only needed if this guardian is new (min 8 characters)"
          minLength={8}
        />
      </form>
    </Modal>
  );
}
