import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/Field';

export default function ActivityFormModal({ open, onClose, onSubmit, initial, saving }) {
  const [form, setForm] = useState({ name: '', due_date: '', description: '', optional: false });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: initial?.name || '',
      due_date: initial?.due_date || '',
      description: initial?.description || '',
      optional: initial?.optional || false,
    });
  }, [open, initial]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit activity' : 'New activity'}
      width="max-w-sm"
      footer={
        <>
          <Button variant="outline" size="md" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="brand" size="md" type="submit" form="activity-form" disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Create activity'}
          </Button>
        </>
      }
    >
      <form id="activity-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" required value={form.name} onChange={set('name')} placeholder="e.g. Assignment 1" />
        <Input label="Due date" type="date" value={form.due_date} onChange={set('due_date')} />
        <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Optional notes…" />
        <label className="flex items-center gap-2 text-sm text-ink-soft select-none cursor-pointer">
          <input type="checkbox" checked={form.optional} onChange={set('optional')} className="accent-brand-600" />
          Optional activity
        </label>
      </form>
    </Modal>
  );
}
