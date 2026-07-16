import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Select, Input } from '../ui/Field';
import activityService from '../../services/activityService';
import progressService from '../../services/progressService';
import { useToast } from '../ui/Toast';

export default function SetProgressModal({ open, onClose, activity, courseId, onSaved }) {
  const [roster, setRoster] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [percent, setPercent] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setStudentId('');
    setPercent('');
    activityService.listRoster(courseId)
      .then(setRoster)
      .catch(() => toast.error('Failed to load student roster.'));
  }, [open, courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) return toast.error('Select a student.');
    const value = Number(percent) / 100;
    if (Number.isNaN(value) || value < 0 || value > 1) {
      return toast.error('Enter a percentage between 0 and 100.');
    }
    setSaving(true);
    try {
      await progressService.setProgress(studentId, activity.id, value);
      toast.success('Progress saved.');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save progress.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Set progress — ${activity?.name ?? ''}`}
      width="max-w-sm"
      footer={
        <>
          <Button variant="outline" size="md" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="brand" size="md" type="submit" form="progress-form" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="progress-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select label="Student" required value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">Select a student…</option>
          {roster.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.registration_no})</option>
          ))}
        </Select>
        <Input
          label="Progress (%)"
          type="number"
          min="0"
          max="100"
          required
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          placeholder="e.g. 75"
        />
      </form>
    </Modal>
  );
}
