import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarPlus, X, ClipboardList } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import ConfirmDialog from '../ui/ConfirmDialog';
import EnrollCoursesModal from './EnrollCoursesModal';
import enrollmentService from '../../services/enrollmentService';
import { useToast } from '../ui/Toast';

export default function EnrollmentList({ enrollments, onChange }) {
  const [browseOpen, setBrowseOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState(null);
  const [dropping, setDropping] = useState(false);
  const toast = useToast();

  const handleUnenroll = async () => {
    if (!dropTarget) return;
    setDropping(true);
    try {
      await enrollmentService.unenroll(dropTarget.id);
      toast.success(`Unenrolled from ${dropTarget.course.code}.`);
      setDropTarget(null);
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not unenroll.');
    } finally {
      setDropping(false);
    }
  };

  return (
    <>
      <Card padding="p-0" className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/[0.06]">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <ClipboardList size={15} className="text-ink-faint" />
            My enrollments
          </h2>
          <Button variant="brand" size="sm" icon={CalendarPlus} onClick={() => setBrowseOpen(true)}>
            Enroll in a course
          </Button>
        </div>

        {enrollments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No enrollments yet"
            message="Browse your institution's courses and enroll to get started."
            action={
              <Button variant="outline" size="sm" icon={CalendarPlus} onClick={() => setBrowseOpen(true)}>
                Browse courses
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-ink/[0.05]">
            <AnimatePresence initial={false}>
              {enrollments.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{e.course.name}</p>
                    <p className="text-xs text-ink-faint">
                      {e.course.code} · Enrolled {new Date(e.enrolled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone="brand">{e.course.code}</Badge>
                    <button
                      onClick={() => setDropTarget(e)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors"
                      title="Unenroll"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>

      <EnrollCoursesModal
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onEnrolled={onChange}
      />

      <ConfirmDialog
        open={Boolean(dropTarget)}
        onClose={() => setDropTarget(null)}
        onConfirm={handleUnenroll}
        title="Unenroll from this course?"
        message={dropTarget ? `You'll be removed from "${dropTarget.course.name}".` : ''}
        confirmLabel="Unenroll"
        loading={dropping}
      />
    </>
  );
}
