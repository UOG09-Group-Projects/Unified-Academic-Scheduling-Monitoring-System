import { useEffect, useState } from 'react';
import { Search, Check, Plus, BookOpen } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import enrollmentService from '../../services/enrollmentService';
import { useToast } from '../ui/Toast';

export default function EnrollCoursesModal({ open, onClose, onEnrolled }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    setLoading(true);

    enrollmentService.listAvailableCourses()
      .then((data) => { if (!ignore) setCourses(data); })
      .catch(() => { if (!ignore) toast.error('Failed to load available courses.'); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [open]);

  const handleEnroll = async (course) => {
    setEnrollingId(course.id);
    try {
      await enrollmentService.enroll(course.id);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, is_enrolled: true } : c)));
      toast.success(`Enrolled in ${course.code}.`);
      onEnrolled?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not enroll in this course.');
    } finally {
      setEnrollingId(null);
    }
  };

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Browse courses"
      width="max-w-lg"
      footer={<Button variant="outline" size="md" onClick={onClose}>Close</Button>}
    >
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses…"
          className="w-full pl-8 pr-3 py-2.5 border border-ink/10 rounded-lg text-sm outline-none
                     focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
        />
      </div>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" message="Your institution doesn't offer any courses matching that search yet." />
      ) : (
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto scroll-thin">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-ink/[0.06] hover:border-brand-200 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{course.name}</p>
                <p className="text-xs text-ink-faint">{course.code} · {course.institution_name}</p>
              </div>

              {course.is_enrolled ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success shrink-0">
                  <Check size={13} /> Enrolled
                </span>
              ) : (
                <Button
                  variant="brand"
                  size="sm"
                  icon={Plus}
                  disabled={enrollingId === course.id}
                  onClick={() => handleEnroll(course)}
                  className="shrink-0"
                >
                  {enrollingId === course.id ? 'Enrolling…' : 'Enroll'}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
