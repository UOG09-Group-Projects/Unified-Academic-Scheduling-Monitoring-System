import { useState, useEffect, useMemo } from 'react';
import { Plus, Building2, UserCircle2, KeyRound, Copy, RefreshCw, CalendarRange } from 'lucide-react';
import InstitutionForm from './InstitutionForm';
import InstitutionTable from './InstitutionTable';
import {
  getAllInstitutions, deleteInstitution, setInstitutionStatus,
  getJoinCode, regenerateJoinCode, getSemester, updateSemester,
} from '../../services/institutionService';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import StatCard from '../StatCard';
import { Input } from '../ui/Field';
import { SkeletonRows } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { usePermissions } from '../../auth/PermissionsContext';

const CAN_MANAGE_ROLES = ['SUPER_ADMIN', 'OWNER', 'MANAGER'];
const JOIN_CODE_ROLES = ['OWNER', 'MANAGER'];

const InstitutionPage = () => {
  const { user } = usePermissions();
  const role = user?.role?.toUpperCase?.();
  const canManage = CAN_MANAGE_ROLES.includes(role);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const canViewJoinCode = JOIN_CODE_ROLES.includes(role);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [joinCode, setJoinCode] = useState(null);
  const [regenerateTarget, setRegenerateTarget] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [semesterForm, setSemesterForm] = useState({ semester_start: '', semester_end: '' });
  const [savingSemester, setSavingSemester] = useState(false);
  const toast = useToast();

  const fetchJoinCode = async () => {
    if (!canViewJoinCode) return;
    try {
      const data = await getJoinCode();
      setJoinCode(data.join_code);
    } catch (err) {
      console.error('Join code fetch error:', err);
    }
  };

  const fetchSemester = async () => {
    if (!canViewJoinCode) return;
    try {
      const data = await getSemester();
      setSemesterForm({
        semester_start: data.semester_start || '',
        semester_end: data.semester_end || '',
      });
    } catch (err) {
      console.error('Semester fetch error:', err);
    }
  };

  const handleSaveSemester = async (e) => {
    e.preventDefault();
    setSavingSemester(true);
    try {
      await updateSemester(semesterForm.semester_start, semesterForm.semester_end);
      toast.success('Semester dates saved.');
    } catch (err) {
      toast.error('Could not save semester dates: ' + err.message);
    } finally {
      setSavingSemester(false);
    }
  };

  const handleCopyJoinCode = async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      toast.success('Join code copied.');
    } catch {
      toast.error('Could not copy join code.');
    }
  };

  const handleRegenerateJoinCode = async () => {
    setRegenerating(true);
    try {
      const data = await regenerateJoinCode();
      setJoinCode(data.join_code);
      toast.success('Join code regenerated.');
      setRegenerateTarget(false);
    } catch (err) {
      toast.error('Regenerate failed: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const data = await getAllInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
    fetchJoinCode();
    fetchSemester();
  }, []);

  const stats = useMemo(() => {
    const owners = new Set(institutions.map((i) => i.owner?.id));
    return { total: institutions.length, owners: owners.size };
  }, [institutions]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (inst) => {
    setEditing(inst);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleFormSuccess = () => {
    fetchInstitutions();
    closeForm();
  };

  const handleApprove = async (inst) => {
    try {
      await setInstitutionStatus(inst.id, 'APPROVED');
      toast.success(`${inst.name} approved.`);
      fetchInstitutions();
    } catch (err) {
      toast.error('Approve failed: ' + err.message);
    }
  };

  const handleReject = async (inst) => {
    try {
      await setInstitutionStatus(inst.id, 'REJECTED');
      toast.success(`${inst.name} rejected.`);
      fetchInstitutions();
    } catch (err) {
      toast.error('Reject failed: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInstitution(deleteTarget.id);
      toast.success('Institution deleted.');
      setDeleteTarget(null);
      fetchInstitutions();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Institution management"
          subtitle="Institutes registered on the platform and their owners"
          actions={isSuperAdmin && (
            <Button variant="brand" size="md" icon={Plus} onClick={openCreate}>
              Add institution
            </Button>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total institutions" value={stats.total} tone="brand" icon={Building2} />
          <StatCard label="Institution owners" value={stats.owners} tone="ocean" icon={UserCircle2} />
        </div>

        {canViewJoinCode && (
          <Card padding="p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center shrink-0">
                  <KeyRound size={18} className="text-brand-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Student join code</p>
                  <p className="text-xs text-ink-faint">
                    Share this with your students — they enter it when signing up.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 rounded-lg bg-ink/[0.04] text-sm font-mono tracking-widest text-ink">
                  {joinCode || '········'}
                </code>
                <Button variant="ghost" size="sm" icon={Copy} onClick={handleCopyJoinCode} disabled={!joinCode}>
                  Copy
                </Button>
                <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => setRegenerateTarget(true)}>
                  Regenerate
                </Button>
              </div>
            </div>
          </Card>
        )}

        {canViewJoinCode && (
          <Card padding="p-6">
            <form onSubmit={handleSaveSemester} className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ocean-600/10 flex items-center justify-center shrink-0">
                  <CalendarRange size={18} className="text-ocean-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Semester dates</p>
                  <p className="text-xs text-ink-faint">
                    Bounds how far the timetable projects onto everyone's calendar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="date"
                  value={semesterForm.semester_start}
                  onChange={(e) => setSemesterForm((prev) => ({ ...prev, semester_start: e.target.value }))}
                  wrapperClassName="w-40"
                  required
                />
                <span className="text-ink-faint text-sm">to</span>
                <Input
                  type="date"
                  value={semesterForm.semester_end}
                  onChange={(e) => setSemesterForm((prev) => ({ ...prev, semester_end: e.target.value }))}
                  wrapperClassName="w-40"
                  required
                />
                <Button type="submit" variant="brand" size="sm" disabled={savingSemester}>
                  {savingSemester ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card padding="p-0" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/[0.06]">
            <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">Institution list</p>
          </div>

          {loading ? (
            <div className="p-6"><SkeletonRows rows={5} /></div>
          ) : (
            <InstitutionTable
              institutions={institutions}
              onEdit={canManage ? openEdit : null}
              onDelete={canManage ? (inst) => setDeleteTarget(inst) : null}
              onApprove={isSuperAdmin ? handleApprove : null}
              onReject={isSuperAdmin ? handleReject : null}
            />
          )}
        </Card>
      </div>

      {canManage && (
        <Modal
          open={formOpen}
          onClose={closeForm}
          title={editing ? 'Edit institution' : 'Add institution'}
          width="max-w-xl"
        >
          <InstitutionForm
            key={editing?.id ?? 'new'}
            selectedInstitution={editing}
            onSuccess={handleFormSuccess}
            onCancel={closeForm}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete institution"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"?` : ''}
        loading={deleting}
      />

      <ConfirmDialog
        open={regenerateTarget}
        onClose={() => setRegenerateTarget(false)}
        onConfirm={handleRegenerateJoinCode}
        title="Regenerate join code"
        message="The current join code will stop working immediately — anyone mid-signup with the old code won't be able to complete it. Continue?"
        loading={regenerating}
      />
    </div>
  );
};

export default InstitutionPage;
