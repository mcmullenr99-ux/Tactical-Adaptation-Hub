import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { Calendar, Plus, Clock, Gamepad2, Users, Loader2, Trash2, Edit } from "lucide-react";
import { format, isPast, isFuture, parseISO } from "date-fns";

interface OpsEvent {
  id: number;
  title: string;
  game: string | null;
  description: string | null;
  event_date: string;
  end_date: string | null;
  organizer_username: string | null;
  status: string;
  max_slots: number | null;
  created_at: string;
}

const STAFF_ROLES = ["staff", "moderator", "admin"];

export default function OpsCalendar() {
  useSEO({ title: "Ops Calendar", description: "TAG scheduled operations, training events, and community activities." });
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OpsEvent | null>(null);

  const [form, setForm] = useState({ title: "", game: "", description: "", eventDate: "", endDate: "", maxSlots: "" });

  const { data: events = [], isLoading } = useQuery<OpsEvent[]>({
    queryKey: ["ops-events"],
    queryFn: () => apiFetch("/api/events").then(r => r.json()),
  });

  const canManage = user && STAFF_ROLES.includes(user.role);

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiFetch("/api/events", {
        method: editingEvent ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title, game: data.game || undefined,
          description: data.description || undefined,
          eventDate: data.eventDate, endDate: data.endDate || undefined,
          maxSlots: data.maxSlots ? parseInt(data.maxSlots) : undefined,
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: editingEvent ? "Event Updated" : "Event Created" });
      qc.invalidateQueries({ queryKey: ["ops-events"] });
      setShowForm(false); setEditingEvent(null);
      setForm({ title: "", game: "", description: "", eventDate: "", endDate: "", maxSlots: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Event Deleted" }); qc.invalidateQueries({ queryKey: ["ops-events"] }); },
  });

  const upcoming = events.filter(e => isFuture(parseISO(e.event_date)));
  const past = events.filter(e => isPast(parseISO(e.event_date)));

  const EventCard = ({ event }: { event: OpsEvent }) => (
    <div className={`bg-card border rounded-lg p-5 transition-all hover:border-primary/40 ${
      isPast(parseISO(event.event_date)) ? "border-border opacity-60" : "border-border"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-display font-bold uppercase tracking-wider text-foreground">{event.title}</h3>
            {event.game && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 rounded font-display uppercase tracking-widest">
                <Gamepad2 className="w-3 h-3" /> {event.game}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded font-display uppercase tracking-widest border ${
              event.status === "upcoming" ? "text-green-400 border-green-400/40" :
              event.status === "ongoing" ? "text-accent border-accent/40" :
              "text-muted-foreground border-border"
            }`}>{event.status}</span>
          </div>
          {event.description && <p className="text-sm text-muted-foreground mb-3">{event.description}</p>}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-primary" />
              {format(parseISO(event.event_date), "EEE, d MMM yyyy 'at' HH:mm 'UTC'")}
            </span>
            {event.max_slots && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-primary" /> {event.max_slots} slots
              </span>
            )}
            {event.organizer_username && (
              <span>Organised by <strong className="text-foreground">{event.organizer_username}</strong></span>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => { setEditingEvent(event); setForm({ title: event.title, game: event.game ?? "", description: event.description ?? "", eventDate: event.event_date.slice(0,16), endDate: event.end_date?.slice(0,16) ?? "", maxSlots: event.max_slots?.toString() ?? "" }); setShowForm(true); }}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteMutation.mutate(event.id)}
              className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="pt-28 pb-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-7 h-7 text-primary" />
                <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-widest">Ops Calendar</h1>
              </div>
              <p className="text-muted-foreground">Scheduled operations, training events, and community activities.</p>
            </div>
            {canManage && (
              <button
                onClick={() => { setShowForm(!showForm); setEditingEvent(null); setForm({ title: "", game: "", description: "", eventDate: "", endDate: "", maxSlots: "" }); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded transition-all"
              >
                <Plus className="w-4 h-4" /> Schedule Op
              </button>
            )}
          </div>

          {/* Event Form */}
          {showForm && canManage && (
            <div className="bg-card border border-primary/40 rounded-lg p-6 mb-8 space-y-4">
              <h2 className="font-display font-bold uppercase tracking-widest text-primary">
                {editingEvent ? "Edit Event" : "New Operation"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mf-input w-full" placeholder="Op Ironsides" />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Game</label>
                  <input value={form.game} onChange={e => setForm(f => ({...f, game: e.target.value}))} className="mf-input w-full" placeholder="Arma Reforger" />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Max Slots</label>
                  <input type="number" value={form.maxSlots} onChange={e => setForm(f => ({...f, maxSlots: e.target.value}))} className="mf-input w-full" placeholder="24" />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Start Date & Time (UTC) *</label>
                  <input type="datetime-local" value={form.eventDate} onChange={e => setForm(f => ({...f, eventDate: e.target.value}))} className="mf-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">End Date & Time (UTC)</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className="mf-input w-full" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="mf-input w-full resize-none" placeholder="Briefing notes, objectives..." />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setEditingEvent(null); }} className="px-4 py-2 border border-border rounded text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-foreground">Cancel</button>
                <button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.title || !form.eventDate || createMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded disabled:opacity-50"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingEvent ? "Save Changes" : "Schedule"}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : events.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-display uppercase tracking-widest text-lg">No ops scheduled</p>
              <p className="text-sm mt-2">Check back soon or join Discord for announcements.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {upcoming.length > 0 && (
                <div>
                  <h2 className="font-display font-bold uppercase tracking-widest text-sm text-primary mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Upcoming Operations
                  </h2>
                  <div className="space-y-3">{upcoming.map(e => <EventCard key={e.id} event={e} />)}</div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h2 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground mb-4">Past Operations</h2>
                  <div className="space-y-3">{past.map(e => <EventCard key={e.id} event={e} />)}</div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
