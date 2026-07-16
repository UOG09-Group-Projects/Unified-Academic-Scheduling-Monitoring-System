import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, BookOpen, GraduationCap } from 'lucide-react';
import CourseForm from "./CourseForm";
import CourseTable from "./CourseTable";
import courseService from "../../services/courseService";
import lookupService from "../../services/lookupService";
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import StatCard from '../StatCard';
import { SkeletonRows } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { usePermissions } from '../../auth/PermissionsContext';

export default function CoursePage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const { can } = usePermissions();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allEducators, setAllEducators] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    lookupService.listInstitutions()
      .then((data) => setInstitutions(data))
      .catch(() => toast.error('Failed to load institutions.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = user?.institution_id ? { institution_id: user.institution_id } : {};

    Promise.all([
      lookupService.listBatches(params),
      lookupService.listEducators(params),
    ])
      .then(([batches, educators]) => {
        setAllBatches(batches);
        setAllEducators(educators);
      })
      .catch(() => toast.error('Failed to load form data.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.institution_id]);

  useEffect(() => {
    let ignore = false;

    async function loadCourses() {
      setLoading(true);
      try {
        const data = await courseService.list(search);
        if (!ignore) setCourses(data);
      } catch {
        if (!ignore) toast.error('Failed to load courses.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadCourses();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const refetchCourses = async () => {
    try {
      const data = await courseService.list(search);
      setCourses(data);
    } catch {
      toast.error('Failed to refresh course list.');
    }
  };

  const stats = useMemo(() => ({
    total: courses.length,
    educators: courses.reduce((sum, c) => sum + (c.educator_count || 0), 0),
  }), [courses]);

  const openCreate = () => {
    setSelectedCourse(null);
    setFormOpen(true);
  };

  const openEdit = (course) => {
    setSelectedCourse(course);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedCourse(null);
  };

  const handleInsert = async (payload) => {
    try {
      await courseService.create({ ...payload, institution: user.institution_id });
      toast.success('Course created successfully!');
      await refetchCourses();
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Insert failed.');
    }
  };

  const handleUpdate = async (id, payload) => {
    if (!id) return toast.error('Select a course to update.');
    try {
      await courseService.update(id, { ...payload, institution: user.institution_id });
      toast.success('Course updated successfully!');
      await refetchCourses();
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await courseService.remove(deleteTarget.id);
      toast.success('Course deleted.');
      setDeleteTarget(null);
      await refetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Course management"
          subtitle="Courses offered, with their assigned batches and educators"
          actions={can('create_course') && (
            <Button variant="brand" size="md" icon={Plus} onClick={openCreate}>
              Add course
            </Button>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total courses" value={stats.total} tone="brand" icon={BookOpen} />
          <StatCard label="Educator assignments" value={stats.educators} tone="ocean" icon={GraduationCap} />
        </div>

        <Card padding="p-0" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/[0.06] flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">Course list</p>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or code…"
                className="w-full pl-8 pr-3.5 py-2 border border-ink/10 rounded-lg text-sm outline-none
                           focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6"><SkeletonRows rows={5} /></div>
          ) : (
            <CourseTable
              courses={courses}
              onEdit={can('edit_course') ? openEdit : null}
              onView={setViewCourse}
              onDelete={can('delete_course') ? setDeleteTarget : null}
            />
          )}
        </Card>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={selectedCourse ? 'Edit course' : 'Add course'}
        width="max-w-xl"
      >
        <CourseForm
          key={`${selectedCourse?.id ?? 'new'}-${allBatches.length}-${allEducators.length}`}
          selectedCourse={selectedCourse}
          institutions={institutions}
          allBatches={allBatches}
          allEducators={allEducators}
          onInsert={handleInsert}
          onUpdate={handleUpdate}
          onCancel={closeForm}
        />
      </Modal>

      <Modal
        open={Boolean(viewCourse)}
        onClose={() => setViewCourse(null)}
        title={viewCourse?.name}
        width="max-w-md"
        footer={<Button variant="outline" size="md" onClick={() => setViewCourse(null)}>Close</Button>}
      >
        {viewCourse && (
          <>
            <p className="text-sm text-ink-faint mb-4">
              Code: {viewCourse.code} | {viewCourse.institution_name}
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-ink mb-1.5">Batches</p>
              <div className="flex flex-wrap gap-1.5">
                {viewCourse.batches.map((b) => <Badge key={b.id} tone="brand">{b.batch_name}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-ink mb-1.5">Educators</p>
              <div className="flex flex-wrap gap-1.5">
                {viewCourse.educators.map((e) => <Badge key={e.id} tone="success">{e.educator_name}</Badge>)}
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete course"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This removes all batch and educator assignments.` : ''}
        loading={deleting}
      />
    </div>
  );
}
