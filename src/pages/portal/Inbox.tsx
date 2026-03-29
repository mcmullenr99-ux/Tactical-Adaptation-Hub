import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { format } from "date-fns";
import { Mail, MailOpen, Trash2, Send, Plus, UserPlus, UserCheck, Loader2, CheckCheck, ChevronLeft, ChevronRight as ChevRight } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";

const PAGE_SIZE = 10;

interface FriendStatus { status: "none"|"pending"|"accepted"; iAmRequester?: boolean; friendshipId?: number; }

function AddFriendButton({ userId, username }: { userId: number; username: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery<FriendStatus>({
    queryKey: ["friend-status", userId],
    queryFn: () => apiFetch(`/friends?path=status/${userId}`),
  });
  const send = useMutation({
    mutationFn: () => apiFetch(`/friends?path=request/${userId}`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["friend-status", userId] }); toast({ title: "Request Sent", description: `Friend request sent to ${username}.` }); },
    onError: () => toast({ title: "Failed", description: "Could not send request.", variant: "destructive" }),
  });
  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (status?.status === "accepted") return <span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-green-400"><UserCheck className="w-3.5 h-3.5" /> Connected</span>;
  if (status?.status === "pending") return <span className="text-xs font-display font-bold uppercase tracking-wider text-amber-400">{status.iAmRequester ? "Request Sent" : "Wants to Connect"}</span>;
  return (
    <button onClick={() => send.mutate()} disabled={send.isPending} className="flex items-center gap-1.5 text-sm font-display font-bold uppercase tracking-wider text-primary hover:text-accent transition-colors disabled:opacity-50">
      <UserPlus className="w-4 h-4" /> Add Friend
    </button>
  );
}

export default function Inbox() {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  
  const { data: inbox, refetch: refetchInbox } = useQuery<any[]>({
    queryKey: ["inbox"],
    queryFn: () => apiFetch("/messages?path=inbox"),
  });
  const { data: sent, refetch: refetchSent } = useQuery<any[]>({
    queryKey: ["sent"],
    queryFn: () => apiFetch("/messages?path=sent"),
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markRead = useMutation({
    mutationFn: ({ id }: { id: number }) => apiFetch(`/messages?path=${id}/read`, { method: "PATCH" }),
    onSuccess: () => refetchInbox(),
  });

  const deleteMsg = useMutation({
    mutationFn: ({ id }: { id: number }) => apiFetch(`/messages?path=${id}`, { method: "DELETE" }),
  });

  const allMessages = tab === 'inbox' ? inbox : sent;
  const totalPages = Math.ceil((allMessages?.length ?? 0) / PAGE_SIZE);
  const messages = allMessages?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const markAllRead = useMutation({
    mutationFn: () => apiFetch("/messages?path=read-all", { method: "PATCH" }),
    onSuccess: () => { refetchInbox(); queryClient.invalidateQueries({ queryKey: ["notification-counts"] }); toast({ title: "All messages marked as read." }); },
    onError: () => toast({ title: "Error", description: "Could not mark all as read.", variant: "destructive" }),
  });

  const handleExpand = (id: number, isRead: boolean) => {
    if (expandedMsg === id) { setExpandedMsg(null); return; }
    setExpandedMsg(id);
    if (tab === 'inbox' && !isRead) {
      markRead.mutate({ id }, { onSuccess: () => refetchInbox() });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMsg.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Message Deleted" });
        if (tab === 'inbox') refetchInbox();
        else refetchSent();
      }
    });
  };

  return (
    <PortalLayout>
      <div className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-display font-bold uppercase tracking-wider">Secure Comms</h1>
          <div className="flex items-center gap-2">
            {tab === 'inbox' && inbox && inbox.some((m: any) => !m.isRead) && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded text-sm font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck className="w-4 h-4" /> Mark All Read
              </button>
            )}
            <Link 
              href="/portal/compose"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded clip-angled-sm font-display font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Dispatch
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => { setTab('inbox'); setExpandedMsg(null); setPage(1); }}
            className={`px-6 py-3 font-display font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${tab === 'inbox' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Inbox {inbox && inbox.filter((m: any) => !m.isRead).length > 0 && `(${inbox.filter((m: any) => !m.isRead).length})`}
          </button>
          <button
            onClick={() => { setTab('sent'); setExpandedMsg(null); setPage(1); }}
            className={`px-6 py-3 font-display font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${tab === 'sent' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Sent
          </button>
        </div>

        <div className="flex-1 space-y-3">
          {!messages || messages.length === 0 ? (
            <div className="bg-card border border-border border-dashed p-12 rounded flex flex-col items-center justify-center text-muted-foreground text-center">
              <Mail className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-display uppercase tracking-widest text-lg">No messages found</p>
              <p className="font-sans text-sm mt-2">Your sector is clear.</p>
            </div>
          ) : (
            messages.map((msg: any) => (
              <motion.div layout key={msg.id} className={`bg-card border rounded clip-angled-sm overflow-hidden transition-colors ${tab === 'inbox' && !msg.isRead ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors gap-4" onClick={() => handleExpand(msg.id, msg.isRead)}>
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    <div className="flex-shrink-0">
                      {tab === 'inbox' ? (msg.isRead ? <MailOpen className="w-5 h-5 text-muted-foreground" /> : <Mail className="w-5 h-5 text-primary" />) : (<Send className="w-5 h-5 text-muted-foreground" />)}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-sans text-sm truncate ${tab === 'inbox' && !msg.isRead ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                        {tab === 'inbox' ? `From: ${msg.senderUsername}` : `To: ${msg.recipientUsername}`}
                      </p>
                      <h4 className={`font-display uppercase tracking-wide truncate ${tab === 'inbox' && !msg.isRead ? "font-bold text-primary" : "font-semibold text-foreground"}`}>
                        {msg.subject}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="text-xs font-sans text-muted-foreground">{msg.createdAt && !isNaN(new Date(msg.createdAt).getTime()) ? format(new Date(msg.createdAt), "MMM dd, HH:mm") : "—"}</span>
                    <button onClick={(e) => handleDelete(e, msg.id)} className="p-2 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedMsg === msg.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border bg-secondary/20">
                      <div className="p-6">
                        <p className="font-sans text-foreground whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        {tab === 'inbox' && (
                          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-4">
                            <AddFriendButton userId={msg.senderId} username={msg.senderUsername} />
                            <Link href={`/portal/compose?replyTo=${msg.senderId}&subject=Re: ${encodeURIComponent(msg.subject)}`} className="flex items-center gap-2 text-sm font-display font-bold uppercase tracking-wider text-primary hover:text-accent transition-colors">
                              <Send className="w-4 h-4" /> Reply
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-border rounded disabled:opacity-40 hover:border-primary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-display uppercase tracking-widest text-muted-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-border rounded disabled:opacity-40 hover:border-primary transition-colors">
              <ChevRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
