import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useSEO } from "@/hooks/useSEO";
import {
  Shield, Globe, Star, Users, Plus, ExternalLink, Loader2, Trophy,
  CheckCircle2, Zap, TrendingUp, Map, Gamepad2, BarChart3, Crown
} from "lucide-react";

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
  games?: string[];
  country?: string | null;
  language?: string | null;
  branch?: string | null;
  unit_type?: string | null;
  roster_count?: number;
  op_success_rate?: number | null; // 0-100, calculated from AARs
  total_ops?: number;
}

const PRO_STATUS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/getProStatus";

// Regions mapped from country field
const REGION_MAP: Record<string, string> = {
  // Europe
  "🇬🇧 United Kingdom": "EU", "🇩🇪 Germany": "EU", "🇫🇷 France": "EU",
  "🇮🇹 Italy": "EU", "🇵🇱 Poland": "EU", "🇳🇱 Netherlands": "EU",
  "🇳🇴 Norway": "EU", "🇸🇪 Sweden": "EU", "🇩🇰 Denmark": "EU",
  "🇧🇪 Belgium": "EU", "🇪🇸 Spain": "EU", "🇵🇹 Portugal": "EU",
  "🇨🇿 Czech Republic": "EU", "🇸🇰 Slovakia": "EU", "🇭🇺 Hungary": "EU",
  "🇷🇴 Romania": "EU", "🇧🇬 Bulgaria": "EU", "🇬🇷 Greece": "EU",
  "🇭🇷 Croatia": "EU", "🇷🇸 Serbia": "EU", "🇺🇦 Ukraine": "EU",
  "🇫🇮 Finland": "EU", "🇦🇹 Austria": "EU", "🇨🇭 Switzerland": "EU",
  "🇱🇺 Luxembourg": "EU", "🇮🇪 Ireland": "EU", "🇱🇹 Lithuania": "EU",
  "🇱🇻 Latvia": "EU", "🇪🇪 Estonia": "EU", "🇸🇮 Slovenia": "EU",
  // North America
  "🇺🇸 United States": "NA", "🇨🇦 Canada": "NA", "🇲🇽 Mexico": "NA",
  // South America
  "🇧🇷 Brazil": "SA", "🇦🇷 Argentina": "SA", "🇨🇱 Chile": "SA",
  "🇨🇴 Colombia": "SA", "🇵🇪 Peru": "SA", "🇻🇪 Venezuela": "SA",
  "🇺🇾 Uruguay": "SA", "🇪🇨 Ecuador": "SA", "🇧🇴 Bolivia": "SA",
  // Middle East
  "🇹🇷 Turkey": "ME", "🇸🇦 Saudi Arabia": "ME", "🇮🇱 Israel": "ME",
  "🇦🇪 UAE": "ME", "🇶🇦 Qatar": "ME", "🇰🇼 Kuwait": "ME",
  "🇮🇶 Iraq": "ME", "🇮🇷 Iran": "ME", "🇯🇴 Jordan": "ME",
  "🇱🇧 Lebanon": "ME", "🇪🇬 Egypt": "ME", "🇲🇦 Morocco": "ME",
  // Africa
  "🇿🇦 South Africa": "AF", "🇳🇬 Nigeria": "AF", "🇰🇪 Kenya": "AF",
  "🇬🇭 Ghana": "AF", "🇪🇹 Ethiopia": "AF", "🇹🇿 Tanzania": "AF",
  // Asia
  "🇯🇵 Japan": "ASIA", "🇰🇷 South Korea": "ASIA", "🇨🇳 China": "ASIA",
  "🇮🇳 India": "ASIA", "🇵🇰 Pakistan": "ASIA", "🇧🇩 Bangladesh": "ASIA",
  "🇻🇳 Vietnam": "ASIA", "🇹🇭 Thailand": "ASIA", "🇵🇭 Philippines": "ASIA",
  "🇮🇩 Indonesia": "ASIA", "🇲🇾 Malaysia": "ASIA", "🇸🇬 Singapore": "ASIA",
  "🇹🇼 Taiwan": "ASIA", "🇭🇰 Hong Kong": "ASIA",
  // Oceania
  "🇦🇺 Australia": "OCE", "🇳🇿 New Zealand": "OCE",
  "🇵🇬 Papua New Guinea": "OCE", "🇫🇯 Fiji": "OCE",
};

function getRegion(country: string | null | undefined): string {
  if (!country) return "INTL";
  return REGION_MAP[country] ?? "INTL";
}

