import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRoute, Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import {
  Shield, Globe, ExternalLink, Loader2, Users, Award, Crosshair,
  FileText, ChevronLeft, Star, BookOpen, Map
} from "lucide-react";

interface Role { id: number; name: string; description: string | null; sortOrder: number }
interface Rank { id: number; name: string; abbreviation: string | null; tier: number }
interface RosterEntry { id: number; callsign: string; rankId: number | null; roleId: number | null; notes: string | null }
interface AppQuestion { id: number; question: string; sortOrder: number; required: boolean }

interface GroupDetail {
  id: number; name: string; slug: string; tagLine: string | null;
  description: string | null; discordUrl: string | null; websiteUrl: string | null;
  logoUrl: string | null; sops: string | null; orbat: string | null;
  status: string; createdAt: string;
  roles: Role[]; ranks: Rank[]; roster: RosterEntry[]; questions: AppQuestion[];
}

type Tab = "overview" | "roles" | "ranks" | "roster" | "sops" | "orbat" | "apply";

export default function MilsimGroup() {
  const [, params] = useRoute("/milsim/:slug");
  const slug = params?.slug ?? "";
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!slug) return;
    apiFetch<GroupDetail>(`/api/milsim-groups/${slug}`)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [slug]);

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

  const TABS: { id: Tab; label: string; icon: typeof Shield; show: boolean }[] = [
    { id: "overview", label: "Overview", icon: Shield, show: true },
    { id: "roles", label: "Roles", icon: Crosshair, show: group.roles.length > 0 },
    { id: "ranks", label: "Ranks", icon: Award, show: group.ranks.length > 0 },
    { id: "roster", label: "Roster", icon: Users, show: group.roster.length > 0 },
    { id: "sops", label: "SOPs", icon: BookOpen, show: !!group.sops },
    { id: "orbat", label: "ORBAT", icon: Map, show: !!group.orbat },
    { id: "apply", label: "Apply", icon: FileText, show: group.questions.length > 0 },
  ];

  return (
    <MainLayout>
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
              </div>
              {group.tagLine && (
                <p className="font-display font-bold uppercase tracking-widest text-primary text-sm mb-3">{group.tagLine}</p>
              )}
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
                <span className="text-xs text-muted-foreground font-sans">
                  {group.roster.length} member{group.roster.length !== 1 ? "s" : ""}
                </span>
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
                }`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
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
                  { label: "Roles", value: group.roles.length, icon: Crosshair },
                  { label: "Ranks", value: group.ranks.length, icon: Award },
                  { label: "Members", value: group.roster.length, icon: Users },
                  { label: "App Questions", value: group.questions.length, icon: FileText },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card border border-border rounded-lg p-4 text-center">
                    <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <div className="font-display font-black text-2xl text-foreground">{stat.value}</div>
                    <div className="font-display text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
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
                      <td className="py-3 px-4 text-sm text-muted-foreground font-sans">
                        {entry.rankId ? rankById[entry.rankId]?.name ?? "—" : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground font-sans">
                        {entry.roleId ? roleById[entry.roleId]?.name ?? "—" : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground font-sans">{entry.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "sops" && (
            <div className="max-w-3xl prose-invert">
              <pre className="bg-card border border-border rounded-lg p-6 font-sans text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {group.sops}
              </pre>
            </div>
          )}

          {tab === "orbat" && (
            <div className="max-w-3xl">
              <pre className="bg-card border border-border rounded-lg p-6 font-sans text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {group.orbat}
              </pre>
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
