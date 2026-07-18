import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, Send, HelpCircle } from 'lucide-react';
import complaintService from '../services/complaintService';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const TYPE_BADGE = {
  COMPLAINT: { tone: 'danger', label: 'Complaint' },
  HELP:      { tone: 'brand',  label: 'Help Request' },
};

const STATUS_BADGE = {
  OPEN:        { tone: 'warning', label: 'Open' },
  IN_PROGRESS: { tone: 'accent',  label: 'In Progress' },
  RESOLVED:    { tone: 'success', label: 'Resolved' },
};

export default function HelpPage() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ type: 'HELP', subject: '', message: '' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await complaintService.list();
        if (!ignore) setMessages(data);
      } catch {
        if (!ignore) toast.error('Failed to load your messages.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [reloadKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in both subject and message.');
      return;
    }
    setSubmitting(true);
    try {
      await complaintService.create(form);
      toast.success('Message submitted. The super admin will get back to you.');
      setForm({ type: 'HELP', subject: '', message: '' });
      setReloadKey((k) => k + 1);
    } catch {
      toast.error('Failed to submit your message.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Help & Complaints" subtitle="Ask a question or raise a complaint — the super admin will respond here." />

      <Card className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-faint block mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full sm:w-64 px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="HELP">Help Request</option>
              <option value="COMPLAINT">Complaint</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-faint block mb-1.5">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Brief summary"
              className="w-full px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-faint block mb-1.5">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Describe your issue or question in detail"
              rows={5}
              className="w-full px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-60"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink">My messages</h2>
        <span className="text-xs text-ink-faint">{messages.length} total</span>
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : messages.length === 0 ? (
        <Card padding="p-0">
          <EmptyState icon={LifeBuoy} title="No messages yet" message="Anything you submit above will show up here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m, i) => {
            const typeBadge = TYPE_BADGE[m.type] ?? TYPE_BADGE.HELP;
            const statusBadge = STATUS_BADGE[m.status] ?? STATUS_BADGE.OPEN;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <Card>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{m.subject}</p>
                      <p className="text-xs text-ink-faint mt-0.5">
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={typeBadge.tone}>{typeBadge.label}</Badge>
                      <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-ink-soft whitespace-pre-wrap">{m.message}</p>

                  {m.reply && (
                    <div className="mt-3 pt-3 border-t border-ink/[0.06] flex gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                        <HelpCircle size={13} className="text-brand-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink-faint mb-1">
                          Response from admin
                          {m.replied_at && ` · ${new Date(m.replied_at).toLocaleString()}`}
                        </p>
                        <p className="text-sm text-ink-soft whitespace-pre-wrap">{m.reply}</p>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
