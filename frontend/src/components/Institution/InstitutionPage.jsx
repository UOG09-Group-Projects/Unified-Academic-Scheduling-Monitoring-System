import { useState, useEffect, useMemo } from 'react';
import { Plus, Building2, UserCircle2 } from 'lucide-react';
import InstitutionForm from './InstitutionForm';
import InstitutionTable from './InstitutionTable';
import { getAllInstitutions, deleteInstitution, setInstitutionStatus } from '../../services/institutionService';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import StatCard from '../StatCard';
import { SkeletonRows } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { usePermissions } from '../../auth/PermissionsContext';

const CAN_MANAGE_ROLES = ['SUPER_ADMIN', 'OWNER', 'MANAGER'];

const InstitutionPage = () => {
  const { user } = usePermissions();
  const canManage = CAN_MANAGE_ROLES.includes(user?.role?.toUpperCase?.());
  const isSuperAdmin = user?.role?.toUpperCase?.() === 'SUPER_ADMIN';
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

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
          actions={canManage && (
            <Button variant="brand" size="md" icon={Plus} onClick={openCreate}>
              Add institution
            </Button>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total institutions" value={stats.total} tone="brand" icon={Building2} />
          <StatCard label="Institution owners" value={stats.owners} tone="ocean" icon={UserCircle2} />
        </div>

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
    </div>
  );
};

export default InstitutionPage;
