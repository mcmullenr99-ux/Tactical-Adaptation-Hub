import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRoute, Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { BRANCH_ICONS, type Branch } from "@/lib/milsimConstants";
import {
  Shield, Globe, ExternalLink, Loader2, Users, Award, Crosshair,
  FileText, ChevronLeft, Star, BookOpen, Map, Radio, Medal,
  Zap, Target, TrendingUp, Activity,
} from "lucide-react";
import OrbatBuilder from "@/components/OrbatBuilder";
import { formatDistanceToNow } from "date-fns";

interface Role    { id: string; name: string; description: string | null; sortOrder: number }
interface Rank    { id: string; name: string; abbreviation: string | null; tier: number }
interface RosterEntry { id: string; callsign: string; rankId: string | null; roleId: string | null; notes: string | null }
interface AppQuestion { id: string; question: string; sortOrder: number; required: boolean }
interface MilsimAward { id: string; title: string; description: string | null; icon: string; awarded_by: string | null; awarded_at: string; roster_entry_id: string; callsign: string | null }

interface GroupDetail {
  id: string; name: string; slug: string; tagLine: string | null;
  description: string | null; discordUrl: string | null; websiteUrl: string | null;
  logoUrl: string | null; sops: string | null; orbat: string | null;
  status: string; branch: string | null; unitType: string | null;
  country: string | null; language: string | null; games: string[] | null;
  stream_url: string | null; is_live: boolean;
  roles: Role[]; ranks: Rank[]; roster: RosterEntry[]; questions: AppQuestion[];
}

interface ReadinessFlag {
  severity: 'red' | 'amber';
  code: string;
  label: string;
  detail: string;
}

interface ReadinessData {
  total: number; active_this_week: number; active_this_month: number;
  readiness_pct: number; status: string;
  total_ops: number; completed_ops: number;
  capacity_grade: string;
  capacity_utilisation_pct: number;
  game_profile: { game: string; fullStrength: number; adequate: number; minimal: number; label: string; category: string };
  days_since_last_op: number | null;
  days_since_last_aar: number | null;
  days_since_page_update: number | null;
  avg_rep_score: number; avg_experience: number; review_count: number;
  has_discord: boolean; has_steam: boolean;
  op_capability_tier: string; op_cap_score: number;
  flags: ReadinessFlag[];
  narrative: string;
  narrative_lines: string[];
}

type Tab = "overview" | "roles" | "ranks" | "roster" | "awards" | "stream" | "sops" | "orbat" | "apply" | "capabilities";

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const vid = u.searchParams.get("v") || u.pathname.split("/").pop();
      return vid ? `https://www.youtube.com/embed/${vid}` : null;
    }
    if (u.hostname.includes("twitch.tv")) {
      const channel = u.pathname.split("/").filter(Boolean)[0];
      return channel ? `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}` : null;
    }
  } catch { /* invalid url */ }
  return null;
}

