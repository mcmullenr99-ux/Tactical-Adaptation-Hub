import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useSEO } from "@/hooks/useSEO";
import { Shield, Globe, Star, Users, Plus, ExternalLink, Loader2, Trophy, CheckCircle2, Zap, TrendingUp } from "lucide-react";

interface MilsimGroup {
  id: number;
  name: string;
  slug: string;
  tagLine: string | null;
  description: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string;
  is_pro?: boolean;
  last_op_date?: string | null;
  last_aar_date?: string | null;
}

const PRO_STATUS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/getProStatus";

function isVerified(group: MilsimGroup): boolean {
  // Verified = Pro + has recent activity (op or AAR in last 60 days)
  if (!group.is_pro) return false;
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const lastOp = group.last_op_date ? new Date(group.last_op_date).getTime() : 0;
  const lastAar = group.last_aar_date ? new Date(group.last_aar_date).getTime() : 0;
  return Math.max(lastOp, lastAar) > cutoff;
}

export default function MilsimRegistry() {
  useSEO({ title: "MilSim Registry", description: "Browse TAG's registered MilSim groups — find your unit and enlist in organised tactical play." });
  const [groups, setGroups] = useState<MilsimGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "leaderboard">("grid");
  const [search, setSearch] = useState("");
  const [filterGame, setFilterGame] = useState("");

  useEffect(() => {
    apiFetch<MilsimGroup[]>("/api/milsim-groups")
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        // Fetch pro status for each group in parallel (batch)
        Promise.allSettled(
          list.map(g =>
            fetch(`${PRO_STATUS_URL}?group_id=${g.id}`)
              .then(r => r.json())
              .then(s => ({ id: g.id, is_pro: !!s.is_pro }))
              .catch(() => ({ id: g.id, is_pro: false }))
          )
        ).then(results => {
          const proMap: Record<number, boolean> = {};
          results.forEach(r => { if (r.status === "fulfilled") proMap[r.value.id] = r.value.is_pro; });
          setGroups(list.map(g => ({ ...g, is_pro: proMap[g.id] ?? false })));
        });
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q) || (g.tagLine ?? "").toLowerCase().includes(q);
    return matchSearch;
  });

  const featured = filtered.filter(g => g.status === "featured");
  const approved = filtered.filter(g => g.status === "approved");

  // Leaderboard: sort by pro first, then featured, then alphabetical
  const leaderboard = [...filtered]
    .filter(g => g.status === "approved" || g.status === "featured")
    .sort((a, b) => {
      if (isVerified(b) !== isVerified(a)) return isVerified(b) ? 1 : -1;
      if ((b.is_pro ? 1 : 0) !== (a.is_pro ? 1 : 0)) return (b.is_pro ? 1 : 0) - (a.is_pro ? 1 : 0);
      if ((b.status === "featured" ? 1 : 0) !== (a.status === "featured" ? 1 : 0)) return (b.status === "featured" ? 1 : 0) - (a.status === "featured" ? 1 : 0);
      return a.name.localeCompare(b.name);
    });

  return (
    <MainLayout>
      {/* Header */}
      <div className="relative bg-secondary/50 border-b border-border py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded text-primary font-display font-bold uppercase tracking-widest text-xs mb-5">
              <Shield className="w-3 h-3" /> MilSim Registry
            </div>
            <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tight mb-4">
              MilSim <span className="text-primary">Groups</span>
            </h1>
            <div className="w-24 h-1 bg-primary mb-5" />
            <p className="text-xl text-muted-foreground font-sans max-w-2xl">
              Registered tactical units operating within the TAG ecosystem. Browse featured groups, view rosters, SOPs, and apply to join.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <input
                type="text"
                placeholder="Search units..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-secondary border border-border rounded px-4 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 flex-1 min-w-[180px] max-w-xs"
              />
              <div className="flex items-center gap-1 border border-border rounded overflow-hidden">
                <button onClick={() => setView("grid")} className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-colors ${view === "grid" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>Grid</button>
                <button onClick={() => setView("leaderboard")} className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${view === "leaderboard" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>
                  <Trophy className="w-3 h-3" /> Leaderboard
                </button>
              </div>
              <Link
                href="/milsim/register"
                className="ml-auto inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Register Your Unit
              </Link>
            </div>

            {view === "leaderboard" ? (
              <LeaderboardView groups={leaderboard} />
            ) : (
              <>
                {/* Featured */}
                {featured.length > 0 && (
                  <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                      <Star className="w-5 h-5 text-accent" />
                      <h2 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">Featured Units</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {featured.map((g, i) => <GroupCard key={g.id} group={g} index={i} featured />)}
                    </div>
                  </section>
                )}

                {/* All */}
                <section>
                  <div className="flex items-center gap-3 mb-8">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">
                      {featured.length > 0 ? "All Registered Units" : "Registered Units"}
                    </h2>
                  </div>

                  {approved.length === 0 && featured.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-border rounded-lg">
                      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">No Groups Yet</p>
                      <p className="font-sans text-sm text-muted-foreground mb-6">Be the first to register your unit.</p>
                      <Link href="/milsim/register" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all">
                        <Plus className="w-4 h-4" /> Register Now
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {approved.map((g, i) => <GroupCard key={g.id} group={g} index={i} />)}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

function LeaderboardView({ groups }: { groups: MilsimGroup[] }) {
  if (groups.length === 0) return (
    <div className="text-center py-24 border border-dashed border-border rounded-lg">
      <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
      <p className="font-display font-bold uppercase tracking-wider text-muted-foreground">No units found</p>
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground px-4 pb-2 border-b border-border">
        <span className="col-span-1">#</span>
        <span className="col-span-5">Unit</span>
        <span className="col-span-2 text-center">Status</span>
        <span className="col-span-2 text-center">Tier</span>
        <span className="col-span-2 text-right">Profile</span>
      </div>
      {groups.map((g, i) => (
        <motion.div key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
          className={`grid grid-cols-12 items-center px-4 py-3 rounded-lg border transition-all hover:border-primary/40 ${
            i === 0 ? "border-yellow-500/40 bg-yellow-500/5" :
            i === 1 ? "border-zinc-400/30 bg-zinc-400/5" :
            i === 2 ? "border-amber-600/30 bg-amber-600/5" :
            "border-border bg-card"
          }`}>
          <span className={`col-span-1 font-display font-black text-lg ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
            {i + 1}
          </span>
          <div className="col-span-5 flex items-center gap-3">
            {g.logoUrl ? (
              <img src={g.logoUrl} alt={g.name} className="w-8 h-8 object-contain rounded" />
            ) : (
              <Shield className="w-8 h-8 text-muted-foreground/30" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-sm text-foreground">{g.name}</p>
                {isVerified(g) && (
                  <span title="TAG Verified Unit" className="flex items-center gap-0.5 text-[9px] font-display font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-[10px] font-sans text-muted-foreground truncate max-w-[160px]">{g.tagLine ?? ""}</p>
            </div>
          </div>
          <div className="col-span-2 flex justify-center">
            <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
              g.status === "featured" ? "bg-accent/20 text-accent border-accent/40" : "bg-primary/10 text-primary border-primary/30"
            }`}>{g.status}</span>
          </div>
          <div className="col-span-2 flex justify-center">
            {g.is_pro ? (
              <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded">
                <Zap className="w-2.5 h-2.5" /> Pro
              </span>
            ) : (
              <span className="text-[10px] font-sans text-muted-foreground">Free</span>
            )}
          </div>
          <div className="col-span-2 flex justify-end">
            <Link href={`/milsim/${g.slug}`}
              className="text-xs font-display font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1">
              View <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function GroupCard({ group, index, featured = false }: { group: MilsimGroup; index: number; featured?: boolean }) {
  const verified = isVerified(group);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`group bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-all ${featured ? "border-accent/40" : "border-border"}`}
    >
      <div className="relative h-32 bg-secondary/60 flex items-center justify-center overflow-hidden">
        {featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent/20 border border-accent/40 text-accent px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-widest z-10">
            <Star className="w-2.5 h-2.5" /> Featured
          </div>
        )}
        {group.is_pro && !featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-widest z-10">
            <Zap className="w-2.5 h-2.5" /> Pro
          </div>
        )}
        {group.logoUrl ? (
          <img src={group.logoUrl} alt={`${group.name} logo`} className="w-20 h-20 object-contain" />
        ) : (
          <Shield className="w-12 h-12 text-muted-foreground/30" />
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display font-black uppercase tracking-wider text-foreground text-lg truncate">
            {group.name}
          </h3>
          {verified && (
            <span title="TAG Verified Unit" className="shrink-0 flex items-center gap-0.5 text-[9px] font-display font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded">
              <CheckCircle2 className="w-2.5 h-2.5" /> Verified
            </span>
          )}
        </div>
        {group.tagLine && (
          <p className="text-xs text-primary font-display font-bold uppercase tracking-widest mb-3 truncate">{group.tagLine}</p>
        )}
        {group.description && (
          <p className="text-sm text-muted-foreground font-sans line-clamp-2 mb-4 leading-relaxed">
            {group.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/milsim/${group.slug}`}
            className="flex-1 text-center font-display font-bold uppercase tracking-wider text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded clip-angled-sm transition-all"
          >
            View Profile
          </Link>
          {group.discordUrl && (
            <a href={group.discordUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 border border-border hover:border-primary/40 rounded text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {group.websiteUrl && (
            <a href={group.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 border border-border hover:border-primary/40 rounded text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
