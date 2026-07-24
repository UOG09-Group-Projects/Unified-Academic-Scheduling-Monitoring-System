import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Plus, Pencil, Trash2, Target, ClipboardList } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import ActivityFormModal from './ActivityFormModal';
import SetProgressModal from './SetProgressModal';
import activityService from '../../services/activityService';
import { useToast } from '../ui/Toast';

export default function EducatorCourseActivities({ courseId, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [progressActivity, setProgressActivity] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    activityService.listForCourse(courseId)
      .then(setActivities)
      .catch(() => toast.error('Failed to load activities.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await activityService.update(editing.id, form);
        toast.success('Activity updated.');
      } else {
        await activityService.create({ ...form, course_id: courseId });
        toast.success('Activity created.');
      }
      setFormOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save activity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await activityService.remove(deleteTarget.id);
      toast.success('Activity deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete activity.');
    }
  };

  return (
    <div className="border-t border-ink/[0.06] mt-2 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
      >
        <ChevronDown size={13} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
        Activities
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <div className="flex justify-end mb-2">
                <Button variant="outline" size="sm" icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
                  Add activity
                </Button>
              </div>

              {loading ? (
                <SkeletonRows rows={2} />
              ) : activities.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No activities yet" />
              ) : (
                <div className="flex flex-col gap-2">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-ink/[0.02]">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate flex items-center gap-1.5">
                          {a.name}
                          {a.optional && <Badge tone="neutral">Optional</Badge>}
                        </p>
                        {a.due_date && <p className="text-xs text-ink-faint">Due {a.due_date}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setProgressActivity(a)} className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-brand-700 hover:bg-brand-50 transition-colors" title="Set progress">
                          <Target size={13} />
                        </button>
                        <button onClick={() => { setEditing(a); setFormOpen(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-ink/[0.05] transition-colors" title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ActivityFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing}
        saving={saving}
      />

      <SetProgressModal
        open={Boolean(progressActivity)}
        onClose={() => setProgressActivity(null)}
        activity={progressActivity}
        courseId={courseId}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this activity?"
        message={deleteTarget ? `"${deleteTarget.name}" and its progress records will be removed.` : ''}
      />
    </div>
  );
}
