import { useState, useRef, useEffect } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { countryFlag } from "@/lib/countries";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mail, MailOpen, Trash2, Send, Plus, UserPlus, UserCheck, UserX,
  MessageSquare, Bell, Loader2, Search, X, Users, CheckCheck,
  ChevronLeft, ChevronRight, Inbox, Radio
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "inbox" | "sent" | "compose" | "connections" | "requests" | "find";

interface FriendUser {
  friendship_id: number;
  friends_since?: string;
  id: number;
  username: string;
  email: string;
  role: string;
  bio: string | null;
  discord_tag: string | null;
  nationality: string | null;
}

interface SearchUser {
  id: number;
  username: string;
  role: string;
  bio: string | null;
  discord_tag: string | null;
  created_at: string;
}

interface FriendStatus {
  status: "none" | "pending" | "accepted" | "declined";
  friendshipId?: number;
  iAmRequester?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  member:    "text-muted-foreground border-border",
  staff:     "text-blue-400 border-blue-400/50",
  moderator: "text-amber-400 border-amber-400/50",
  admin:     "text-destructive border-destructive/50",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-display font-bold uppercase tracking-widest px-2 py-0.5 border rounded ${ROLE_COLORS[role] || ROLE_COLORS.member}`}>
      {role}
    </span>
  );
}

const PAGE_SIZE = 10;

// ─── Compose sub-component ────────────────────────────────────────────────────

const composeSchema = z.object({
  recipientId: z.number().min(1, "Select a recipient"),
  subject: z.string().min(1, "Subject required").max(200),
  body: z.string().min(1, "Message required").max(5000),
});
type ComposeForm = z.infer<typeof composeSchema>;

interface UserResult { id: number; username: string; role: string; }

function RecipientSearch({ onChange, initialUsername }: { onChange: (id: number) => void; initialUsername?: string }) {
  const [q, setQ] = useState(initialUsername ?? "");
  const [selectedName, setSelectedName] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results = [] } = useQuery<UserResult[]>({
    queryKey: ["user-search", q],
    queryFn: () => apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2 && !selectedName,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (initialUsername && !selectedName && results.length > 0) {
      const match = results.find((u: UserResult) => u.username.toLowerCase() === initialUsername.toLowerCase());
      if (match) { setSelectedName(match.username); onChange(match.id); setOpen(false); setQ(""); }
      else setOpen(true);
    }
  }, [results, initialUsername, selectedName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clear = () => { setQ(""); setSelectedName(""); onChange(0); setOpen(false); };

  if (selectedName) {
    return (
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/40 rounded px-3 py-3">
        <span className="font-display font-bold text-primary text-sm flex-1">{selectedName}</span>
        <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          className="w-full bg-background border-2 border-border rounded pl-9 pr-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all"
          placeholder="Search by username…" />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {results.map((u: UserResult) => (
            <button key={u.id} type="button"
              onClick={() => { setSelectedName(u.username); onChange(u.id); setOpen(false); setQ(""); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left">
              <span className="flex-1 font-display font-bold text-sm text-foreground">{u.username}</span>
              <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 font-display uppercase tracking-widest">{u.role}</span>
            </button>
          ))}
        </div>
      )}
      {open && q.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-lg shadow-2xl px-4 py-3 text-sm text-muted-foreground">No operators found.</div>
      )}
    </div>
  );
}

function AddFriendInline({ userId, username }: { userId: number; username: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery<FriendStatus>({
    queryKey: ["friend-status", userId],
    queryFn: () => apiFetch(`/api/friends/status/${userId}`),
  });
  const send = useMutation({
    mutationFn: () => apiFetch(`/api/friends/request/${userId}`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["friend-status", userId] }); toast({ title: "Request Sent", description: `Sent to ${username}.` }); },
  });
  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (status?.status === "accepted") return <span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-green-400"><UserCheck className="w-3.5 h-3.5" /> Connected</span>;
  if (status?.status === "pending") return <span className="text-xs font-display font-bold uppercase tracking-wider text-amber-400">{status.iAmRequester ? "Sent" : "Wants to Connect"}</span>;
  return <button onClick={() => send.mutate()} disabled={send.isPending} className="flex items-center gap-1.5 text-sm font-display font-bold uppercase tracking-wider text-primary hover:text-accent transition-colors disabled:opacity-50"><UserPlus className="w-4 h-4" /> Add</button>;
}

// ─── Panel: Inbox / Sent ──────────────────────────────────────────────────────

function MessagesPanel({ tab, setSection }: { tab: "inbox" | "sent"; setSection: (s: Section) => void }) {
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: inbox = [], refetch: refetchInbox } = useQuery<any[]>({ queryKey: ["inbox"], queryFn: () => apiFetch("/api/messages/inbox") });
  const { data: sent = [], refetch: refetchSent } = useQuery<any[]>({ queryKey: ["sent"], queryFn: () => apiFetch("/api/messages/sent") });

  const markRead = useMutation({ mutationFn: ({ id }: { id: string }) => apiFetch(`/api/messages/${id}/read`, { method: "PATCH" }), onSuccess: () => refetchInbox() });
  const deleteMsg = useMutation({ mutationFn: ({ id }: { id: string }) => apiFetch(`/api/messages/${id}`, { method: "DELETE" }) });
  const markAllRead = useMutation({
    mutationFn: () => apiFetch("/api/messages/read-all", { method: "PATCH" }),
    onSuccess: () => { refetchInbox(); qc.invalidateQueries({ queryKey: ["notification-counts"] }); toast({ title: "All marked read." }); },
  });

  const all = tab === "inbox" ? inbox : sent;
  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const messages = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExpand = (id: string, isRead: boolean) => {
    if (expandedMsg === id) { setExpandedMsg(null); return; }
    setExpandedMsg(id);
    if (tab === "inbox" && !isRead) markRead.mutate({ id }, { onSuccess: () => refetchInbox() });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMsg.mutate({ id }, {
      onSuccess: () => { toast({ title: "Deleted" }); if (tab === "inbox") refetchInbox(); else refetchSent(); },
    });
  };

  const unreadCount = inbox.filter((m: any) => !m.isRead).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-black uppercase tracking-wider">{tab === "inbox" ? `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ""}` : "Sent"}</h2>
        <div className="flex gap-2">
          {tab === "inbox" && unreadCount > 0 && (
            <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
          <button onClick={() => setSection("compose")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Compose
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center border border-dashed border-border rounded-lg">
            <Mail className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-display uppercase tracking-widest text-sm">No messages</p>
          </div>
        ) : messages.map((msg: any) => (
          <motion.div layout key={msg.id} className={`bg-card border rounded overflow-hidden transition-colors ${tab === "inbox" && !msg.isRead ? "border-primary/50 bg-primary/5" : "border-border"}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/40 transition-colors gap-3" onClick={() => handleExpand(msg.id, msg.isRead)}>
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                {tab === "inbox" ? (msg.isRead ? <MailOpen className="w-4 h-4 text-muted-foreground shrink-0" /> : <Mail className="w-4 h-4 text-primary shrink-0" />) : <Send className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-sans truncate">{tab === "inbox" ? `From: ${msg.senderUsername}` : `To: ${msg.recipientUsername}`}</p>
                  <p className={`font-display text-sm uppercase tracking-wide truncate ${tab === "inbox" && !msg.isRead ? "font-bold text-primary" : "text-foreground"}`}>{msg.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:block">{msg.createdAt ? format(new Date(msg.createdAt), "MMM dd") : "—"}</span>
                <button onClick={(e) => handleDelete(e, msg.id)} className="p-1.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <AnimatePresence>
              {expandedMsg === msg.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border bg-secondary/20">
                  <div className="p-5">
                    <p className="font-sans text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    {tab === "inbox" && (
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <AddFriendInline userId={msg.senderId} username={msg.senderUsername} />
                        <button onClick={() => setSection("compose")} className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-primary hover:text-accent transition-colors">
                          <Send className="w-3.5 h-3.5" /> Reply
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-border rounded disabled:opacity-40 hover:border-primary transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs font-display uppercase tracking-widest text-muted-foreground">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-border rounded disabled:opacity-40 hover:border-primary transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

// ─── Panel: Compose ───────────────────────────────────────────────────────────

function ComposePanel({ setSection }: { setSection: (s: Section) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ComposeForm>({
    resolver: zodResolver(composeSchema),
    defaultValues: { recipientId: 0 },
  });
  const [toUsername, setToUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const replyTo = params.get("replyTo");
    const subject = params.get("subject");
    const toUser = params.get("to");
    if (replyTo) setValue("recipientId", parseInt(replyTo, 10));
    if (subject) setValue("subject", subject);
    if (toUser) setToUsername(toUser);
  }, [setValue]);

  const sendMutation = useMutation({
    mutationFn: (data: { recipientId: number; subject: string; body: string }) =>
      apiFetch("/api/messages", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { toast({ title: "Dispatch Sent" }); qc.invalidateQueries({ queryKey: ["sent"] }); setSection("inbox"); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const bodyVal = watch("body") ?? "";

  return (
    <div>
      <h2 className="text-xl font-display font-black uppercase tracking-wider mb-6">New Dispatch</h2>
      <form onSubmit={handleSubmit(d => sendMutation.mutate(d))} className="space-y-5">
        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Recipient</label>
          <RecipientSearch onChange={id => setValue("recipientId", id, { shouldValidate: true })} initialUsername={toUsername} />
          {errors.recipientId && <p className="text-destructive text-xs mt-1">{errors.recipientId.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Subject</label>
          <input {...register("subject")} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all" placeholder="Op briefing…" />
          {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Body</label>
          <textarea {...register("body")} rows={8} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all resize-y" placeholder="Transmission content…" />
          <div className="flex justify-between mt-1">
            {errors.body && <p className="text-destructive text-xs">{errors.body.message}</p>}
            <p className="text-xs text-muted-foreground ml-auto">{bodyVal.length}/5000</p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <button type="button" onClick={() => setSection("inbox")} className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            ← Cancel
          </button>
          <button type="submit" disabled={sendMutation.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded font-display font-bold uppercase tracking-wider text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendMutation.isPending ? "Sending…" : "Send Dispatch"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Panel: Connections ───────────────────────────────────────────────────────

function ConnectionsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: friends = [], refetch } = useQuery<FriendUser[]>({ queryKey: ["friends"], queryFn: () => apiFetch("/api/friends") });

  const remove = useMutation({
    mutationFn: (userId: number) => apiFetch(`/api/friends/${userId}`, { method: "DELETE" }),
    onSuccess: () => { refetch(); toast({ title: "Connection Removed" }); },
  });

  return (
    <div>
      <h2 className="text-xl font-display font-black uppercase tracking-wider mb-6">Connections ({friends.length})</h2>
      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center border border-dashed border-border rounded-lg">
          <Users className="w-10 h-10 mb-3 opacity-40" />
          <p className="font-display uppercase tracking-widest text-sm">No connections yet</p>
          <p className="text-xs font-sans mt-1">Use Find Members to connect with operators.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((f: FriendUser) => (
            <div key={f.friendship_id} className="bg-card border border-border rounded p-4 flex items-start gap-4">
              <div className="w-9 h-9 bg-secondary rounded flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-display font-bold text-foreground uppercase tracking-wider text-sm">{f.username}</p>
                  {f.nationality && <span className="text-base leading-none">{countryFlag(f.nationality)}</span>}
                  <RoleBadge role={f.role} />
                </div>
                {f.bio && <p className="text-xs font-sans text-muted-foreground truncate">{f.bio}</p>}
                {f.friends_since && <p className="text-xs font-sans text-muted-foreground mt-0.5">Since {format(new Date(f.friends_since), "MMM dd, yyyy")}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={`/portal/comms?to=${f.username}`}
                  className="p-2 border border-border rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Message">
                  <MessageSquare className="w-4 h-4" />
                </a>
                <button onClick={() => remove.mutate(f.id)}
                  className="p-2 border border-destructive/30 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Remove">
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel: Requests ──────────────────────────────────────────────────────────

function RequestsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: requests = [], refetch } = useQuery<FriendUser[]>({ queryKey: ["friend-requests"], queryFn: () => apiFetch("/api/friends/requests") });
  const { refetch: refetchFriends } = useQuery<FriendUser[]>({ queryKey: ["friends"], queryFn: () => apiFetch("/api/friends") });

  const accept = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/friends/${id}/accept`, { method: "PATCH" }),
    onSuccess: () => { refetch(); refetchFriends(); toast({ title: "Connected!" }); },
  });
  const decline = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/friends/${id}/decline`, { method: "PATCH" }),
    onSuccess: () => { refetch(); toast({ title: "Request Declined" }); },
  });

  return (
    <div>
      <h2 className="text-xl font-display font-black uppercase tracking-wider mb-6">Pending Requests ({requests.length})</h2>
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center border border-dashed border-border rounded-lg">
          <Bell className="w-10 h-10 mb-3 opacity-40" />
          <p className="font-display uppercase tracking-widest text-sm">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <div key={r.friendship_id} className="bg-card border border-primary/30 rounded p-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-primary/10 rounded flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-foreground text-sm uppercase tracking-wider">{r.username}</p>
                <p className="text-xs text-muted-foreground font-sans">Wants to connect</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => accept.mutate(r.friendship_id)} disabled={accept.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50">
                  <UserCheck className="w-3.5 h-3.5" /> Accept
                </button>
                <button onClick={() => decline.mutate(r.friendship_id)} disabled={decline.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  <X className="w-3.5 h-3.5" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel: Find Members ──────────────────────────────────────────────────────

function FindPanel({ currentUserId }: { currentUserId: number }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: results = [], isLoading } = useQuery<SearchUser[]>({
    queryKey: ["user-search", dq],
    queryFn: () => apiFetch(`/api/users/search?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });

  const handleChange = (val: string) => {
    setQ(val);
    if (val.trim().length >= 2) setDq(val.trim());
    else setDq("");
  };

  return (
    <div>
      <h2 className="text-xl font-display font-black uppercase tracking-wider mb-6">Find Operators</h2>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={e => handleChange(e.target.value)}
          className="w-full bg-background border-2 border-border rounded pl-10 pr-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all"
          placeholder="Search by username (min 2 chars)…" />
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
      {!isLoading && dq.length >= 2 && results.length === 0 && (
        <p className="text-center text-muted-foreground text-sm font-sans py-8">No operators found for "{dq}".</p>
      )}
      <div className="space-y-3">
        {results.filter(u => u.id !== currentUserId).map((u: SearchUser) => {
          return <SearchResultRow key={u.id} user={u} currentUserId={currentUserId} />;
        })}
      </div>
    </div>
  );
}

function SearchResultRow({ user, currentUserId }: { user: SearchUser; currentUserId: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery<FriendStatus>({
    queryKey: ["friend-status", user.id],
    queryFn: () => apiFetch(`/api/friends/status/${user.id}`),
    enabled: user.id !== currentUserId,
  });
  const send = useMutation({
    mutationFn: () => apiFetch(`/api/friends/request/${user.id}`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["friend-status", user.id] }); toast({ title: "Request Sent", description: `Sent to ${user.username}.` }); },
    onError: (err: any) => toast({ title: "Failed", description: err?.error || "Could not send request.", variant: "destructive" }),
  });

  return (
    <div className="bg-card border border-border rounded p-4 flex items-center gap-4">
      <div className="w-9 h-9 bg-secondary rounded flex items-center justify-center shrink-0">
        <Users className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="font-display font-bold text-foreground text-sm uppercase tracking-wider">{user.username}</p>
          <RoleBadge role={user.role} />
        </div>
        {user.bio && <p className="text-xs font-sans text-muted-foreground truncate">{user.bio}</p>}
      </div>
      <div className="shrink-0">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          : status?.status === "accepted" ? <span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-green-400"><UserCheck className="w-4 h-4" /> Friends</span>
          : status?.status === "pending" ? <span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-amber-400"><Bell className="w-4 h-4" /> {status.iAmRequester ? "Sent" : "Wants to Connect"}</span>
          : (
            <button onClick={() => send.mutate()} disabled={send.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50">
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Comms() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("inbox");

  // URL param support — ?section=compose&to=Username
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section") as Section | null;
    if (s && ["inbox","sent","compose","connections","requests","find"].includes(s)) setSection(s);
    else if (params.get("to") || params.get("replyTo")) setSection("compose");
  }, []);

  const { data: inbox = [] } = useQuery<any[]>({ queryKey: ["inbox"], queryFn: () => apiFetch("/api/messages/inbox") });
  const { data: requests = [] } = useQuery<any[]>({ queryKey: ["friend-requests"], queryFn: () => apiFetch("/api/friends/requests") });

  const unread = inbox.filter((m: any) => !m.isRead).length;
  const pendingReqs = requests.length;

  const navItems: { id: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "inbox",       label: "Inbox",        icon: <Inbox className="w-4 h-4" />,         badge: unread || undefined },
    { id: "sent",        label: "Sent",          icon: <Send className="w-4 h-4" /> },
    { id: "compose",     label: "Compose",       icon: <Plus className="w-4 h-4" /> },
    { id: "connections", label: "Connections",   icon: <Users className="w-4 h-4" /> },
    { id: "requests",    label: "Requests",      icon: <Bell className="w-4 h-4" />,          badge: pendingReqs || undefined },
    { id: "find",        label: "Find Members",  icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <PortalLayout>
      <div className="flex flex-col h-full">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-5">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black uppercase tracking-wider">Comms & Connections</h1>
            <p className="text-xs text-muted-foreground font-sans">Messages, connections, and operator network</p>
          </div>
        </div>

        {/* Layout */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Sidebar */}
          <nav className="w-44 shrink-0 flex flex-col gap-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-display font-bold uppercase tracking-wider transition-colors relative text-left w-full ${
                  section === item.id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}>
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-border my-2" />
            <p className="text-xs font-display uppercase tracking-widest text-muted-foreground px-3 pb-1 opacity-60">Quick tip</p>
            <p className="text-xs font-sans text-muted-foreground px-3 leading-relaxed">Click a connection\'s message icon to jump straight to compose.</p>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {section === "inbox"       && <MessagesPanel tab="inbox" setSection={setSection} />}
            {section === "sent"        && <MessagesPanel tab="sent"  setSection={setSection} />}
            {section === "compose"     && <ComposePanel setSection={setSection} />}
            {section === "connections" && <ConnectionsPanel />}
            {section === "requests"    && <RequestsPanel />}
            {section === "find"        && <FindPanel currentUserId={user?.id ?? 0} />}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
