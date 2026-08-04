import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import timetableService from '../services/timetableService';
import batchService from '../services/batchService';
import courseService from '../services/courseService';
import { getSemester } from '../services/institutionService';
import { usePermissions } from '../auth/PermissionsContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Input, Select } from '../components/ui/Field';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const MANAGE_ROLES = ['OWNER', 'MANAGER'];

const WEEKDAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

function formatTime(t) {
  // "09:00:00" -> "09:00"
  return (t || '').slice(0, 5);
}

const emptyForm = { course_id: '', educator_id: '', weekday: 0, start_time: '', end_time: '' };

export default function TimetablePage() {
  const { user } = usePermissions();
  const toast = useToast();
  const role = user?.role?.toUpperCase?.();
  const canManage = MANAGE_ROLES.includes(role);

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterSet, setSemesterSet] = useState(true); // assume set until we hear otherwise, avoids a flash

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // OWNER/MANAGER: load batches + courses once, default to the first batch.
  useEffect(() => {
    if (!canManage) return;
    Promise.all([batchService.getAll(), courseService.list()])
      .then(([batchData, courseData]) => {
        setBatches(batchData);
        setCourses(courseData);
        if (batchData.length > 0) setSelectedBatchId(batchData[0].id);
      })
      .catch(() => toast.error('Could not load batches/courses.'));
    getSemester()
      .then((data) => setSemesterSet(Boolean(data.semester_start && data.semester_end)))
      .catch(() => {});
  }, [canManage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await timetableService.list(canManage ? selectedBatchId : null);
      setSlots(data);
    } catch {
      toast.error('Could not load the timetable.');
    } finally {
      setLoading(false);
    }
  }, [canManage, selectedBatchId, toast]);

  useEffect(() => {
    if (canManage && !selectedBatchId) return; // wait for batches to load first
    fetchSlots();
  }, [canManage, selectedBatchId, fetchSlots]);

  const byWeekday = useMemo(() => {
    const grouped = WEEKDAYS.map(() => []);
    for (const slot of slots) grouped[slot.weekday]?.push(slot);
    return grouped;
  }, [slots]);

  const coursesForBatch = useMemo(() => {
    if (!selectedBatchId) return [];
    return courses.filter((c) => c.batches?.some((b) => b.batch === selectedBatchId));
  }, [courses, selectedBatchId]);

  const educatorsForCourse = useMemo(() => {
    const course = coursesForBatch.find((c) => c.id === Number(form.course_id));
    return course?.educators || [];
  }, [coursesForBatch, form.course_id]);

  const openForm = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'course_id' ? { educator_id: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await timetableService.create({
        batch_id: selectedBatchId,
        course_id: form.course_id,
        educator_id: form.educator_id,
        weekday: Number(form.weekday),
        start_time: form.start_time,
        end_time: form.end_time,
      });
      toast.success('Timetable slot added.');
      setFormOpen(false);
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add this slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await timetableService.remove(deleteTarget.id);
      toast.success('Slot removed.');
      setDeleteTarget(null);
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not remove this slot.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Timetable"
          subtitle={canManage ? 'Build each batch\'s weekly schedule' : 'Your weekly schedule'}
          actions={canManage && (
            <div className="flex items-center gap-3">
              <Select
                value={selectedBatchId || ''}
                onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                wrapperClassName="w-48"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
              <Button variant="brand" size="md" icon={Plus} onClick={openForm} disabled={!selectedBatchId}>
                Add slot
              </Button>
            </div>
          )}
        />

        {canManage && !semesterSet && (
          <div className="px-4 py-3 rounded-xl bg-ocean-600/10 text-ocean-800 text-sm">
            Set your semester dates on the{' '}
            <Link to="/institutions" className="underline font-medium">Institutions page</Link>{' '}
            so this timetable shows up on everyone's calendar.
          </div>
        )}

        <Card padding="p-4" className="overflow-x-auto">
          {loading ? (
            <SkeletonRows rows={5} />
          ) : canManage && batches.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-8">No batches yet — create one first.</p>
          ) : (
            <div className="grid grid-cols-7 gap-3 min-w-[900px]">
              {WEEKDAYS.map((day) => (
                <div key={day.value} className="min-w-[120px]">
                  <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase mb-2 text-center">
                    {day.label}
                  </p>
                  <div className="space-y-2">
                    {byWeekday[day.value].length === 0 ? (
                      <p className="text-xs text-ink-faint/60 text-center py-3">—</p>
                    ) : (
                      byWeekday[day.value].map((slot) => (
                        <div key={slot.id} className="rounded-xl bg-ink/[0.04] px-3 py-2 text-xs">
                          <p className="font-semibold text-ink">{formatTime(slot.start_time)}–{formatTime(slot.end_time)}</p>
                          <p className="text-ink-soft truncate">{slot.course_name}</p>
                          <p className="text-ink-faint truncate">
                            {canManage || role === 'STUDENT' ? slot.educator_name : slot.batch_name}
                          </p>
                          {canManage && (
                            <button
                              onClick={() => setDeleteTarget(slot)}
                              className="mt-1 text-danger/70 hover:text-danger"
                              title="Remove slot"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add timetable slot" width="max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select label="Course" name="course_id" value={form.course_id} onChange={handleFormChange} required>
            <option value="" disabled>Select a course</option>
            {coursesForBatch.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Select
            label="Educator"
            name="educator_id"
            value={form.educator_id}
            onChange={handleFormChange}
            required
            disabled={!form.course_id}
          >
            <option value="" disabled>
              {form.course_id ? 'Select an educator' : 'Pick a course first'}
            </option>
            {educatorsForCourse.map((e) => (
              <option key={e.educator} value={e.educator}>{e.educator_name}</option>
            ))}
          </Select>

          <Select label="Day" name="weekday" value={form.weekday} onChange={handleFormChange} required>
            {WEEKDAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Start time" type="time" name="start_time" value={form.start_time} onChange={handleFormChange} required />
            <Input label="End time" type="time" name="end_time" value={form.end_time} onChange={handleFormChange} required />
          </div>

          <Button type="submit" variant="brand" size="md" disabled={saving} className="w-full mt-1">
            {saving ? 'Adding…' : 'Add slot'}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove timetable slot"
        message={deleteTarget ? `Remove ${deleteTarget.course_name} on ${WEEKDAYS[deleteTarget.weekday]?.label}?` : ''}
        loading={deleting}
      />
    </div>
  );
}
