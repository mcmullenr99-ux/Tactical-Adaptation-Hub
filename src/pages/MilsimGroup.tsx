import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRoute, Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import {
  Shield, Globe, ExternalLink, Loader2, Users, Award, Crosshair,
  FileText, ChevronLeft, Star, BookOpen, Map, Radio, Medal
} from "lucide-react";

interface Role { id: number; name: string; description: string | null; sortOrder: number }
interface Rank { id: number; name: string; abbreviation: string | null; tier: number }
interface RosterEntry { id: number; callsign: string; rankId: number | null; roleId: number | null; notes: string | null }
interface AppQuestion { id: number; question: string; sortOrder: number; required: boolean }
interface MilsimAward { id: number; title: string; description: string | null; icon: string; awarded_by: string | null; awarded_at: string; roster_entry_id: number; callsign: string | null }

interface GroupDetail {
  id: number; name: string; slug: string; tagLine: string | null;
  description: string | null; discordUrl: string | null; websiteUrl: string | null;
  logoUrl: string | null; sops: string | null; orbat: string | null;
  status: string; createdAt: string;
  stream_url: string | null; is_live: boolean;
  visibility: string | null;
  roles: Role[]; ranks: Rank[]; roster: RosterEntry[]; questions: AppQuestion[];
}

type Tab = "overview" | "roles" | "ranks" | "roster" | "awards" | "stream" | "sops" | "orbat" | "apply";

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