// ─── Branch badge — proper UI element, no emoji ───────────────────────────────
function BranchBadge({ branch }: { branch: string }) {
  const icons: Record<string, React.ReactNode> = {
    // Army — crossed swords
    "Army": <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M14.5 2.5l-1 1 1 1-8 8-1-1-1 1 1 1-1.5 1.5 1.5 1.5 1.5-1.5 1 1 1-1-1-1 8-8 1 1 1-1-1-1 1.5-1.5L18 3l-1.5-1.5-1 1-1-1zM5 17l2 2-1.5 1.5-2-2L5 17z"/></svg>,
    // Marines — globe with anchor cross
    "Marines": <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12 2a3 3 0 110 6 3 3 0 010-6zm0 2a1 1 0 100 2 1 1 0 000-2zM7 9h10v2h-4v7.93A5.002 5.002 0 0017 14h2a7 7 0 01-14 0h2a5 5 0 004 4.93V11H7V9z"/></svg>,
    // Air Force — swept wing / lightning
    "Air Force": <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M21 16l-7-2-2-7-2 7-7 2 7 2 1 4 1-4 7-2z"/></svg>,
    // Navy — anchor
    "Navy": <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7v10M7 10h10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M5 17c1 2 3.5 3 7 3s6-1 7-3l-2-1c-.8 1.2-2.5 2-5 2s-4.2-.8-5-2L5 17z"/></svg>,
    // Special Operations — skull with crossbones / operator beret flash  
    "Special Operations": <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12 2C8.5 2 6 4.5 6 7.5c0 2 1 3.7 2.5 4.7V14h7v-1.8C17 11.2 18 9.5 18 7.5 18 4.5 15.5 2 12 2zM9 15.5h6l-.5 2H9.5L9 15.5zm.5 3h5l-.4 1.5H9.9L9.5 18.5z"/><circle cx="9.5" cy="7.5" r="1.2"/><circle cx="14.5" cy="7.5" r="1.2"/><path d="M10 10.5h4v.5h-4z"/></svg>,
    // Multi-Branch — six-pointed star / joint badge
    "Multi-Branch": <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 2c1.1 0 2.4.8 3.4 2.7H8.6C9.6 4.8 10.9 4 12 4zM4.2 9h15.6c.1.6.2 1.3.2 2s-.1 1.4-.2 2H4.2C4.1 12.4 4 11.7 4 11s.1-1.4.2-2zM8.6 17.3h6.8c-1 1.9-2.3 2.7-3.4 2.7s-2.4-.8-3.4-2.7z"/></svg>,
    // PMC — diamond / mercenary shield
    "PMC": <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12 2L3 6v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V6l-9-4zm0 2.3l7 3.1V12c0 4-2.9 7.7-7 8.9C7.9 19.7 5 16 5 12V7.4l7-3.1z"/><path d="M12 8l1.5 2.5L16 11l-2 2 .5 2.5-2.5-1.3-2.5 1.3.5-2.5-2-2 2.5-.5L12 8z"/></svg>,
  };
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/8 border border-primary/25 rounded text-[10px] font-display font-bold uppercase tracking-widest text-primary/80">
      <span className="w-3 h-3 shrink-0">{icons[branch] ?? icons["Army"]}</span>
      {branch}
    </div>
  );
}

