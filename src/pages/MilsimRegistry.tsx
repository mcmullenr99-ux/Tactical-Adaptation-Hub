import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useSEO } from "@/hooks/useSEO";
import { Shield, Globe, Star, Users, Plus, Loader2, Trophy, CheckCircle2, Zap, TrendingUp, Search, Filter, Share2, Copy, Check, MessageSquare, Swords } from "lucide-react";
import { CountryFlag, normaliseCountry } from "@/components/CountryFlag";

interface MilsimGroup {
  id: string;
  name: string;
  slug: string;
  tag_line?: string | null;
  description?: string | null;
  discord_url?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  status: string;
  created_date?: string;
  is_pro?: boolean;
  last_op_date?: string | null;
  last_aar_date?: string | null;
  games?: string[] | null;
  country?: string | null;
  language?: string | null;
  is_verified?: boolean;
  verification_score?: number | null;
  verify_override?: boolean;
  tags?: string[] | null;
}

const GAMES = [
  "Arma 3","Arma Reforger","Squad","Hell Let Loose","DayZ",
  "Ground Branch","Ready Or Not","Escape from Tarkov","Gray Zone Warfare",
  "Body Cam","Operator","Zero Hour","Exfil"
];

const COUNTRIES = [
  "United Kingdom","United States","Australia","Canada","Germany",
  "France","Netherlands","Poland","Norway","Sweden","New Zealand","Other"
];


// Inline monochrome SVG flags — currentColor = theme-aware

function isVerifiedGroup(group: MilsimGroup): boolean {
  if (group.verify_override) return true;
  if (!group.is_verified) return false;
  return true;
}

