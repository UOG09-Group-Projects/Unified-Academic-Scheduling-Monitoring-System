import { useState, useEffect, useCallback, useRef } from 'react';
import { Send } from 'lucide-react';
import chatService from '../services/chatService';
import useLiveSocket from '../hooks/useLiveSocket';
import { usePermissions } from '../auth/PermissionsContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const OVERSIGHT_ROLES = ['OWNER', 'MANAGER'];

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DirectMessages() {
  const { user } = usePermissions();
  const toast = useToast();
  const role = user?.role?.toUpperCase?.();
  const isOversight = OVERSIGHT_ROLES.includes(role);

  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedId, setSelectedId] = useState(null); // peer_id (or conversation id for oversight)
  const [threadHeader, setThreadHeader] = useState(null); // { name }
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchContacts = useCallback(async () => {
    try {
      const data = isOversight
        ? await chatService.listOversightConversations()
        : await chatService.listContacts();
      setContacts(data);
    } catch {
      toast.error('Could not load conversations.');
    } finally {
      setLoadingContacts(false);
    }
  }, [isOversight, toast]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openContact = async (contact) => {
    const id = isOversight ? contact.id : contact.peer_id;
    setSelectedId(id);
    setThreadHeader({ name: isOversight ? `${contact.student_name} <-> ${contact.educator_name}` : contact.peer_name });
    setLoadingMessages(true);
    try {
      const data = isOversight
        ? await chatService.listOversightMessages(contact.id)
        : await chatService.listDmMessages(contact.peer_id);
      setMessages(data.messages);
      if (!isOversight) {
        setContacts((prev) => prev.map((c) => (c.peer_id === id ? { ...c, unread_count: 0 } : c)));
      }
    } catch {
      toast.error('Could not load messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleIncoming = useCallback((data) => {
    setContacts((prev) => prev.map((c) => (
      c.peer_id === data.sender_peer_id
        ? {
            ...c,
            last_message: data.body,
            last_message_at: data.created_at,
            unread_count: selectedId === data.sender_peer_id ? 0 : c.unread_count + 1,
          }
        : c
    )));

    setSelectedId((current) => {
      if (current === data.sender_peer_id) {
        setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      }
      return current;
    });
  }, [selectedId]);

  useLiveSocket({ onDmMessage: isOversight ? undefined : handleIncoming });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending || selectedId == null) return;

    setSending(true);
    try {
      const sent = await chatService.sendDm(selectedId, trimmed);
      setMessages((prev) => [...prev, sent]);
      setBody('');
      fetchContacts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Messages"
          subtitle={isOversight ? 'Read-only view of student–educator conversations at your institution' : 'Message the educators of your courses'}
        />

        <Card padding="p-0" className="overflow-hidden flex h-[65vh]">
          <div className="w-64 shrink-0 border-r border-ink/[0.06] overflow-y-auto scroll-thin">
            {loadingContacts ? (
              <div className="p-4"><SkeletonRows rows={5} /></div>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-ink-faint text-center p-6">
                {isOversight ? 'No conversations yet.' : 'No contacts yet — you need a shared course with an educator.'}
              </p>
            ) : (
              contacts.map((c) => {
                const id = isOversight ? c.id : c.peer_id;
                const label = isOversight ? `${c.student_name} ↔ ${c.educator_name}` : c.peer_name;
                return (
                  <button
                    key={id}
                    onClick={() => openContact(c)}
                    className={`w-full text-left px-4 py-3 border-b border-ink/[0.04] transition-colors ${
                      selectedId === id ? 'bg-brand-600/10' : 'hover:bg-ink/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink truncate">{label}</p>
                      {!isOversight && c.unread_count > 0 && (
                        <span className="shrink-0 min-w-[1.25rem] h-5 px-1 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    {c.last_message && (
                      <p className="text-xs text-ink-faint truncate mt-0.5">{c.last_message}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {selectedId == null ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-sm text-ink-faint">Select a conversation to view it.</p>
              </div>
            ) : (
              <>
                {threadHeader && (
                  <div className="px-4 py-3 border-b border-ink/[0.06]">
                    <p className="text-sm font-semibold text-ink">{threadHeader.name}</p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto scroll-thin px-6 py-4 space-y-3">
                  {loadingMessages ? (
                    <SkeletonRows rows={4} />
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-ink-faint text-center mt-8">No messages yet.</p>
                  ) : (
                    messages.map((m) => {
                      const isOwn = !isOversight && m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isOversight ? 'justify-start' : isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            !isOversight && isOwn ? 'bg-brand-600 text-white' : 'bg-ink/[0.05] text-ink'
                          }`}>
                            {(isOversight || !isOwn) && (
                              <p className="text-xs font-semibold text-ocean-700 mb-0.5">{m.sender_name}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={`text-[10px] mt-1 ${!isOversight && isOwn ? 'text-white/70' : 'text-ink-faint'}`}>
                              {formatTime(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {!isOversight && (
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
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