// ─── Readiness gauge ──────────────────────────────────────────────────────────
function ReadinessGauge({ pct, status }: { pct: number; status: string }) {
  const col = status === "green" ? "#4ade80" : status === "amber" ? "#facc15" : "#f87171";
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-display font-black" style={{ color: col }}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── Capability Tier badge ─────────────────────────────────────────────────────
const TIER_META: Record<string, { label: string; style: string }> = {
  "SOF":         { label: "Special Operations Forces",  style: "bg-purple-600/15 border-purple-500/50 text-purple-300" },
  "SOC":         { label: "Special Operations Capable", style: "bg-blue-500/15 border-blue-400/60 text-blue-300" },
  "STRATEGIC":   { label: "Strategically Capable",      style: "bg-green-500/15 border-green-400/60 text-green-300" },
  "OPERATIONAL": { label: "Operationally Capable",      style: "bg-emerald-600/15 border-emerald-500/50 text-emerald-400" },
  "TACTICAL":    { label: "Tactically Capable",         style: "bg-yellow-400/15 border-yellow-400/50 text-yellow-300" },
  "LIMITED":     { label: "Limited Capability",         style: "bg-amber-500/15 border-amber-500/50 text-amber-400" },
  "POOR":        { label: "Poor Capability",            style: "bg-red-500/15 border-red-500/50 text-red-400" },
};
function TierBadge({ tier }: { tier: string }) {
  const meta = TIER_META[tier] ?? { label: tier, style: "bg-border/30 border-border text-muted-foreground" };
  return (
    <span className={`inline-flex items-center justify-center gap-1 w-44 shrink-0 px-2 py-1 rounded border text-[10px] font-display font-bold uppercase tracking-widest text-center leading-tight ${meta.style}`}>
      <Target className="w-2.5 h-2.5 shrink-0" /> {meta.label}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MilsimGroup() {
  const [, params] = useRoute("/milsim/:slug");
  const slug = params?.slug ?? "";
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [awards, setAwards] = useState<MilsimAward[]>([]);
  const [awardsLoaded, setAwardsLoaded] = useState(false);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [readinessLoaded, setReadinessLoaded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    apiFetch<GroupDetail>(`/api/milsim-groups/${slug}`)
      .then(g => { setGroup(g); if (g?.is_live) setTab("stream"); })
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (tab === "awards" && group && !awardsLoaded) {
      apiFetch<MilsimAward[]>(`/api/milsim-groups/${group.id}/awards`)
        .then(data => { setAwards(data ?? []); setAwardsLoaded(true); })
        .catch(() => { setAwards([]); setAwardsLoaded(true); });
    }
    if ((tab === "capabilities" || tab === "overview") && group && !readinessLoaded) {
      apiFetch<ReadinessData>(`/api/stats/readiness/${group.id}`)
        .then(data => { setReadiness(data); setReadinessLoaded(true); })
        .catch(() => { setReadinessLoaded(true); });
    }
  }, [tab, group, awardsLoaded, readinessLoaded]);

  if (loading) return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    </MainLayout>
  );

  if (!group) return (
    <MainLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Shield className="w-16 h-16 text-muted-foreground opacity-30" />
        <p className="font-display font-bold uppercase tracking-wider text-muted-foreground">Group not found</p>
        <Link href="/milsim" className="text-primary hover:text-primary/80 font-display text-sm uppercase tracking-wider">← Back to Registry</Link>
      </div>
    </MainLayout>
  );

  const roles    = group.roles    ?? [];
  const ranks    = group.ranks    ?? [];
  const roster   = group.roster   ?? [];
  const questions = group.questions ?? [];

  const rankById = Object.fromEntries(ranks.map(r => [r.id, r]));
  const roleById = Object.fromEntries(roles.map(r => [r.id, r]));
  const embedUrl = group.stream_url ? getEmbedUrl(group.stream_url) : null;

  const TABS: { id: Tab; label: string; icon: typeof Shield; show: boolean }[] = [
    { id: "overview",      label: "Overview",      icon: Shield,     show: true },
    { id: "capabilities",  label: "Capabilities",  icon: Zap,        show: true },
    { id: "stream",        label: "Live",          icon: Radio,      show: !!group.stream_url },
    { id: "roles",         label: "Roles",         icon: Crosshair,  show: roles.length > 0 },
    { id: "ranks",         label: "Ranks",         icon: Award,      show: ranks.length > 0 },
    { id: "roster",        label: "Roster",        icon: Users,      show: roster.length > 0 },
    { id: "awards",        label: "Commendations", icon: Medal,      show: true },
    { id: "sops",          label: "SOPs",          icon: BookOpen,   show: !!group.sops },
    { id: "orbat",         label: "ORBAT",         icon: Map,        show: !!group.orbat },
    { id: "apply",         label: "Apply",         icon: FileText,   show: questions.length > 0 },
  ];

  return (
    <MainLayout>
      {group.is_live && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-400 px-6 py-2 flex items-center justify-center gap-2 font-display font-bold uppercase tracking-widest text-sm animate-pulse">
          <span className="w-2 h-2 bg-red-400 rounded-full" />
          {group.name} is LIVE — Watch the stream below
        </div>
      )}

      {/* Hero */}
      <div className="relative bg-secondary/50 border-b border-border pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/milsim" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-display text-xs uppercase tracking-wider mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Registry
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-24 h-24 shrink-0 bg-background border border-border rounded-lg flex items-center justify-center overflow-hidden">
              {group.logoUrl
                ? <img src={group.logoUrl} alt={`${group.name} logo`} className="w-full h-full object-contain p-2" onError={e => (e.currentTarget.style.display = "none")} />
                : <Shield className="w-10 h-10 text-muted-foreground/40" />
              }
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-foreground">
                  {group.name}
                </h1>
                {group.status === "featured" && (
                  <span className="flex items-center gap-1 bg-accent/20 border border-accent/40 text-accent px-2.5 py-1 rounded text-xs font-display font-bold uppercase tracking-widest">
                    <Star className="w-3 h-3" /> Featured
                  </span>
                )}
                {group.is_live && (
                  <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-400 px-2.5 py-1 rounded text-xs font-display font-bold uppercase tracking-widest animate-pulse">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> LIVE
                  </span>
                )}
              </div>
              {group.tagLine && (
                <p className="font-display font-bold uppercase tracking-widest text-primary text-sm mb-3">{group.tagLine}</p>
              )}

              {/* Branch + unit type + capability tier */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {group.branch && <BranchBadge branch={group.branch} />}
                {group.unitType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary border border-border rounded text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">
                    <Crosshair className="w-2.5 h-2.5" /> {group.unitType}
                  </span>
                )}
                {readiness?.op_capability_tier && <TierBadge tier={readiness.op_capability_tier} />}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {group.discordUrl && (
                  <a href={group.discordUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground px-4 py-2 rounded text-xs font-display font-bold uppercase tracking-wider transition-all">
                    Discord <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {group.websiteUrl && (
                  <a href={group.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground px-4 py-2 rounded text-xs font-display font-bold uppercase tracking-wider transition-all">
                    <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <span className="text-xs text-muted-foreground font-sans">{roster.length} member{roster.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Readiness gauge in hero */}
            {readiness && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <ReadinessGauge pct={readiness.readiness_pct} status={readiness.status} />
                <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground">Readiness</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background sticky top-20 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-0 scrollbar-hide">
            {TABS.filter(t => t.show).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 font-display font-bold uppercase tracking-wider text-xs shrink-0 border-b-2 transition-all ${
                  tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                } ${t.id === "stream" && group.is_live ? "text-red-400 border-red-400" : ""}`}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="max-w-3xl space-y-8">
              {group.description
                ? <p className="font-sans text-muted-foreground leading-relaxed text-lg">{group.description}</p>
                : <p className="text-muted-foreground font-sans italic">No description provided.</p>
              }

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2">
                {group.country && <span className="text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1.5 bg-secondary border border-border rounded text-muted-foreground">{group.country.replace(/^[^\s]+\s/, "")}</span>}
                {group.language && <span className="text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1.5 bg-secondary border border-border rounded text-muted-foreground">{group.language}</span>}
                {(group.games ?? []).map(g => <span key={g} className="text-[10px] font-sans px-3 py-1.5 bg-secondary border border-border rounded text-muted-foreground">{g}</span>)}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Roles",    value: roles.length,     icon: Crosshair },
                  { label: "Ranks",    value: ranks.length,     icon: Award },
                  { label: "Members",  value: roster.length,    icon: Users },
                  { label: "Ops Logged", value: readiness?.total_ops ?? "—", icon: Target },
                ].map(stat => (
                  <div key={stat.label} className="bg-card border border-border rounded-lg p-4 text-center">
                    <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <div className="font-display font-black text-2xl text-foreground">{stat.value}</div>
                    <div className="font-display text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Readiness strip */}
              {readiness && (
                <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-6">
                  <ReadinessGauge pct={readiness.readiness_pct} status={readiness.status} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-bold uppercase tracking-widest text-sm">Unit Readiness</p>
                      <TierBadge tier={readiness.op_capability_tier} />
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${readiness.readiness_pct}%`, background: readiness.status === "green" ? "#4ade80" : readiness.status === "amber" ? "#facc15" : "#f87171" }} />
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">
                      {readiness.total} members · {readiness.active_this_month} active 30d · {readiness.review_count} rep review{readiness.review_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CAPABILITIES ─────────────────────────────────────────────── */}
          {tab === "capabilities" && (
            <div className="max-w-3xl space-y-6">
              {!readiness ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <>
                  {/* Tier + Readiness hero row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-5">
                      <ReadinessGauge pct={readiness.readiness_pct} status={readiness.status} />
                      <div>
                        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Overall Readiness</p>
                        <p className={`font-display font-black text-2xl uppercase ${
                          readiness.status === "green" ? "text-green-400" : readiness.status === "amber" ? "text-yellow-400" : "text-red-400"
                        }`}>{readiness.status.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-sans">{readiness.readiness_pct}% composite score</p>
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-5">
                      <div className="w-14 h-14 rounded bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                        <Target className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Operational Capability</p>
                        <TierBadge tier={readiness.op_capability_tier} />
                        <p className="text-xs text-muted-foreground mt-2 font-sans">{readiness.op_cap_score}/100 composite</p>
                      </div>
                    </div>
                  </div>

                  {/* Stat grid — no win rate (removed per design spec) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Troop Strength",    value: `${readiness.total}${ readiness.game_profile ? ` / ${readiness.game_profile.fullStrength}` : ''}`,    icon: Users,     sub: readiness.game_profile ? `${readiness.capacity_utilisation_pct}% utilisation · ${readiness.active_this_month} active 30d` : `${readiness.active_this_month} active 30d` },
                      { label: "Ops Logged",         value: readiness.total_ops,                                          icon: Crosshair, sub: `${readiness.completed_ops} completed` },
                      { label: "Last Op",            value: readiness.days_since_last_op !== null ? `${readiness.days_since_last_op}d ago` : "Never", icon: Target,    sub: "days since last operation" },
                      { label: "Avg Rep Score",      value: readiness.avg_rep_score > 0 ? readiness.avg_rep_score : "—", icon: Star,      sub: `${readiness.review_count} review${readiness.review_count !== 1 ? "s" : ""}` },
                      { label: "Avg Experience",     value: readiness.avg_experience > 0 ? `${readiness.avg_experience}/10` : "—", icon: Award, sub: "from peer ratings" },
                      { label: "Active This Week",   value: readiness.active_this_week,                                  icon: Activity,  sub: `of ${readiness.total} total` },
                    ].map(s => (
                      <div key={s.label} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <s.icon className="w-4 h-4 text-primary" />
                          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                        </div>
                        <p className="font-display font-black text-2xl text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* System-generated narrative */}
                  <div className="bg-card border border-border rounded-lg p-5 space-y-3">
                    <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">System Assessment</p>
                    <div className="space-y-2">
                      {readiness.narrative_lines.map((line: string, i: number) => (
                        <p key={i} className="text-sm font-sans text-muted-foreground leading-relaxed">{line}</p>
                      ))}
                    </div>
                  </div>

                  {/* Readiness flags */}
                  {readiness.flags.length > 0 && (
                    <div className="bg-card border border-border rounded-lg p-5 space-y-3">
                      <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Readiness Flags</p>
                      <div className="space-y-2">
                        {readiness.flags.map((flag: any) => (
                          <div key={flag.code} className={`flex items-start gap-3 p-3 rounded-lg border ${
                            flag.severity === 'red'
                              ? 'border-red-500/30 bg-red-500/5'
                              : 'border-yellow-500/30 bg-yellow-500/5'
                          }`}>
                            <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${flag.severity === 'red' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                            <div>
                              <p className={`text-xs font-display font-bold uppercase tracking-wider ${flag.severity === 'red' ? 'text-red-400' : 'text-yellow-400'}`}>{flag.label}</p>
                              <p className="text-[11px] text-muted-foreground font-sans mt-0.5 leading-relaxed">{flag.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Capability tier explanation */}
                  <div className="bg-card border border-border rounded-lg p-5">
                    <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Operational Capability Tier</p>
                    <div className="space-y-1.5">
                      {[
                        { tier: "SOF",         label: "Special Operations Forces",    desc: "The highest attainable designation. Elite multi-domain doctrine, near-perfect AAR discipline, and an exceptional operational record. Operates at the tip of the spear." },
                        { tier: "SOC",         label: "Special Operations Capable",   desc: "Extensive op record, elite AAR discipline, and comprehensive multi-type training doctrine. Operates at special operations capable standard." },
                        { tier: "STRATEGIC",   label: "Strategically Capable",        desc: "Proven unit with strong operational output, solid reputation, and well-documented training resources across multiple doctrine types." },
                        { tier: "OPERATIONAL", label: "Operationally Capable",        desc: "Active unit with a consistent operational record and growing doctrine framework. Capable of executing standard mission types." },
                        { tier: "TACTICAL",    label: "Tactically Capable",           desc: "Building op history and operator experience. Some training doctrine in place. Unit is progressing toward operational readiness." },
                        { tier: "LIMITED",     label: "Limited Capability",           desc: "Minimal operational record and insufficient training documentation to meet baseline capability standards." },
                        { tier: "POOR",        label: "Poor Capability",              desc: "No established operational record, no doctrine, and no verified activity. Unit has not demonstrated any measurable capability." },
                      ].map(t => (
                        <div key={t.tier} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${readiness.op_capability_tier === t.tier ? (
                            t.tier === "SOF"         ? "border-purple-500/40 bg-purple-600/5" :
                            t.tier === "SOC"         ? "border-blue-400/40 bg-blue-500/5" :
                            t.tier === "STRATEGIC"   ? "border-green-400/40 bg-green-500/5" :
                            t.tier === "OPERATIONAL" ? "border-emerald-500/40 bg-emerald-600/5" :
                            t.tier === "TACTICAL"    ? "border-yellow-400/40 bg-yellow-400/5" :
                            t.tier === "LIMITED"     ? "border-amber-500/40 bg-amber-500/5" :
                            "border-red-500/40 bg-red-500/5"
                          ) : "border-transparent opacity-40"}`}>
                          <TierBadge tier={t.tier} />
                          <p className="text-[10px] text-muted-foreground font-sans leading-relaxed">{t.desc}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-sans mt-4 pt-3 border-t border-border">
                      Tier is computed from operations logged, AAR discipline, average troop experience, troop utilisation, training documentation depth, and game breadth — units that operate across multiple titles demonstrate wider mixed-force skillsets. Win rate is not used — we can only assess what commanders actually log.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STREAM ───────────────────────────────────────────────────── */}
          {tab === "stream" && (
            <div className="max-w-4xl space-y-6">
              {group.is_live ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                    <h2 className="font-display font-bold uppercase tracking-widest text-red-400">Live Now</h2>
                  </div>
                  {embedUrl ? (
                    <div className="aspect-video rounded-lg overflow-hidden border border-red-500/30 shadow-lg shadow-red-500/10">
                      <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={`${group.name} live stream`} allow="autoplay" />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg border border-red-500/30 bg-card flex items-center justify-center">
                      <div className="text-center">
                        <Radio className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="font-display font-bold uppercase tracking-wider text-red-400">Live Stream Active</p>
                        {group.stream_url && (
                          <a href={group.stream_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline text-sm">
                            Open stream <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 border border-dashed border-border rounded-lg">
                  <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="font-display font-bold uppercase tracking-widest text-muted-foreground text-sm">No live stream currently</p>
                </div>
              )}
            </div>
          )}

          {/* ── ROLES ───────────────────────────────────────────────────── */}
          {tab === "roles" && (
            roles.length === 0
              ? <EmptyState icon={Crosshair} message="No roles defined" />
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map(role => (
                    <div key={role.id} className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Crosshair className="w-4 h-4 text-primary" />
                        <h3 className="font-display font-bold uppercase tracking-wider text-foreground text-sm">{role.name}</h3>
                      </div>
                      {role.description && <p className="text-muted-foreground font-sans text-sm leading-relaxed">{role.description}</p>}
                    </div>
                  ))}
                </div>
              )
          )}

          {/* ── RANKS ───────────────────────────────────────────────────── */}
          {tab === "ranks" && (
            ranks.length === 0
              ? <EmptyState icon={Award} message="No ranks defined" />
              : (
                <div className="space-y-2 max-w-2xl">
                  {[...ranks].sort((a, b) => b.tier - a.tier).map((rank, i) => (
                    <div key={rank.id} className={`flex items-center gap-4 p-4 rounded-lg border ${i === 0 ? "bg-primary/5 border-primary/30" : "bg-card border-border"}`}>
                      <div className="w-8 h-8 shrink-0 rounded bg-secondary border border-border flex items-center justify-center">
                        <span className="font-display font-black text-xs text-primary">{rank.tier}</span>
                      </div>
                      <div>
                        <p className="font-display font-bold uppercase tracking-wider text-foreground text-sm">{rank.name}</p>
                        {rank.abbreviation && <p className="text-xs text-muted-foreground font-mono">{rank.abbreviation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}

          {/* ── ROSTER ──────────────────────────────────────────────────── */}
          {tab === "roster" && (
            roster.length === 0
              ? <EmptyState icon={Users} message="Roster is empty" />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Callsign", "Rank", "Role", "Notes"].map(h => (
                          <th key={h} className="text-left py-3 px-4 font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map(entry => (
                        <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4 font-display font-bold uppercase tracking-wider text-sm text-foreground">{entry.callsign}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground font-sans">{entry.rankId ? (rankById[entry.rankId]?.name ?? "—") : "—"}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground font-sans">{entry.roleId ? (roleById[entry.roleId]?.name ?? "—") : "—"}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground font-sans">{entry.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          )}

          {/* ── AWARDS ──────────────────────────────────────────────────── */}
          {tab === "awards" && (
            <div className="max-w-2xl">
              {awards.length === 0 ? (
                <EmptyState icon={Medal} message="No commendations issued yet" />
              ) : (
                <div className="space-y-3">
                  {awards.map(a => (
                    <div key={a.id} className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-4">
                      <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                        <Medal className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.callsign ?? `Entry #${a.roster_entry_id}`}
                          {a.awarded_by && <> · Issued by <strong className="text-foreground">{a.awarded_by}</strong></>}
                        </p>
                        {a.description && <p className="text-xs text-muted-foreground italic mt-0.5">{a.description}</p>}
                        {a.awarded_at && <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(a.awarded_at), { addSuffix: true })}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SOPs ────────────────────────────────────────────────────── */}
          {tab === "sops" && (
            group.sops
              ? (
                <div className="max-w-3xl">
                  <pre className="bg-card border border-border rounded-lg p-6 font-sans text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {group.sops}
                  </pre>
                </div>
              )
              : <EmptyState icon={BookOpen} message="No SOPs published" />
          )}

          {/* ── ORBAT ───────────────────────────────────────────────────── */}
          {tab === "orbat" && (
            (() => {
              // Safe ORBAT parse — never crash
              let hasValidOrbat = false;
              if (group.orbat) {
                try {
                  const parsed = JSON.parse(group.orbat);
                  hasValidOrbat = !!(parsed && (parsed.id || parsed.tree));
                } catch { /* invalid JSON */ }
              }
              if (!hasValidOrbat) {
                return <EmptyState icon={Map} message="No ORBAT published yet" sub="The unit commander hasn't set up an ORBAT for this group." />;
              }
              return (
                <div className="w-full">
                  <OrbatBuilder
                    value={group.orbat ?? undefined}
                    groupName={group.name}
                    readOnly
                    roster={roster.map(r => ({
                      id: r.id,
                      callsign: r.callsign,
                      rank: ranks.find(rk => rk.id === r.rankId)?.name ?? undefined,
                      role: roles.find(ro => ro.id === r.roleId)?.name ?? undefined,
                    }))}
                  />
                </div>
              );
            })()
          )}

          {/* ── APPLY ───────────────────────────────────────────────────── */}
          {tab === "apply" && (
            <div className="max-w-2xl">
              {questions.length === 0 ? (
                <EmptyState icon={FileText} message="No application process set up" />
              ) : (
                <>
                  <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-2">Application Questions</h2>
                    <p className="text-sm text-muted-foreground font-sans mb-5">
                      To apply to <strong className="text-foreground">{group.name}</strong>, reach out via
                      {group.discordUrl ? (
                        <> <a href={group.discordUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Discord</a> and </>) : " "}
                      be ready to answer the following:
                    </p>
                    <ol className="space-y-4">
                      {questions.map((q, i) => (
                        <li key={q.id} className="flex items-start gap-3">
                          <span className="w-6 h-6 shrink-0 rounded bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-bold text-xs text-primary">{i + 1}</span>
                          <span className="font-sans text-muted-foreground leading-relaxed">
                            {q.question}
                            {q.required && <span className="ml-2 text-[10px] font-display font-bold uppercase text-accent">Required</span>}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  {group.discordUrl && (
                    <a href={group.discordUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black uppercase tracking-widest text-sm px-8 py-4 rounded clip-angled transition-all active:scale-95">
                      Apply via Discord <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </MainLayout>
  );
}

// ─── Reusable empty state ─────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message, sub }: { icon: typeof Shield; message: string; sub?: string }) {
  return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg">
      <Icon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
      <p className="font-display font-bold uppercase tracking-widest text-muted-foreground text-sm">{message}</p>
      {sub && <p className="text-xs text-muted-foreground font-sans mt-2 max-w-xs mx-auto">{sub}</p>}
    </div>
  );
}