function isVerified(group: MilsimGroup): boolean {
  return !!(group as any).is_verified;
}

type LeaderboardCategory = "region" | "game" | "troop_count" | "op_success";

export default function MilsimRegistry() {
  useSEO({ title: "MilSim Registry", description: "Browse TAG's registered MilSim groups — find your unit and enlist in organised tactical play." });
  const [groups, setGroups] = useState<MilsimGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "leaderboard">("grid");
  const [upvoteCounts, setUpvoteCounts] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<"default" | "upvotes">("default");
  const [search, setSearch] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [lbCategory, setLbCategory] = useState<LeaderboardCategory>("region");

  useEffect(() => {
    // Also fetch upvote counts
    apiFetch<Record<string, number>>("/api/group-upvotes?path=/counts").then(setUpvoteCounts).catch(() => {});

    Promise.all([
      apiFetch<MilsimGroup[]>("/api/milsim-groups"),
      apiFetch<{ group_id: number; op_success_rate: number; total_ops: number; roster_count: number }[]>("/api/milsim-groups/leaderboard-stats").catch(() => []),
    ]).then(([data, stats]) => {
      const list = Array.isArray(data) ? data : [];
      const statsMap: Record<number, { op_success_rate: number; total_ops: number; roster_count: number }> = {};
      if (Array.isArray(stats)) {
        stats.forEach(s => { statsMap[s.group_id] = { op_success_rate: s.op_success_rate, total_ops: s.total_ops, roster_count: s.roster_count }; });
      }

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
        setGroups(list.map(g => ({
          ...g,
          is_pro: proMap[g.id] ?? false,
          op_success_rate: statsMap[g.id]?.op_success_rate ?? null,
          total_ops: statsMap[g.id]?.total_ops ?? 0,
          roster_count: statsMap[g.id]?.roster_count ?? 0,
        })));
      });
    })
    .catch(() => setGroups([]))
    .finally(() => setLoading(false));
  }, []);

  // Distinct games and regions for filter dropdowns
  const allGames = useMemo(() => {
    const set = new Set<string>();
    groups.forEach(g => (g.games ?? []).forEach(game => set.add(game)));
    return Array.from(set).sort();
  }, [groups]);

  const allRegions = useMemo(() => {
    const set = new Set<string>();
    groups.forEach(g => set.add(getRegion(g.country)));
    return Array.from(set).sort();
  }, [groups]);

  const allBranches = useMemo(() => {
    const set = new Set<string>();
    groups.forEach(g => { if (g.branch) set.add(g.branch); });
    return Array.from(set).sort();
  }, [groups]);

  const filtered = groups.filter(g => {
    if (g.status !== "approved" && g.status !== "featured") return false;
    const q = search.toLowerCase();
    if (q && !g.name.toLowerCase().includes(q) && !(g.tagLine ?? "").toLowerCase().includes(q)) return false;
    if (filterGame && !(g.games ?? []).includes(filterGame)) return false;
    if (filterRegion && getRegion(g.country) !== filterRegion) return false;
    if (filterBranch && g.branch !== filterBranch) return false;
    return true;
  });

  const sortedFiltered = sortBy === "upvotes"
    ? [...filtered].sort((a, b) => (upvoteCounts[b.id] ?? 0) - (upvoteCounts[a.id] ?? 0))
    : filtered;
  const featured = sortedFiltered.filter(g => g.status === "featured");
  const proApproved = sortedFiltered.filter(g => g.status === "approved" && g.is_pro);
  const approved = sortedFiltered.filter(g => g.status === "approved" && !g.is_pro);

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
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <input
                type="text"
                placeholder="Search units..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-secondary border border-border rounded px-4 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 flex-1 min-w-[180px] max-w-xs"
              />
              <div className="flex items-center gap-1 border border-border rounded overflow-hidden">
                <button onClick={() => setView("grid")}
                  className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-colors ${view === "grid" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>
                  Grid
                </button>
                <button onClick={() => setView("leaderboard")}
                  className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${view === "leaderboard" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>
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

            {/* Filters row — only show in grid view */}
            {view === "grid" && (
              <div className="flex flex-wrap items-center gap-2 mb-10">
                <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mr-1">Filter:</span>
                {/* Sort toggle */}
                <div className="flex items-center gap-1 border border-border rounded overflow-hidden mr-2">
                  <button onClick={() => setSortBy("default")}
                    className={`px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${sortBy === "default" ? "bg-primary/20 text-primary border-r border-border" : "text-muted-foreground hover:text-foreground border-r border-border"}`}>
                    Default
                  </button>
                  <button onClick={() => setSortBy("upvotes")}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${sortBy === "upvotes" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <TrendingUp className="w-3 h-3" /> Most Supported
                  </button>
                </div>
                {/* Game filter */}
                <select value={filterGame} onChange={e => setFilterGame(e.target.value)}
                  className="bg-secondary border border-border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-foreground focus:outline-none focus:border-primary/50">
                  <option value="">All Games</option>
                  {allGames.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                {/* Region filter */}
                <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
                  className="bg-secondary border border-border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-foreground focus:outline-none focus:border-primary/50">
                  <option value="">All Regions</option>
                  {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {/* Branch filter */}
                <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
                  className="bg-secondary border border-border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-foreground focus:outline-none focus:border-primary/50">
                  <option value="">All Branches</option>
                  {allBranches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {(filterGame || filterRegion || filterBranch) && (
                  <button onClick={() => { setFilterGame(""); setFilterRegion(""); setFilterBranch(""); }}
                    className="text-[10px] font-display font-bold uppercase tracking-widest text-destructive hover:text-destructive/80 transition-colors px-2 py-1.5">
                    ✕ Clear
                  </button>
                )}
                <span className="ml-auto text-xs text-muted-foreground font-sans">{filtered.length} unit{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            )}

            {view === "leaderboard" ? (
              <LeaderboardView groups={filtered} category={lbCategory} setCategory={setLbCategory} />
            ) : (
              <>
                {featured.length > 0 && (
                  <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                      <Star className="w-5 h-5 text-accent" />
                      <h2 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">Featured Units</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {featured.map((g, i) => <GroupCard key={g.id} group={g} index={i} featured upvoteCount={upvoteCounts[g.id] ?? 0} />)}
                    </div>
                  </section>
                )}
                {proApproved.length > 0 && (
                  <section className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                      <Zap className="w-4 h-4 text-primary" />
                      <h2 className="font-display font-black text-lg uppercase tracking-wider text-foreground">Commander Pro Units</h2>
                      <span className="text-[9px] font-display font-bold uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded">Pro</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {proApproved.map((g, i) => <GroupCard key={g.id} group={g} index={i} upvoteCount={upvoteCounts[g.id] ?? 0} />)}
                    </div>
                  </section>
                )}
                <section>
                  <div className="flex items-center gap-3 mb-8">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">
                      {featured.length > 0 || proApproved.length > 0 ? "All Registered Units" : "Registered Units"}
                    </h2>
                  </div>
                  {approved.length === 0 && featured.length === 0 && proApproved.length === 0 ? (
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
                      {approved.map((g, i) => <GroupCard key={g.id} group={g} index={i} upvoteCount={upvoteCounts[g.id] ?? 0} />)}
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

// ─── Leaderboard ──────────────────────────────────────────────────────────────

const LB_CATEGORIES: { id: LeaderboardCategory; label: string; icon: typeof Trophy; description: string }[] = [
  { id: "region",       label: "By Region",        icon: Map,       description: "Top unit in each global region" },
  { id: "game",         label: "By Game",           icon: Gamepad2,  description: "Select a game to see the top units" },
  { id: "troop_count",  label: "Troop Count",       icon: Users,     description: "Largest active rosters on the platform" },
  { id: "op_success",   label: "Op Success Rate",   icon: BarChart3, description: "Highest verified mission success rate from AARs (min 3 ops · anti-cheat enforced)" },
];

const PAGE_SIZE = 10;

function Paginator({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 transition-all">
        ‹
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)}
          className={`w-8 h-8 flex items-center justify-center rounded border text-xs font-display font-bold transition-all ${
            p === page ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
          }`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 transition-all">
        ›
      </button>
    </div>
  );
}

function LeaderboardView({ groups, category, setCategory }: { groups: MilsimGroup[]; category: LeaderboardCategory; setCategory: (c: LeaderboardCategory) => void }) {
  const allGamesForLb = useMemo(() => {
    const set = new Set<string>();
    groups.forEach(g => (g.games ?? []).forEach(game => set.add(game)));
    return Array.from(set).sort();
  }, [groups]);

  const [selectedGame, setSelectedGame] = useState<string>("");
  const [page, setPage] = useState(1);

  // Reset page when category or game changes
  const handleCategory = (c: LeaderboardCategory) => { setCategory(c); setPage(1); };
  const handleGame = (g: string) => { setSelectedGame(g); setPage(1); };

  // Set default game when category is "game"
  useEffect(() => {
    if (category === "game" && !selectedGame && allGamesForLb.length > 0) {
      setSelectedGame(allGamesForLb[0]);
    }
  }, [category, allGamesForLb, selectedGame]);

  const { rows, totalRows } = useMemo(
    () => buildLeaderboardRows(groups, category, selectedGame, page),
    [groups, category, selectedGame, page]
  );

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {LB_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => handleCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
              category === cat.id
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
            }`}>
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* By Game — subtitle */}
      {category === "game" && (
        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Top unit in each supported game</p>
      )}

      {/* Description */}
      <p className="text-xs text-muted-foreground font-sans">
        {LB_CATEGORIES.find(c => c.id === category)?.description}
      </p>

      {rows.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-lg">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-display font-bold uppercase tracking-wider text-muted-foreground">
            {category === "op_success" ? "No Verified units with enough ops yet" : "Not enough data yet"}
          </p>
          <p className="text-xs text-muted-foreground font-sans mt-2">
            {category === "op_success"
              ? "Units must be Verified (Pro + active) and file ≥3 AARs with participants listed to qualify."
              : "File AARs and log ops to appear on the leaderboard."}
          </p>
        </div>
      ) : (
        <>
          <LbTable rows={rows} startRank={(page - 1) * PAGE_SIZE + 1} />
          <Paginator page={page} total={totalRows} onPage={setPage} />
        </>
      )}
    </div>
  );
}

interface LbRow { group: MilsimGroup; score: string; scoreLabel: string; dividerLabel?: string }

function buildLeaderboardRows(
  groups: MilsimGroup[],
  category: LeaderboardCategory,
  selectedGame: string,
  page: number
): { rows: LbRow[]; totalRows: number } {
  const eligible = groups.filter(g => g.status === "approved" || g.status === "featured");

  let sorted: LbRow[] = [];

  if (category === "region") {
    // Group by region, flatten into ranked list with dividers handled in render
    const byRegion: Record<string, MilsimGroup[]> = {};
    eligible.forEach(g => {
      const r = getRegion(g.country);
      if (!byRegion[r]) byRegion[r] = [];
      byRegion[r].push(g);
    });
    const regionOrder = ["EU", "NA", "SA", "ME", "AF", "ASIA", "OCE", "INTL"];
    const regionLabels: Record<string, string> = {
      EU: "Europe", NA: "North America", SA: "South America",
      ME: "Middle East", AF: "Africa", ASIA: "Asia", OCE: "Oceania", INTL: "International",
    };
    // For region: we paginate per-region top 5, all regions together
    sorted = regionOrder.flatMap(r => {
      const regionGroups = (byRegion[r] ?? [])
        .sort((a, b) => {
          if (isVerified(b) !== isVerified(a)) return isVerified(b) ? 1 : -1;
          if ((b.is_pro ? 1 : 0) !== (a.is_pro ? 1 : 0)) return (b.is_pro ? 1 : 0) - (a.is_pro ? 1 : 0);
          return a.name.localeCompare(b.name);
        })
        .slice(0, 5);
      if (regionGroups.length === 0) return [];
      return regionGroups.map((g, idx) => ({
        group: g,
        score: isVerified(g) ? "Verified" : g.is_pro ? "Pro" : "Active",
        scoreLabel: regionLabels[r] ?? r,
        dividerLabel: idx === 0 ? (regionLabels[r] ?? r) : undefined,
      }));
    });
    // Region doesn't paginate the same way — show all (max 5*5=25), no page
    return { rows: sorted, totalRows: sorted.length };
  }

  if (category === "game") {
    // Show top-5 per game with game dividers (same pattern as By Region)
    const allGameNames = Array.from(
      new Set(eligible.flatMap(g => g.games ?? []))
    ).sort();
    sorted = allGameNames.flatMap(game => {
      const inGame = eligible
        .filter(g => (g.games ?? []).includes(game))
        .sort((a, b) => {
          if (isVerified(b) !== isVerified(a)) return isVerified(b) ? 1 : -1;
          if ((b.is_pro ? 1 : 0) !== (a.is_pro ? 1 : 0)) return (b.is_pro ? 1 : 0) - (a.is_pro ? 1 : 0);
          return (b.roster_count ?? 0) - (a.roster_count ?? 0);
        })
        .slice(0, 5);
      if (inGame.length === 0) return [];
      return inGame.map((g, idx) => ({
        group: g,
        score: `${g.roster_count ?? 0}`,
        scoreLabel: "troops",
        dividerLabel: idx === 0 ? game : undefined,
      }));
    });
    return { rows: sorted, totalRows: sorted.length };
  }

  if (category === "troop_count") {
    sorted = eligible
      .filter(g => (g.roster_count ?? 0) > 0)
      .sort((a, b) => (b.roster_count ?? 0) - (a.roster_count ?? 0))
      .map(g => ({ group: g, score: `${g.roster_count ?? 0}`, scoreLabel: "troops" }));
    return { rows: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), totalRows: sorted.length };
  }

  if (category === "op_success") {
    sorted = eligible
      .filter(g => (g.total_ops ?? 0) >= 3 && g.op_success_rate !== null && g.op_success_rate !== undefined)
      .sort((a, b) => (b.op_success_rate ?? 0) - (a.op_success_rate ?? 0))
      .map(g => ({ group: g, score: `${Math.round(g.op_success_rate ?? 0)}%`, scoreLabel: `${g.total_ops ?? 0} ops` }));
    return { rows: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), totalRows: sorted.length };
  }

  return { rows: [], totalRows: 0 };
}

function LbTable({ rows, startRank }: { rows: LbRow[]; startRank: number }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const rank = startRank + i;
        return (
          <div key={row.group.id}>
            {row.dividerLabel && (
              <div className="flex items-center gap-3 pt-4 pb-1 first:pt-0">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground px-2">{row.dividerLabel}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-all hover:border-primary/40 ${
              rank === 1 ? "border-yellow-500/40 bg-yellow-500/5" :
              rank === 2 ? "border-zinc-400/30 bg-zinc-400/5" :
              rank === 3 ? "border-amber-600/30 bg-amber-600/5" :
              "border-border bg-card"
            }`}>
            {/* Rank */}
            <span className={`w-7 text-center font-display font-black text-lg shrink-0 ${
              rank === 1 ? "text-yellow-400" : rank === 2 ? "text-zinc-400" : rank === 3 ? "text-amber-600" : "text-muted-foreground"
            }`}>{rank}</span>

            {/* Logo */}
            <div className="w-8 h-8 shrink-0 flex items-center justify-center">
              {row.group.logoUrl
                ? <img src={row.group.logoUrl} alt={row.group.name} className="w-8 h-8 object-contain rounded" />
                : <Shield className="w-6 h-6 text-muted-foreground/30" />
              }
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-sm text-foreground">{row.group.name}</span>
                {isVerified(row.group) && (
                  <span className="flex items-center gap-0.5 text-[9px] font-display font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
                {row.group.is_pro && !isVerified(row.group) && (
                  <span className="flex items-center gap-0.5 text-[9px] font-display font-bold uppercase tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 rounded">
                    <Crown className="w-2.5 h-2.5" /> Pro
                  </span>
                )}
              </div>
              <p className="text-[10px] font-sans text-muted-foreground">{row.scoreLabel}</p>
            </div>

            {/* Score */}
            <div className="shrink-0 text-right">
              <p className={`font-display font-black text-base ${rank === 1 ? "text-yellow-400" : "text-foreground"}`}>{row.score}</p>
            </div>

            {/* Link */}
            <Link href={`/milsim/${row.group.slug}`}
              className="shrink-0 text-xs font-display font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1 ml-2">
              View <ExternalLink className="w-3 h-3" />
            </Link>
          </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({ group, index, featured = false, upvoteCount = 0 }: { group: MilsimGroup; index: number; featured?: boolean; upvoteCount?: number }) {
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

        {/* Mini stats row */}
        <div className="flex items-center gap-4 mb-3">
          {(group.roster_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-sans text-muted-foreground">
              <Users className="w-3 h-3" /> {group.roster_count}
            </span>
          )}
          {group.op_success_rate !== null && group.op_success_rate !== undefined && (group.total_ops ?? 0) >= 3 && (
            <span className="flex items-center gap-1 text-[10px] font-sans text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-400" /> {Math.round(group.op_success_rate)}% success
            </span>
          )}
          {upvoteCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-wider text-primary/80">
              <TrendingUp className="w-3 h-3" /> {upvoteCount}
            </span>
          )}
          {group.country && (
            <span className="text-[10px] font-sans text-muted-foreground">{getRegion(group.country)}</span>
          )}
        </div>

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
