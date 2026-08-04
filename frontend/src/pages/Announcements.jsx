import { useState, useEffect, useMemo } from 'react';
import { Megaphone, Send, Trash2, Building2, Layers3 } from 'lucide-react';
import announcementService from '../services/announcementService';
import batchService from '../services/batchService';
import { getAllInstitutions } from '../services/institutionService';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Field';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const initialForm = { title: '', message: '', institutionId: '', scope: 'institution', batchId: '' };

export default function Announcements() {
  const [institutions, setInstitutions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const fetchInstitutions = async () => {
    try {
      const data = await getAllInstitutions();
      setInstitutions(data);
      if (data.length === 1) setForm((f) => ({ ...f, institutionId: data[0].id }));
    } catch (err) {
      console.error('Institution fetch error:', err);
    }
  };

  const fetchBatches = async (institutionId) => {
    try {
      const data = await batchService.getAll(institutionId ? { institution: institutionId } : {});
      setBatches(data);
    } catch (err) {
      console.error('Batch fetch error:', err);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.list();
      setAnnouncements(data);
    } catch (err) {
      console.error('Announcement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
    fetchBatches();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    fetchBatches(form.institutionId || undefined);
  }, [form.institutionId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const scopeLabel = (a) => (a.batch ? `Batch: ${a.batch_name}` : 'Institution-wide');

  const stats = useMemo(() => ({
    total: announcements.length,
    batchScoped: announcements.filter((a) => a.batch).length,
  }), [announcements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return setError('Title and message are required.');
    if (institutions.length > 1 && !form.institutionId) return setError('Choose an institution.');
    if (form.scope === 'batch' && !form.batchId) return setError('Choose a batch.');

    setSending(true);
    setError('');
    try {
      const res = await announcementService.create({
        title: form.title.trim(),
        message: form.message.trim(),
        institution_id: form.institutionId || institutions[0]?.id,
        batch_id: form.scope === 'batch' ? form.batchId : null,
      });
      toast.success(res.message || 'Announcement sent.');
      setForm((f) => ({ ...initialForm, institutionId: f.institutionId }));
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send announcement.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await announcementService.remove(deleteTarget.id);
      toast.success('Announcement deleted.');
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Announcements"
          subtitle="Broadcast a message to your students and educators"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <Card padding="p-5" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center shrink-0">
              <Megaphone size={18} className="text-brand-700" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ink leading-none">{stats.total}</p>
              <p className="text-xs text-ink-faint mt-1">Sent total</p>
            </div>
          </Card>
          <Card padding="p-5" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ocean-600/10 flex items-center justify-center shrink-0">
              <Layers3 size={18} className="text-ocean-700" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ink leading-none">{stats.batchScoped}</p>
              <p className="text-xs text-ink-faint mt-1">Batch-scoped</p>
            </div>
          </Card>
        </div>

        <Card padding="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" required value={form.title} onChange={set('title')} placeholder="e.g. Exam schedule update" />
            <Textarea label="Message" required rows={4} value={form.message} onChange={set('message')} placeholder="What do you want to tell them?" />

            <div className="grid sm:grid-cols-2 gap-4">
              {institutions.length > 1 && (
                <Select label="Institution" required value={form.institutionId} onChange={set('institutionId')}>
                  <option value="">Select institution…</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </Select>
              )}

              <Select label="Audience" value={form.scope} onChange={set('scope')}>
                <option value="institution">Everyone (institution-wide)</option>
                <option value="batch">One batch only</option>
              </Select>

              {form.scope === 'batch' && (
                <Select label="Batch" required value={form.batchId} onChange={set('batchId')}>
                  <option value="">Select batch…</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              )}
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" variant="brand" size="md" icon={Send} disabled={sending}>
                {sending ? 'Sending…' : 'Send announcement'}
              </Button>
            </div>
          </form>
        </Card>

        <Card padding="p-0" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/[0.06]">
            <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">History</p>
          </div>

          {loading ? (
            <div className="p-6"><SkeletonRows rows={4} /></div>
          ) : announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements sent yet" />
          ) : (
            <div className="divide-y divide-ink/[0.06]">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink truncate">{a.title}</p>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-ink/[0.05] text-ink-faint">
                        {a.batch ? <Layers3 size={10} /> : <Building2 size={10} />}
                        {scopeLabel(a)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-soft mt-1 line-clamp-2">{a.message}</p>
                    <p className="text-[11px] text-ink-faint mt-1.5">
                      {a.created_by_name} · {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors shrink-0"
                    aria-label="Delete announcement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete announcement"
        message={deleteTarget ? `Delete "${deleteTarget.title}"? This only removes the record — it won't un-notify recipients.` : ''}
        loading={deleting}
      />
    </div>
  );
}
