import { useState, useEffect, useMemo } from 'react';
import { Plus, GraduationCap, Layers3 } from 'lucide-react';
import StudentForm from "../components/StudentForm";
import StudentTable from '../components/StudentTable';
import ViewStudentModal from '../components/ViewStudentModal';
import studentService from "../services/studentService";
import batchService from '../services/batchService';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/StatCard';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { usePermissions } from '../auth/PermissionsContext';

const StudentPage = () => {
  const { can } = usePermissions();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const fetchBatches = async () => {
    try {
      const data = await batchService.getAll();
      setBatches(data);
    } catch (err) {
      console.error('Batch fetch error:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.list();
      setStudents(data);
    } catch (err) {
      console.error('Student fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchStudents();
  }, []);

  const stats = useMemo(() => {
    const batchIds = new Set(students.map((s) => s.batch_name).filter(Boolean));
    return { total: students.length, batches: batchIds.size };
  }, [students]);

  const openCreate = () => {
    setSelectedStudent(null);
    setFormOpen(true);
  };

  const openEdit = (student) => {
    setSelectedStudent(student);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedStudent(null);
  };

  const handleInsert = async (payload) => {
    try {
      await studentService.create(payload);
      toast.success('Student created.');
      fetchStudents();
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Insert failed');
    }
  };

  const handleUpdate = async (id, payload) => {
    if (!id) return toast.error('Select a student first');
    try {
      await studentService.update(id, payload);
      toast.success('Student updated.');
      fetchStudents();
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studentService.remove(deleteTarget.id);
      toast.success('Student deleted.');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleView = async (student) => {
    try {
      const full = await studentService.getById(student.id);
      setViewStudent(full);
    } catch {
      toast.error('Failed to load student details');
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Student management"
          subtitle="Enrolled students and their guardians"
          actions={can('create_student') && (
            <Button variant="brand" size="md" icon={Plus} onClick={openCreate}>
              Add student
            </Button>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total students" value={stats.total} tone="brand" icon={GraduationCap} />
          <StatCard label="Batches covered" value={stats.batches} tone="ocean" icon={Layers3} />
        </div>

        <Card padding="p-0" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/[0.06]">
            <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">Student list</p>
          </div>

          {loading ? (
            <div className="p-6"><SkeletonRows rows={5} /></div>
          ) : (
            <StudentTable
              students={students}
              onEdit={can('edit_student') ? openEdit : null}
              onView={handleView}
              onDelete={can('delete_student') ? setDeleteTarget : null}
            />
          )}
        </Card>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={selectedStudent ? 'Edit student' : 'Add student'}
        width="max-w-2xl"
      >
        <StudentForm
          key={selectedStudent?.id ?? 'new'}
          selectedStudent={selectedStudent}
          batches={batches}
          onInsert={handleInsert}
          onUpdate={handleUpdate}
          onCancel={closeForm}
        />
      </Modal>

      <ViewStudentModal student={viewStudent} onClose={() => setViewStudent(null)} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete student"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? Their login account will also be deactivated.` : ''}
        loading={deleting}
      />
    </div>
  );
};

export default StudentPage;
