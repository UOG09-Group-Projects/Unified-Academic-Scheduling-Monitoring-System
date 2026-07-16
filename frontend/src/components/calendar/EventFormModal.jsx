import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Field';

const TYPE_OPTIONS = [
  { value: 'class',      label: 'Class' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam',       label: 'Exam' },
  { value: 'holiday',    label: 'Holiday' },
  { value: 'meeting',    label: 'Meeting' },
];

function toLocalInputValue(iso, allDay) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (allDay) return date;
  return `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  title: '',
  description: '',
  event_type: 'personal',
  start: '',
  end: '',
  all_day: false,
  course_id: '',
};

export default function EventFormModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  role,
  courses = [],
  initial = null,
  defaultDate = null,
  saving = false,
}) {
  const [form, setForm] = useState(emptyForm);
  const isEducator = role === 'EDUCATOR';
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        event_type: initial.event_type || 'personal',
        start: toLocalInputValue(initial.start, initial.all_day),
        end: toLocalInputValue(initial.end, initial.all_day),
        all_day: initial.all_day || false,
        course_id: initial.course?.id ?? '',
      });
    } else {
      setForm({
        ...emptyForm,
        start: defaultDate ? toLocalInputValue(defaultDate, false) : '',
      });
    }
  }, [open, initial, defaultDate]);

  const set = (key) => (e) => {
    const value = e?.target
      ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value)
      : e;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      title: form.title.trim(),
      description: form.description,
      start: form.start,
      end: form.end || null,
      all_day: form.all_day,
    };

    if (isEducator) {
      payload.course_id = form.course_id || null;
      payload.event_type = form.course_id ? form.event_type : 'personal';
    } else {
      payload.event_type = 'personal';
    }

    onSubmit(payload);
  };

  const canEdit = !isEdit || initial?.can_edit;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? (canEdit ? 'Edit event' : 'Event details') : 'New event'}
      width="max-w-md"
      footer={
        canEdit ? (
          <>
            {isEdit && onDelete && (
              <Button variant="outline" size="md" type="button" onClick={onDelete} className="mr-auto !text-danger !border-danger/20 hover:!bg-red-50">
                Delete
              </Button>
            )}
            <Button variant="outline" size="md" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="brand" size="md" type="submit" form="event-form" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          disabled={!canEdit}
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Midterm review session"
        />

        {isEducator && (
          <Select
            label="Applies to"
            disabled={!canEdit}
            value={form.course_id}
            onChange={set('course_id')}
          >
            <option value="">Personal (only me)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </Select>
        )}

        {isEducator && form.course_id && (
          <Select label="Event type" disabled={!canEdit} value={form.event_type} onChange={set('event_type')}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        )}

        <label className="flex items-center gap-2 text-sm text-ink-soft select-none cursor-pointer">
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={form.all_day}
            onChange={set('all_day')}
            className="accent-brand-600"
          />
          All-day
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Starts"
            required
            disabled={!canEdit}
            type={form.all_day ? 'date' : 'datetime-local'}
            value={form.start}
            onChange={set('start')}
          />
          <Input
            label="Ends (optional)"
            disabled={!canEdit}
            type={form.all_day ? 'date' : 'datetime-local'}
            value={form.end}
            onChange={set('end')}
          />
        </div>

        <Textarea
          label="Description"
          disabled={!canEdit}
          value={form.description}
          onChange={set('description')}
          placeholder="Optional notes…"
        />
      </form>
    </Modal>
  );
}
