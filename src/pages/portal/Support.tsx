import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { LifeBuoy, MessageSquare, Plus, Star, ChevronRight, Clock, CheckCircle2, Loader2, Send, Bug } from "lucide-react";
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

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", category: "other", priority: "medium" });
  const [feedback, setFeedback] = useState({ category: "general", rating: 5, message: "" });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    try {
      const data = await apiFetch<any[]>("/support?path=tickets");
      setTickets(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function openTicket(ticket: any) {
    try {
      const full = await apiFetch<any>(`/support?path=tickets/${ticket.id}`);
      setActiveTicket(full);
    } catch { toast({ title: "Error", description: "Failed to load ticket", variant: "destructive" }); }
  }

  async function sendReply() {
    if (!replyBody.trim() || !activeTicket) return;
    setSendingReply(true);
    try {
      const reply = await apiFetch<any>(`/support?path=tickets/${activeTicket.id}/reply`, {
        method: "POST", body: JSON.stringify({ body: replyBody }),
      });
      setActiveTicket((t: any) => ({ ...t, replies: [...(t.replies ?? []), reply] }));
      setReplyBody("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSendingReply(false); }
  }

  async function submitTicket() {
    if (!newTicket.subject || !newTicket.description) {
      toast({ title: "Missing fields", description: "Subject and description are required", variant: "destructive" });
      return;
    }
    setSubmittingTicket(true);
    try {
      const t = await apiFetch<any>("/support?path=tickets", { method: "POST", body: JSON.stringify(newTicket) });
      setTickets(prev => [t, ...prev]);
      setShowNewTicket(false);
      setNewTicket({ subject: "", description: "", category: "other", priority: "medium" });
      toast({ title: `Ticket ${t.ticket_number} created`, description: "Our team will respond shortly." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmittingTicket(false); }
  }

  async function submitFeedback() {
    if (!feedback.message) {
      toast({ title: "Missing message", variant: "destructive" });
      return;
    }
    setSubmittingFeedback(true);
    try {
      await apiFetch("/support?path=feedback", { method: "POST", body: JSON.stringify({ ...feedback, page: window.location.pathname }) });
      setShowFeedback(false);
      setFeedback({ category: "general", rating: 5, message: "" });
      toast({ title: "Feedback submitted!", description: "Thanks for helping us improve." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmittingFeedback(false); }
  }

  if (activeTicket) return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
      <button onClick={() => setActiveTicket(null)} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
        ← Back to tickets
      </button>
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-white">{activeTicket.subject}</h1>
          <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[activeTicket.status]}`}>{activeTicket.status.replace("_", " ")}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_COLORS[activeTicket.priority]}`}>{activeTicket.priority}</span>
        </div>
        <p className="text-xs text-zinc-500">{activeTicket.ticket_number} · {activeTicket.category} · opened {new Date(activeTicket.created_date).toLocaleDateString()}</p>
      </div>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4 space-y-4">
          <div className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-400 mb-1">{activeTicket.username} · original message</p>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{activeTicket.description}</p>
          </div>
          {activeTicket.replies?.map((r: any) => (
            <div key={r.id} className={`p-3 rounded-lg ${r.is_staff ? "bg-green-900/20 border border-green-700/30" : "bg-zinc-800"}`}>
              <p className="text-xs text-zinc-400 mb-1">
                {r.is_staff ? "🛡 " : ""}{r.author_username} · {new Date(r.created_date).toLocaleString()}
              </p>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap">{r.body}</p>
            </div>
          ))}
          {!['closed', 'resolved'].includes(activeTicket.status) && (
            <div className="flex gap-2 pt-2">
              <Textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Type your reply..."
                className="bg-zinc-800 border-zinc-700 resize-none text-sm"
                rows={3}
              />
              <Button onClick={sendReply} disabled={sendingReply || !replyBody.trim()} size="icon" className="self-end bg-green-600 hover:bg-green-500">
                {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
          {activeTicket.status === 'resolved' && (
            <div className="text-center py-2">
              <p className="text-sm text-zinc-400">This ticket has been resolved.</p>
              {activeTicket.resolution_note && <p className="text-xs text-zinc-500 mt-1">Note: {activeTicket.resolution_note}</p>}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </PortalLayout>
  );

  return (
    <PortalLayout>
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><LifeBuoy className="w-6 h-6 text-green-400" /> Support</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Get help or submit feedback</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowFeedback(true)} variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <MessageSquare className="w-4 h-4 mr-1" /> Feedback
          </Button>
          <Button onClick={() => { setNewTicket(p => ({ ...p, category: "bug", priority: "high" })); setShowNewTicket(true); }} size="sm" variant="outline" className="border-orange-700/50 text-orange-400 hover:bg-orange-900/20">
            <Bug className="w-4 h-4 mr-1" /> Report Bug
          </Button>
          <Button onClick={() => setShowNewTicket(true)} size="sm" className="bg-green-600 hover:bg-green-500">
            <Plus className="w-4 h-4 mr-1" /> New Ticket
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <LifeBuoy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tickets yet</p>
          <p className="text-sm mt-1">Open one if you need help with anything</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => (
            <div key={t.id} onClick={() => openTicket(t)} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-white text-sm truncate">{t.subject}</p>
                  <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${STATUS_COLORS[t.status]}`}>{t.status.replace("_", " ")}</span>
                  <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="text-xs text-zinc-500">{t.ticket_number} · {t.category === "bug" ? <span className="text-orange-400">🐛 bug</span> : t.category} · {new Date(t.created_date).toLocaleDateString()}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader><DialogTitle>Open a Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Category</label>
                <Select value={newTicket.category} onValueChange={v => setNewTicket(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {["bug","account","billing","feature_request","other"].map(c => <SelectItem key={c} value={c}>{c.replace("_"," ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Priority</label>
                <Select value={newTicket.priority} onValueChange={v => setNewTicket(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {["low","medium","high","critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Subject</label>
              <Input value={newTicket.subject} onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="Brief summary of your issue" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Description</label>
              <Textarea value={newTicket.description} onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))} className="bg-zinc-800 border-zinc-700 resize-none" rows={5} placeholder="Describe your issue in detail..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewTicket(false)}>Cancel</Button>
            <Button onClick={submitTicket} disabled={submittingTicket} className="bg-green-600 hover:bg-green-500">
              {submittingTicket ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Leave Feedback</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Category</label>
              <Select value={feedback.category} onValueChange={v => setFeedback(p => ({ ...p, category: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {["general","bug","feature","content","ux"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Rating (1-5)</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setFeedback(p => ({ ...p, rating: n }))}
                    className={`w-10 h-10 rounded-lg text-lg transition-colors ${feedback.rating >= n ? "text-yellow-400 bg-yellow-400/10" : "text-zinc-600 bg-zinc-800"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Message</label>
              <Textarea value={feedback.message} onChange={e => setFeedback(p => ({ ...p, message: e.target.value }))} className="bg-zinc-800 border-zinc-700 resize-none" rows={4} placeholder="Tell us what you think..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowFeedback(false)}>Cancel</Button>
            <Button onClick={submitFeedback} disabled={submittingFeedback} className="bg-green-600 hover:bg-green-500">
              {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PortalLayout>
  );
}
