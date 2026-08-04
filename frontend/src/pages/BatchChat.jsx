import { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import chatService from '../services/chatService';
import useLiveSocket from '../hooks/useLiveSocket';
import { usePermissions } from '../auth/PermissionsContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function BatchChat() {
  const { user } = usePermissions();
  const toast = useToast();

  const [batchId, setBatchId] = useState(undefined); // undefined = not loaded yet
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await chatService.list();
      setBatchId(data.batch_id);
      setMessages(data.messages);
    } catch {
      toast.error('Could not load chat history.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleIncoming = useCallback((data) => {
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
  }, []);

  useLiveSocket({ onChatMessage: handleIncoming });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await chatService.send(trimmed);
      setBody('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title="Batch chat" subtitle="Talk with the other students in your batch" />

        <Card padding="p-0" className="overflow-hidden flex flex-col h-[65vh]">
          {loading ? (
            <div className="p-6"><SkeletonRows rows={5} /></div>
          ) : batchId == null ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <p className="text-sm text-ink-faint max-w-xs">
                You'll be able to chat here once you're assigned to a batch.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto scroll-thin px-6 py-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-ink-faint text-center mt-8">
                    No messages yet — say hello to your batch.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isOwn = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isOwn ? 'bg-brand-600 text-white' : 'bg-ink/[0.05] text-ink'
                        }`}>
                          {!isOwn && (
                            <p className="text-xs font-semibold text-ocean-700 mb-0.5">{m.sender_name}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-ink-faint'}`}>
                            {formatTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-ink/[0.06] px-4 py-3">
                <input
                  type="text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type a message…"
                  maxLength={2000}
                  className="flex-1 px-3.5 py-2.5 border border-ink/10 rounded-xl text-sm text-ink bg-surface
                    outline-none transition-all placeholder-ink-faint/70
                    focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
                <Button type="submit" variant="brand" size="md" icon={Send} disabled={sending || !body.trim()}>
                  Send
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