function ShareButton({ group }: { group: MilsimGroup }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/milsim/${group.slug || group.id}`;
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); copy(); }}
      className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-border hover:border-primary/40"
      title="Copy unit link"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

function GroupCard({ group, index, featured }: { group: MilsimGroup; index: number; featured?: boolean }) {
  const verified = isVerifiedGroup(group);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/milsim/${group.slug || group.id}`}>
        <div className={`group bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-all cursor-pointer h-full flex flex-col ${featured ? "border-accent/50" : "border-border"}`}>
          {/* Banner */}
          <div className="relative h-28 bg-secondary overflow-hidden flex-shrink-0">
            {group.banner_url ? (
              <img src={group.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary to-background flex items-center justify-center">
                <Shield className="w-10 h-10 text-border" />
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-2 right-2 flex gap-1.5">
              {featured && <span className="px-2 py-0.5 bg-accent/90 text-black text-[10px] font-display font-bold uppercase tracking-wider rounded">Featured</span>}
              {group.is_pro && <span className="px-2 py-0.5 bg-amber-500/90 text-black text-[10px] font-display font-bold uppercase tracking-wider rounded flex items-center gap-1"><Star className="w-2.5 h-2.5" />Pro</span>}
              {verified && <span className="px-2 py-0.5 bg-primary/90 text-black text-[10px] font-display font-bold uppercase tracking-wider rounded flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />Verified</span>}
            </div>
          </div>

          {/* Content */}
          <div className="pt-3 pb-4 px-4 flex flex-col flex-1 gap-2">
            {/* Logo + Name row */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border border-border bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                {group.logo_url ? (
                  <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                ) : (
                  <Shield className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-display font-bold text-lg uppercase tracking-wider text-foreground leading-tight">{group.name}</h3>
            </div>
            {group.tag_line && <p className="text-xs text-muted-foreground font-sans leading-relaxed line-clamp-2">{group.tag_line}</p>}

            {/* Games */}
            {group.games && group.games.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {group.games.slice(0, 3).map(g => (
                  <span key={g} className="text-[10px] font-mono px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground">{g}</span>
                ))}
                {group.games.length > 3 && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground">+{group.games.length - 3}</span>}
              </div>
            )}

            {/* Meta row */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                {group.country && (
                <span className="flex items-center gap-1.5">
                  <CountryFlag country={group.country} />
                  <span>{normaliseCountry(group.country)}</span>
                </span>
              )}
                {group.last_op_date && (
                  <span className="flex items-center gap-1 text-green-400/70">
                    <TrendingUp className="w-3 h-3" />Active
                  </span>
                )}
              </div>
              <ShareButton group={group} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
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
        <span className="col-span-3">Games</span>
        <span className="col-span-2">Status</span>
        <span className="col-span-1"></span>
      </div>
      {groups.map((g, i) => (
        <Link key={g.id} href={`/milsim/${g.slug || g.id}`}>
          <div className="grid grid-cols-12 items-center px-4 py-3 bg-card border border-border rounded hover:border-primary/40 transition-all cursor-pointer gap-2">
            <span className="col-span-1 font-display font-black text-lg text-muted-foreground">#{i + 1}</span>
            <div className="col-span-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                {g.logo_url ? <img src={g.logo_url} alt={g.name} className="w-full h-full object-cover" /> : <Shield className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div>
                <div className="font-display font-bold text-sm uppercase tracking-wider text-foreground leading-tight">{g.name}</div>
                {g.country && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                    <CountryFlag country={g.country} />
                    <span>{normaliseCountry(g.country)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-3 flex flex-wrap gap-1">
              {(g.games ?? []).slice(0, 2).map(game => (
                <span key={game} className="text-[9px] font-mono px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground">{game}</span>
              ))}
            </div>
            <div className="col-span-2 flex gap-1 flex-wrap">
              {g.is_pro && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-display font-bold uppercase tracking-wider rounded">Pro</span>}
              {isVerifiedGroup(g) && <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[9px] font-display font-bold uppercase tracking-wider rounded">Verified</span>}
              {g.last_op_date && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-display font-bold uppercase tracking-wider rounded">Active</span>}
            </div>
            <div className="col-span-1 flex justify-end">
              <ShareButton group={g} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function MilsimRegistry() {
  useSEO({ title: "MilSim Registry", description: "Browse registered MilSim groups on the TAG platform — find your unit and enlist in organised tactical play." });
  const [groups, setGroups] = useState<MilsimGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "leaderboard">("grid");
  const [search, setSearch] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [filterCountry, setFilterCountry] = useState("");

  useEffect(() => {
    apiFetch<MilsimGroup[]>("/api/milsim-groups")
      .then(data => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q) || (g.tag_line ?? "").toLowerCase().includes(q);
    const matchGame = !filterGame || (g.games ?? []).includes(filterGame);
    const matchCountry = !filterCountry || normaliseCountry(g.country) === filterCountry;
    return matchSearch && matchGame && matchCountry;
  });

  const featured = filtered.filter(g => g.status === "featured");
  const approved = filtered.filter(g => g.status === "approved");

  const leaderboard = [...filtered]
    .filter(g => g.status === "approved" || g.status === "featured")
    .sort((a, b) => {
      if (isVerifiedGroup(b) !== isVerifiedGroup(a)) return isVerifiedGroup(b) ? 1 : -1;
      if ((b.is_pro ? 1 : 0) !== (a.is_pro ? 1 : 0)) return (b.is_pro ? 1 : 0) - (a.is_pro ? 1 : 0);
      if ((b.status === "featured" ? 1 : 0) !== (a.status === "featured" ? 1 : 0)) return (b.status === "featured" ? 1 : 0) - (a.status === "featured" ? 1 : 0);
      return a.name.localeCompare(b.name);
    });

  const [location] = useLocation();
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
              Registered tactical units on the TAG platform. Browse, filter and find your next unit — or register your own.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Community Tab Navigation */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0">
            <Link href="/milsim" className={`flex items-center gap-2 px-5 py-3.5 text-sm font-display font-bold uppercase tracking-widest border-b-2 transition-colors ${location === "/milsim" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Shield className="w-3.5 h-3.5" /> Registry
            </Link>
            <Link href="/forum" className={`flex items-center gap-2 px-5 py-3.5 text-sm font-display font-bold uppercase tracking-widest border-b-2 transition-colors ${location === "/forum" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <MessageSquare className="w-3.5 h-3.5" /> Forums
            </Link>
            <Link href="/joint-ops" className={`flex items-center gap-2 px-5 py-3.5 text-sm font-display font-bold uppercase tracking-widest border-b-2 transition-colors ${location === "/joint-ops" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Swords className="w-3.5 h-3.5" /> Joint Operations
            </Link>
          </div>
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
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search units..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-secondary border border-border rounded pl-9 pr-4 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Game filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <select
                  value={filterGame}
                  onChange={e => setFilterGame(e.target.value)}
                  className="bg-secondary border border-border rounded pl-9 pr-4 py-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                >
                  <option value="">All Games</option>
                  {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Country filter */}
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              {/* CountryFlag shown in selected option via custom render if needed */}
                <select
                  value={filterCountry}
                  onChange={e => setFilterCountry(e.target.value)}
                  className="bg-secondary border border-border rounded pl-9 pr-4 py-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                >
                  <option value="">All Countries</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 border border-border rounded overflow-hidden">
                <button onClick={() => setView("grid")} className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-colors ${view === "grid" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>Grid</button>
                <button onClick={() => setView("leaderboard")} className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${view === "leaderboard" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>
                  <Trophy className="w-3 h-3" /> Leaderboard
                </button>
              </div>

              <Link
                href="/milsim/register"
                className="ml-auto inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Register Your Unit
              </Link>
            </div>

            {/* Results count */}
            <div className="text-xs font-mono text-muted-foreground mb-6">
              {filtered.filter(g => g.status === "approved" || g.status === "featured").length} unit{filtered.length !== 1 ? "s" : ""} found
              {(filterGame || filterCountry || search) && (
                <button onClick={() => { setSearch(""); setFilterGame(""); setFilterCountry(""); }} className="ml-3 text-primary hover:underline">Clear filters</button>
              )}
            </div>

            {view === "leaderboard" ? (
              <LeaderboardView groups={leaderboard} />
            ) : (
              <>
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
                      <p className="font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">No Units Found</p>
                      <p className="font-sans text-sm text-muted-foreground mb-6">
                        {search || filterGame || filterCountry ? "Try clearing your filters." : "Be the first to register your unit."}
                      </p>
                      {!search && !filterGame && !filterCountry && (
                        <Link href="/milsim/register" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded transition-all">
                          <Plus className="w-4 h-4" /> Register Now
                        </Link>
                      )}
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
