import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { Calendar, Plus, Clock, Gamepad2, Users, Loader2, Trash2, Edit, MapPin, Tag } from "lucide-react";
import { format, isPast, isFuture, parseISO } from "date-fns";

interface OpsEvent {
  id: number;
  title: string;
  game: string | null;
  description: string | null;
  event_date: string;
  end_date: string | null;
  event_type: string | null;
  location: string | null;
  organizer_username: string | null;
  status: string;
  max_slots: number | null;
  created_at: string;
}

const EVENT_TYPES = [
  { value: "ops", label: "Operation", color: "text-red-400 border-red-400/40 bg-red-400/10" },
  { value: "training", label: "Training", color: "text-blue-400 border-blue-400/40 bg-blue-400/10" },
  { value: "meeting", label: "Meeting", color: "text-accent border-accent/40 bg-accent/10" },
  { value: "mission", label: "Mission", color: "text-primary border-primary/40 bg-primary/10" },
  { value: "event", label: "Event", color: "text-purple-400 border-purple-400/40 bg-purple-400/10" },
];

const TYPE_STYLE: Record<string, string> = Object.fromEntries(EVENT_TYPES.map(t => [t.value, t.color]));

const GAMES = [
  "Arma 3", "Arma Reforger", "Squad", "Ready Or Not",
  "Escape From Tarkov", "Ground Branch", "DayZ", "Grey Zone Warfare",
  "Body Cam", "Bellum", "Exfil", "Other"
];

const STAFF_ROLES = ["staff", "moderator", "admin"];

const emptyForm = { title: "", game: "", description: "", eventDate: "", endDate: "", maxSlots: "", eventType: "ops", location: "" };

export default function OpsCalendar() {
  useSEO({ title: "Ops Calendar", description: "TAG scheduled operations, training events, and community activities." });
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OpsEvent | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: events = [], isLoading } = useQuery<OpsEvent[]>({
    queryKey: ["ops-events"],
    queryFn: () => apiFetch<OpsEvent[]>("/events"),
  });

  const canManage = user && STAFF_ROLES.includes(user.role);

  const submitMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const url = editingEvent ? `/events?path=${editingEvent.id}` : "/events";
      return apiFetch(url, {
        method: editingEvent ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title, game: data.game || undefined,
          description: data.description || undefined,
          eventDate: data.eventDate, endDate: data.endDate || undefined,
          maxSlots: data.maxSlots ? parseInt(data.maxSlots) : undefined,
          eventType: data.eventType || "ops",
          location: data.location || undefined,
        }),
      });
    },
    onSuccess: () => {
      toast({ title: editingEvent ? "Event Updated" : "Event Scheduled" });
      qc.invalidateQueries({ queryKey: ["ops-events"] });
      setShowForm(false); setEditingEvent(null); setForm(emptyForm);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/events?path=${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Event Deleted" }); qc.invalidateQueries({ queryKey: ["ops-events"] }); },
  });

  const openEdit = (event: OpsEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title, game: event.game ?? "", description: event.description ?? "",
      eventDate: event.event_date.slice(0, 16), endDate: event.end_date?.slice(0, 16) ?? "",
      maxSlots: event.max_slots?.toString() ?? "", eventType: event.event_type ?? "ops",
      location: event.location ?? "",
    });
    setShowForm(true);
  };

  const upcoming = events.filter(e => isFuture(parseISO(e.event_date)));
  const past = events.filter(e => isPast(parseISO(e.event_date)));

  const typeLabel = (t: string | null) => EVENT_TYPES.find(x => x.value === t)?.label ?? (t ?? "Op");
  const typeStyle = (t: string | null) => TYPE_STYLE[t ?? "ops"] ?? TYPE_STYLE["ops"];

  const EventCard = ({ event }: { event: OpsEvent }) => (
    <div className={`bg-card border rounded-lg p-5 transition-all hover:border-primary/40 ${isPast(parseISO(event.event_date)) ? "border-border opacity-60" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-display font-bold uppercase tracking-wider text-foreground">{event.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded border font-display font-bold uppercase tracking-widest ${typeStyle(event.event_type)}`}>
              {typeLabel(event.event_type)}
            </span>
            {event.game && (
              <span className="flex items-center gap-1 text-xs bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded font-display uppercase tracking-widest">
                <Gamepad2 className="w-3 h-3" /> {event.game}
              </span>
            )}
          </div>
          {event.description && <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{event.description}</p>}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-primary" />
              {format(parseISO(event.event_date), "EEE, d MMM yyyy 'at' HH:mm 'UTC'")}
              {event.end_date && <> — {format(parseISO(event.end_date), "HH:mm 'UTC'")}</>}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-primary" /> {event.location}
              </span>
            )}
            {event.max_slots && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-primary" /> {event.max_slots} slots
              </span>
            )}
            {event.organizer_username && (
              <span>By <strong className="text-foreground">{event.organizer_username}</strong></span>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => openEdit(event)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-4 h-4" /></button>
            <button onClick={() => deleteMutation.mutate(event.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                onClick={() => { setShowForm(!showForm); setEditingEvent(null); setForm(emptyForm); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded transition-all"
              >
                <Plus className="w-4 h-4" /> Schedule Op
              </button>
            )}
          </div>

          {/* Type Legend */}
          <div className="flex flex-wrap gap-2 mb-8">
            {EVENT_TYPES.map(t => (
              <span key={t.value} className={`text-[10px] px-2.5 py-1 rounded border font-display font-bold uppercase tracking-widest ${t.color}`}>{t.label}</span>
            ))}
          </div>

          {/* Event Form */}
          {showForm && canManage && (
            <div className="bg-card border border-primary/40 rounded-lg p-6 mb-8 space-y-4">
              <h2 className="font-display font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {editingEvent ? "Edit Event" : "New Operation"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mf-input w-full" placeholder="Op Ironsides" />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Type</label>
                  <select value={form.eventType} onChange={e => setForm(f => ({...f, eventType: e.target.value}))} className="mf-input w-full">
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Game</label>
                  <select value={form.game} onChange={e => setForm(f => ({...f, game: e.target.value}))} className="mf-input w-full">
                    <option value="">Select game...</option>
                    {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Start Date & Time (UTC) *</label>
                  <input type="datetime-local" value={form.eventDate} onChange={e => setForm(f => ({...f, eventDate: e.target.value}))} className="mf-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">End Date & Time (UTC)</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className="mf-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Location / Server</label>
                  <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} className="mf-input w-full" placeholder="Discord Stage / Server name..." />
                </div>
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Max Slots</label>
                  <input type="number" value={form.maxSlots} onChange={e => setForm(f => ({...f, maxSlots: e.target.value}))} className="mf-input w-full" placeholder="24" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Briefing / Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="mf-input w-full resize-none" placeholder="Mission objectives, notes..." />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setEditingEvent(null); }} className="px-4 py-2 border border-border rounded text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-foreground">Cancel</button>
                <button
                  onClick={() => submitMutation.mutate(form)}
                  disabled={!form.title || !form.eventDate || submitMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded disabled:opacity-50"
                >
                  {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
