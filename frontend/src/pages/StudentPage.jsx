import { useState, useEffect, useMemo } from 'react';
import { Plus, GraduationCap, Layers3, UploadCloud } from 'lucide-react';
import StudentForm from "../components/StudentForm";
import StudentTable from '../components/StudentTable';
import ViewStudentModal from '../components/ViewStudentModal';
import CsvImportModal from '../components/CsvImportModal';
import studentService from "../services/studentService";
import batchService from '../services/batchService';
import { getAllInstitutions } from '../services/institutionService';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Field';
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
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pendingStudents, setPendingStudents] = useState([]);
  const [pendingActionId, setPendingActionId] = useState(null);
  const [pendingBatchChoice, setPendingBatchChoice] = useState({});

  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const toast = useToast();

  const fetchBatches = async () => {
    try {
      const data = await batchService.getAll();
      setBatches(data);
    } catch (err) {
      console.error('Batch fetch error:', err);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const data = await getAllInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error('Institution fetch error:', err);
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

  const fetchPending = async () => {
    try {
      const data = await studentService.listPending();
      setPendingStudents(data);
    } catch {
      // OWNER/MANAGER-only endpoint — silently skip for other roles.
      setPendingStudents([]);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchInstitutions();
    fetchStudents();
    fetchPending();
  }, []);

  const handleApprove = async (student) => {
    setPendingActionId(student.id);
    try {
      await studentService.approve(student.id, pendingBatchChoice[student.id] || null);
      toast.success(`${student.name} approved.`);
      setPendingBatchChoice((prev) => {
        const next = { ...prev };
        delete next[student.id];
        return next;
      });
      fetchPending();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleReject = async (student) => {
    setPendingActionId(student.id);
    try {
      await studentService.reject(student.id);
      toast.success(`${student.name} rejected.`);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rejection failed');
    } finally {
      setPendingActionId(null);
    }
  };

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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" icon={UploadCloud} onClick={() => setImportOpen(true)}>
                Import CSV
              </Button>
              <Button variant="brand" size="md" icon={Plus} onClick={openCreate}>
                Add student
              </Button>
            </div>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total students" value={stats.total} tone="brand" icon={GraduationCap} />
          <StatCard label="Batches covered" value={stats.batches} tone="ocean" icon={Layers3} />
        </div>

        {pendingStudents.length > 0 && (
          <Card padding="p-0" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/[0.06]">
              <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">
                Pending approval ({pendingStudents.length})
              </p>
            </div>
            <div className="divide-y divide-ink/[0.06]">
              {pendingStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between px-6 py-3 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{student.name}</p>
                    <p className="text-xs text-ink-faint truncate">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      wrapperClassName="w-44"
                      value={pendingBatchChoice[student.id] || ''}
                      onChange={(e) =>
                        setPendingBatchChoice((prev) => ({ ...prev, [student.id]: e.target.value }))
                      }
                    >
                      <option value="">No batch yet</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                      ))}
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingActionId === student.id}
                      onClick={() => handleReject(student)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="brand"
                      size="sm"
                      disabled={pendingActionId === student.id}
                      onClick={() => handleApprove(student)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

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

      <CsvImportModal
        open={importOpen}
        onClose={() => { setImportOpen(false); fetchStudents(); fetchPending(); }}
        title="Import students"
        helpText="Columns: name, email, phone (optional), registration_no (optional — auto-assigned if left blank)."
        templateHeaders={['name', 'email', 'phone', 'registration_no']}
        institutions={institutions}
        showBatchSelect
        batches={batches}
        onSubmit={(file, { institutionId, batchId }) =>
          studentService.bulkImport(file, { institutionId, batchId })
        }
      />

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
