import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  LifeBuoy, MessageSquare, ChevronRight, Loader2, Send, Star,
  CheckCircle2, Clock, AlertTriangle, BarChart3, Trash2, Eye, Bug
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-400 border-green-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-zinc-500/10 text-zinc-400",
  medium: "bg-blue-500/10 text-blue-400",
  high: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

export default function SupportAdmin() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [t, f, s] = await Promise.all([
        apiFetch<any[]>("/support?path=tickets"),
        apiFetch<any[]>("/support?path=feedback"),
        apiFetch<any>("/support?path=stats"),
      ]);
      setTickets(Array.isArray(t) ? t : []);
      setFeedback(Array.isArray(f) ? f : []);
      setStats(s);
    } catch (e: any) {
      toast({ title: "Error loading support data", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function openTicket(ticket: any) {
    try {
      const full = await apiFetch<any>(`/support?path=tickets/${ticket.id}`);
      setActiveTicket(full);
      setResolutionNote(full.resolution_note ?? "");
    } catch { toast({ title: "Failed to load ticket", variant: "destructive" }); }
  }

  async function sendReply() {
    if (!replyBody.trim() || !activeTicket) return;
    setSendingReply(true);
    try {
      const reply = await apiFetch<any>(`/support?path=tickets/${activeTicket.id}/reply`, {
        method: "POST", body: JSON.stringify({ body: replyBody }),
      });
      setActiveTicket((t: any) => ({ ...t, replies: [...(t.replies ?? []), reply], status: t.status === 'open' ? 'in_progress' : t.status }));
      setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: t.status === 'open' ? 'in_progress' : t.status } : t));
      setReplyBody("");
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSendingReply(false); }
  }

  async function updateTicketStatus(status: string) {
    if (!activeTicket) return;
    try {
      const updated = await apiFetch<any>(`/support?path=tickets/${activeTicket.id}`, {
        method: "PATCH", body: JSON.stringify({ status, resolutionNote: resolutionNote || undefined }),
      });
      setActiveTicket((t: any) => ({ ...t, ...updated }));
      setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status } : t));
      toast({ title: `Ticket marked as ${status}` });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  }

  async function markFeedbackReviewed(id: string, reviewed: boolean) {
    try {
      await apiFetch(`/support?path=feedback/${id}`, { method: "PATCH", body: JSON.stringify({ reviewed }) });
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, reviewed } : f));
    } catch (e: any) { toast({ title: "Error", variant: "destructive" }); }
  }

  async function deleteFeedback(id: string) {
    try {
      await apiFetch(`/support?path=feedback/${id}`, { method: "DELETE" });
      setFeedback(prev => prev.filter(f => f.id !== id));
    } catch (e: any) { toast({ title: "Error", variant: "destructive" }); }
  }

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  if (activeTicket) return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <button onClick={() => setActiveTicket(null)} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">← Back to tickets</button>
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-white">{activeTicket.subject}</h1>
          <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[activeTicket.status]}`}>{activeTicket.status.replace("_"," ")}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_COLORS[activeTicket.priority]}`}>{activeTicket.priority}</span>
        </div>
        <p className="text-xs text-zinc-500">{activeTicket.ticket_number} · {activeTicket.category} · {activeTicket.username} · {activeTicket.email ?? ''} · opened {new Date(activeTicket.created_date).toLocaleString()}</p>
        {activeTicket.assigned_username && <p className="text-xs text-zinc-500">Assigned to: {activeTicket.assigned_username}</p>}
      </div>

      {/* Staff controls */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-300">Actions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Resolution note (optional)</label>
            <Input value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" placeholder="Add a resolution note..." />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => updateTicketStatus("in_progress")} size="sm" variant="outline" className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/20">In Progress</Button>
            <Button onClick={() => updateTicketStatus("resolved")} size="sm" variant="outline" className="border-green-700 text-green-400 hover:bg-green-900/20">Mark Resolved</Button>
            <Button onClick={() => updateTicketStatus("closed")} size="sm" variant="outline" className="border-zinc-600 text-zinc-400 hover:bg-zinc-800">Close</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4 space-y-4">
          <div className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-400 mb-1">{activeTicket.username} · original</p>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{activeTicket.description}</p>
          </div>
          {activeTicket.replies?.map((r: any) => (
            <div key={r.id} className={`p-3 rounded-lg ${r.is_staff ? "bg-green-900/20 border border-green-700/30" : "bg-zinc-800"}`}>
              <p className="text-xs text-zinc-400 mb-1">{r.is_staff ? "🛡 " : ""}{r.author_username} · {new Date(r.created_date).toLocaleString()}</p>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap">{r.body}</p>
            </div>
          ))}
          {!['closed'].includes(activeTicket.status) && (
            <div className="flex gap-2 pt-2">
              <Textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Staff reply..." className="bg-zinc-800 border-zinc-700 resize-none text-sm" rows={3} />
              <Button onClick={sendReply} disabled={sendingReply || !replyBody.trim()} size="icon" className="self-end bg-green-600 hover:bg-green-500">
                {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <PortalLayout>
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><LifeBuoy className="w-6 h-6 text-green-400" /> Support Admin</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage tickets and review feedback</p>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Open", value: stats.tickets.open, icon: <Clock className="w-4 h-4" />, color: "text-blue-400" },
            { label: "In Progress", value: stats.tickets.in_progress, icon: <Loader2 className="w-4 h-4" />, color: "text-yellow-400" },
            { label: "Critical", value: stats.tickets.critical, icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400" },
            { label: "Unread FB", value: stats.feedback.unreviewed, icon: <Star className="w-4 h-4" />, color: "text-yellow-400" },
            { label: "Bug Reports", value: tickets.filter(t => t.category === "bug").length, icon: <Bug className="w-4 h-4" />, color: "text-orange-400" },
          ].map(s => (
            <Card key={s.label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 flex items-center gap-3">
                <span className={s.color}>{s.icon}</span>
                <div>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="bugs">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="bugs" className="data-[state=active]:bg-zinc-700">
            <Bug className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> Bug Reports ({tickets.filter(t => t.category === "bug").length})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-zinc-700">All Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-zinc-700">Feedback ({feedback.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bugs" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-500" /></div>
          : tickets.filter(t => t.category === "bug").length === 0
          ? (
            <div className="text-center py-16 text-zinc-500">
              <Bug className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No bug reports yet</p>
              <p className="text-sm mt-1">When users report bugs they'll appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets
                .filter(t => t.category === "bug")
                .sort((a: any, b: any) => {
                  const pri: Record<string,number> = { critical: 0, high: 1, medium: 2, low: 3 };
                  const sta: Record<string,number> = { open: 0, in_progress: 1, resolved: 2, closed: 3 };
                  return (pri[a.priority] ?? 4) - (pri[b.priority] ?? 4) || (sta[a.status] ?? 4) - (sta[b.status] ?? 4);
                })
                .map((t: any) => (
                  <div key={t.id} onClick={() => openTicket(t)}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border ${
                      t.priority === "critical" ? "bg-red-900/10 border-red-700/40 hover:border-red-500/60" :
                      t.priority === "high" ? "bg-orange-900/10 border-orange-700/30 hover:border-orange-500/50" :
                      "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {t.priority === "critical" && <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded animate-pulse">🔴 CRITICAL</span>}
                        {t.priority === "high" && <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">🟠 HIGH</span>}
                        {t.priority === "medium" && <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">🔵 MEDIUM</span>}
                        {t.priority === "low" && <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 rounded">⚪ LOW</span>}
                        <p className="font-medium text-white text-sm truncate">{t.subject}</p>
                        <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${STATUS_COLORS[t.status]}`}>{t.status.replace("_"," ")}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{t.ticket_number} · {t.username} · opened {new Date(t.created_date).toLocaleDateString()}</p>
                      {t.description && <p className="text-xs text-zinc-400 mt-1 truncate">{t.description}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                  </div>
                ))
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="tickets" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Status</SelectItem>
                {["open","in_progress","resolved","closed"].map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Priority</SelectItem>
                {["low","medium","high","critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-500" /></div>
          : filteredTickets.length === 0 ? <p className="text-center text-zinc-500 py-10">No tickets match filters</p>
          : filteredTickets.map(t => (
            <div key={t.id} onClick={() => openTicket(t)} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-medium text-white text-sm truncate">{t.subject}</p>
                  <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${STATUS_COLORS[t.status]}`}>{t.status.replace("_"," ")}</span>
                  <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="text-xs text-zinc-500">{t.ticket_number} · {t.username} · {t.category} · {new Date(t.created_date).toLocaleDateString()}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-500" /></div>
          : feedback.length === 0 ? <p className="text-center text-zinc-500 py-10">No feedback yet</p>
          : feedback.map(f => (
            <div key={f.id} className={`p-4 bg-zinc-900 border rounded-lg transition-colors ${f.reviewed ? "border-zinc-800 opacity-60" : "border-zinc-700"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">{f.category}</span>
                    {f.rating && <span className="text-xs text-yellow-400">{"★".repeat(f.rating)}{"☆".repeat(5-f.rating)}</span>}
                    <span className="text-xs text-zinc-500">{f.username} · {new Date(f.created_date).toLocaleDateString()}</span>
                    {f.page && <span className="text-xs text-zinc-600">{f.page}</span>}
                  </div>
                  <p className="text-sm text-zinc-200">{f.message}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button onClick={() => markFeedbackReviewed(f.id, !f.reviewed)} size="icon" variant="ghost" className={`h-7 w-7 ${f.reviewed ? "text-zinc-600" : "text-green-400 hover:text-green-300"}`}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button onClick={() => deleteFeedback(f.id)} size="icon" variant="ghost" className="h-7 w-7 text-zinc-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
    </PortalLayout>
  );
}