export default function MilsimGroup() {
  const [, params] = useRoute("/milsim/:slug");
  const slug = params?.slug ?? "";
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [awards, setAwards] = useState<MilsimAward[]>([]);
  const [awardsLoaded, setAwardsLoaded] = useState(false);

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
        .then(data => { setAwards(data); setAwardsLoaded(true); })
        .catch(() => {});
    }
  }, [tab, group, awardsLoaded]);

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

  const rankById = Object.fromEntries(group.ranks.map((r) => [r.id, r]));
  const roleById = Object.fromEntries(group.roles.map((r) => [r.id, r]));
  const embedUrl = group.stream_url ? getEmbedUrl(group.stream_url) : null;

  const DEFAULT_VIS: Record<string, boolean> = {
    roles: true, ranks: true, roster: true, awards: true,
    sops: false, orbat: false, appQuestions: true,
    memberCount: true, discordUrl: true, websiteUrl: true,
  };
  const vis: Record<string, boolean> = (() => {
    try { if (group.visibility) return { ...DEFAULT_VIS, ...JSON.parse(group.visibility) }; } catch {}
    return { ...DEFAULT_VIS };
  })();

  const TABS: { id: Tab; label: string; icon: typeof Shield; show: boolean }[] = [
    { id: "overview", label: "Overview", icon: Shield, show: true },
    { id: "stream", label: "Live", icon: Radio, show: !!group.stream_url },
    { id: "roles", label: "Roles", icon: Crosshair, show: group.roles.length > 0 && vis.roles },
    { id: "ranks", label: "Ranks", icon: Award, show: group.ranks.length > 0 && vis.ranks },
    { id: "roster", label: "Roster", icon: Users, show: group.roster.length > 0 && vis.roster },
    { id: "awards", label: "Commendations", icon: Medal, show: vis.awards },
    { id: "sops", label: "SOPs", icon: BookOpen, show: !!group.sops && vis.sops },
    { id: "orbat", label: "ORBAT", icon: Map, show: !!group.orbat && vis.orbat },
    { id: "apply", label: "Apply", icon: FileText, show: group.questions.length > 0 && vis.appQuestions },
  ];

  return (
    <MainLayout>
      {/* LIVE banner */}
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
              {group.logoUrl ? (
                <img src={group.logoUrl} alt={`${group.name} logo`} className="w-full h-full object-contain p-2" />
              ) : (
                <Shield className="w-10 h-10 text-muted-foreground/40" />
              )}
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
              <div className="flex items-center gap-3 flex-wrap">
                {group.discordUrl && vis.discordUrl && (
                  <a href={group.discordUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground px-4 py-2 rounded text-xs font-display font-bold uppercase tracking-wider transition-all">
                    Discord <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {group.websiteUrl && vis.websiteUrl && (
                  <a href={group.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground px-4 py-2 rounded text-xs font-display font-bold uppercase tracking-wider transition-all">
                    <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {group.is_live && (
                  <button onClick={() => setTab("stream")}
                    className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded text-xs font-display font-bold uppercase tracking-wider transition-all">
                    <Radio className="w-3.5 h-3.5" /> Watch Live
                  </button>
                )}
                {vis.memberCount && (
                <span className="text-xs text-muted-foreground font-sans">
                  {group.roster.length} member{group.roster.length !== 1 ? "s" : ""}
                </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background sticky top-20 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-0 scrollbar-hide">
            {TABS.filter((t) => t.show).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 font-display font-bold uppercase tracking-wider text-xs shrink-0 border-b-2 transition-all ${
                  tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                } ${t.id === "stream" && group.is_live ? "text-red-400 border-red-400" : ""}`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
                {t.id === "stream" && group.is_live && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

          {tab === "overview" && (
            <div className="max-w-3xl">
              {group.description ? (
                <p className="font-sans text-muted-foreground leading-relaxed text-lg">{group.description}</p>
              ) : (
                <p className="text-muted-foreground font-sans italic">No description provided.</p>
              )}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Roles", value: group.roles.length, icon: Crosshair, visKey: "roles" },
                  { label: "Ranks", value: group.ranks.length, icon: Award, visKey: "ranks" },
                  { label: "Members", value: group.roster.length, icon: Users, visKey: "memberCount" },
                  { label: "App Questions", value: group.questions.length, icon: FileText, visKey: "appQuestions" },
                ].filter(stat => vis[stat.visKey]).map((stat) => (
                  <div key={stat.label} className="bg-card border border-border rounded-lg p-4 text-center">
                    <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <div className="font-display font-black text-2xl text-foreground">{stat.value}</div>
                    <div className="font-display text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "stream" && (
            <div className="max-w-4xl space-y-6">
              {group.is_live ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                    <h2 className="font-display font-bold uppercase tracking-widest text-red-400">Live Now</h2>
                    <span className="text-muted-foreground text-sm">— {group.name} is broadcasting</span>
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
                  <p className="text-xs text-muted-foreground mt-2">Come back when {group.name} goes live.</p>
                  {group.discordUrl && (
                    <a href={group.discordUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-primary hover:underline text-sm font-display">
                      Follow on Discord for alerts <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "roles" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.roles.map((role) => (
                <div key={role.id} className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Crosshair className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-bold uppercase tracking-wider text-foreground text-sm">{role.name}</h3>
                  </div>
                  {role.description && <p className="text-muted-foreground font-sans text-sm leading-relaxed">{role.description}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === "ranks" && (
            <div className="space-y-2 max-w-2xl">
              {[...group.ranks].sort((a, b) => b.tier - a.tier).map((rank, i) => (
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
          )}

          {tab === "roster" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Callsign", "Rank", "Role", "Notes"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.roster.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-display font-bold uppercase tracking-wider text-sm text-foreground">{entry.callsign}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground font-sans">{entry.rankId ? rankById[entry.rankId]?.name ?? "—" : "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground font-sans">{entry.roleId ? roleById[entry.roleId]?.name ?? "—" : "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground font-sans">{entry.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "awards" && (
            <div className="max-w-2xl">
              {awards.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
                  <Medal className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-display text-sm uppercase tracking-widest">No commendations issued yet</p>
                </div>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "sops" && (
            <div className="max-w-3xl">
              <pre className="bg-card border border-border rounded-lg p-6 font-sans text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {group.sops}
              </pre>
            </div>
          )}

          {tab === "orbat" && (
            <div className="w-full">
              <OrbatBuilder value={group.orbat ?? undefined} readOnly />
            </div>
          )}

          {tab === "apply" && (
            <div className="max-w-2xl">
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-2">Application Questions</h2>
                <p className="text-sm text-muted-foreground font-sans mb-6">
                  To apply to <strong className="text-foreground">{group.name}</strong>, reach out on their
                  {group.discordUrl ? (
                    <> <a href={group.discordUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Discord</a> and </>) : " "}
                  be ready to answer the following:
                </p>
                <ol className="space-y-4">
                  {group.questions.map((q, i) => (
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
            </div>
          )}

        </motion.div>
      </div>
    </MainLayout>
  );
}
