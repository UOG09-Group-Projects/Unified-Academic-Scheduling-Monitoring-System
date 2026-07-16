// src/pages/BatchManagement.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Layers3, Building2 } from "lucide-react";
import { batchService } from "../services/batchService";
import { getAllInstitutions } from "../services/institutionService";
import BatchTable from "../components/BatchTable";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatCard from "../components/StatCard";
import { Input, Select } from "../components/ui/Field";
import { SkeletonRows } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { usePermissions } from "../auth/PermissionsContext";

const initialForm = { name: "", institution: "" };

export default function BatchManagement() {
  const { can } = usePermissions();
  const toast = useToast();

  const [batches, setBatches] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const triggerRefresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  useEffect(() => {
    getAllInstitutions()
      .then(setInstitutions)
      .catch((err) => console.error("Failed to load institutions:", err));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBatches = async () => {
      setLoading(true);
      try {
        const data = await batchService.getAll({ search });
        if (!cancelled) setBatches(data);
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Failed to load batches.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBatches();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, refreshKey]);

  const stats = useMemo(() => {
    const institutionIds = new Set(batches.map((b) => b.institution));
    return {
      total: batches.length,
      institutions: institutionIds.size,
    };
  }, [batches]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (batch) => {
    setEditingId(batch.id);
    setForm({ name: batch.name, institution: batch.institution });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.institution) {
      setFormError("Batch name and institution are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await batchService.update(editingId, form);
        toast.success("Batch updated.");
      } else {
        await batchService.create(form);
        toast.success("Batch created.");
      }
      closeForm();
      triggerRefresh();
    } catch (err) {
      setFormError(err.message || "Failed to save batch.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await batchService.delete(deleteTarget.id);
      toast.success("Batch deleted.");
      setDeleteTarget(null);
      triggerRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete batch.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Batch management"
          subtitle="Organize students into batches within each institution"
          actions={can('create_batch') && (
            <Button variant="brand" size="md" icon={Plus} onClick={openCreate}>
              Add batch
            </Button>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total batches" value={stats.total} tone="brand" icon={Layers3} />
          <StatCard label="Institutions covered" value={stats.institutions} tone="ocean" icon={Building2} />
        </div>

        <Card padding="p-0" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/[0.06] flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">Batch list</p>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2 border border-ink/10 rounded-lg text-sm outline-none
                           focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6"><SkeletonRows rows={5} /></div>
          ) : (
            <BatchTable
              batches={batches}
              onEdit={can('edit_batch') ? openEdit : null}
              onDelete={can('delete_batch') ? setDeleteTarget : null}
            />
          )}
        </Card>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Edit batch" : "Add batch"}
        footer={(
          <>
            <Button variant="outline" size="md" onClick={closeForm}>Cancel</Button>
            <Button variant="brand" size="md" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create batch"}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <Input
            label="Batch name"
            required
            placeholder="e.g. 2026 Morning Batch"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Institution"
            required
            value={form.institution}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
          >
            <option value="">Select institution…</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </Select>
          {formError && <p className="text-sm text-danger">{formError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete batch?"
        message={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : ""}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
