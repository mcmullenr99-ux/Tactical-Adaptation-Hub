import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useSEO } from "@/hooks/useSEO";
import {
  Shield, Globe, Star, Plus, ExternalLink, Loader2,
  Search, X, Filter, ChevronDown,
} from "lucide-react";
import {
  BRANCHES, UNIT_TYPES_BY_BRANCH, ALL_UNIT_TYPES, GAMES_LIST,
  COUNTRIES_LIST, LANGUAGES_LIST, BRANCH_ICONS, type Branch,
} from "@/lib/milsimConstants";

interface MilsimGroup {
  id: string;
  name: string;
  slug: string;
  tagLine: string | null;
  description: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string;
  country?: string;
  language?: string;
  branch?: string;
  unitType?: string;
  games?: string[];
  tags?: string[];
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function FilterDropdown({ label, options, value, onChange }: {
  label: string; options: readonly string[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-display font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
          active ? "bg-primary/15 border-primary/50 text-primary" : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground bg-card"
        }`}
      >
        {active ? value.replace(/^[^\s]+\s/, "") : label}
        {active
          ? <X className="w-3 h-3" onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }} />
          : <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.12 }}
            className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[200px] max-h-72 overflow-y-auto"
          >
            <button onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm font-sans text-muted-foreground hover:bg-secondary/60 transition-colors">
              All
            </button>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-sans transition-colors ${value === opt ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-secondary/60"}`}>
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Branch pill buttons (no emoji — SVG icons) ───────────────────────────────

const BRANCH_SVG: Record<string, React.ReactNode> = {
  "All":                <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current"><circle cx="6" cy="6" r="5" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none"/><path d="M6 1v10M1 6h10" strokeWidth="1" stroke="currentColor"/></svg>,
  "Army":               <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current"><path d="M6 1L1 4v1.5h1V10h8V5.5h1V4L6 1zm0 1.2L10 4.4V5H9v4H3V5H2v-.6L6 2.2z"/></svg>,
  "Marines":            <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current"><path d="M6 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 1a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 1.5a2 2 0 100 4 2 2 0 000-4z"/></svg>,
  "Air Force":          <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current"><path d="M6 1L5 4.5H2l2 1.5-1 4 3-2 3 2-1-4 2-1.5H7L6 1z"/></svg>,
  "Navy":               <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current"><path d="M2 7l4 3.5L10 7V5L6 2 2 5v2zm4 1.8L3.2 7 3 5.4 6 3.4l3 2-.2 1.6L6 8.8z"/></svg>,
  "Special Operations": <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current"><path d="M6 1l1.2 3.4H11L8.1 6.5 9.2 10 6 8l-3.2 2 1.1-3.5L1 4.4h3.8L6 1z"/></svg>,
  "Multi-Branch":       <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current"><circle cx="6" cy="6" r="4.5" fillOpacity=".1" stroke="currentColor" strokeWidth="1" fill="none"/><path d="M6 2v8M2 6h8" strokeWidth="1" stroke="currentColor"/><circle cx="6" cy="6" r="1.5"/></svg>,
};

function BranchFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
          value === "" ? "bg-primary/15 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
        }`}
      >
        <span className="text-current">{BRANCH_SVG["All"]}</span> All Branches
      </button>
      {BRANCHES.map(b => (
        <button
          key={b}
          onClick={() => onChange(value === b ? "" : b)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
            value === b ? "bg-primary/15 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          }`}
        >
          <span className="text-current">{BRANCH_SVG[b]}</span> {b}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MilsimRegistry() {
  useSEO({ title: "MilSim Registry", description: "Browse TAG's registered MilSim groups — find your unit and enlist." });
  const { data: groups = [], isLoading: loading } = useQuery<MilsimGroup[]>({
    queryKey: ["milsim-groups-public"],
    queryFn: () => apiFetch<MilsimGroup[]>("/api/milsim-groups"),
    // Registry data: fresh for 20 mins, stays in cache for 1 hour
    staleTime: 20 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterUnitType, setFilterUnitType] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "featured">("all");

  // When branch changes, reset unit type filter
  const handleBranchChange = (b: string) => { setFilterBranch(b); setFilterUnitType(""); };

  const anyFilterActive = !!(search || filterBranch || filterUnitType || filterGame || filterCountry || filterLanguage);
  const clearFilters = () => { setSearch(""); setFilterBranch(""); setFilterUnitType(""); setFilterGame(""); setFilterCountry(""); setFilterLanguage(""); };

  // Unit types shown depend on selected branch
  const unitTypeOptions: string[] = filterBranch
    ? UNIT_TYPES_BY_BRANCH[filterBranch as Branch] ?? ALL_UNIT_TYPES
    : ALL_UNIT_TYPES;

  const filtered = useMemo(() => {
    let list = groups.filter(g => g.status === "approved" || g.status === "featured");
    if (activeTab === "featured") list = list.filter(g => g.status === "featured");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        (g.tagLine ?? "").toLowerCase().includes(q) ||
        (g.description ?? "").toLowerCase().includes(q) ||
        (g.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (filterBranch) list = list.filter(g => (g.branch ?? "") === filterBranch);
    if (filterUnitType) list = list.filter(g => (g.unitType ?? "").toLowerCase().includes(filterUnitType.toLowerCase()));
    if (filterGame) list = list.filter(g => (g.games ?? []).some(gm => gm.toLowerCase().includes(filterGame.toLowerCase())));
    if (filterCountry) list = list.filter(g => (g.country ?? "").toLowerCase().includes(filterCountry.replace(/^[^\s]+\s/, "").toLowerCase()));
    if (filterLanguage) list = list.filter(g => (g.language ?? "").toLowerCase() === filterLanguage.toLowerCase());
    return list;
  }, [groups, search, filterBranch, filterUnitType, filterGame, filterCountry, filterLanguage, activeTab]);

  const featured = groups.filter(g => g.status === "featured");

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
              Registered tactical units operating within the TAG ecosystem. Browse by branch, unit type, and game.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Search + Register */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search units by name, tag line, or tag..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Link href="/milsim/register"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all active:scale-95 whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Register Your Unit
          </Link>
        </div>

        {/* Branch filter — pill row */}
        <div className="mb-4">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Branch</p>
          <BranchFilter value={filterBranch} onChange={handleBranchChange} />
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
            <Filter className="w-3 h-3" /> Refine:
          </div>
          {/* Unit type dropdown — context-aware based on selected branch */}
          <FilterDropdown
            label="Unit Type"
            options={unitTypeOptions}
            value={filterUnitType}
            onChange={setFilterUnitType}
          />
          <FilterDropdown label="Game" options={GAMES_LIST} value={filterGame} onChange={setFilterGame} />
          <FilterDropdown label="Country" options={COUNTRIES_LIST} value={filterCountry} onChange={setFilterCountry} />
          <FilterDropdown label="Language" options={LANGUAGES_LIST} value={filterLanguage} onChange={setFilterLanguage} />
          {anyFilterActive && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 font-display font-bold uppercase tracking-wider transition-colors">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border mb-6">
          {[
            { id: "all", label: `All Units (${groups.filter(g => g.status !== "pending").length})` },
            ...(featured.length > 0 ? [{ id: "featured", label: `Featured (${featured.length})` }] : []),
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as "all" | "featured")}
              className={`px-4 py-2.5 text-xs font-display font-bold uppercase tracking-widest border-b-2 transition-all ${
                activeTab === tab.id ? "border-primary text-foreground -mb-px" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 border border-dashed border-border rounded-lg">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            {anyFilterActive ? (
              <>
                <p className="font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">No units match your filters</p>
                <button onClick={clearFilters}
                  className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-sm px-5 py-2.5 rounded clip-angled-sm transition-all mt-4">
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              </>
            ) : (
              <>
                <p className="font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">No Groups Yet</p>
                <Link href="/milsim/register"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all mt-4">
                  <Plus className="w-4 h-4" /> Register Now
                </Link>
              </>
            )}
          </motion.div>
        ) : (
          <>
            {anyFilterActive && (
              <p className="text-xs text-muted-foreground font-sans mb-4">
                Showing <strong className="text-foreground">{filtered.length}</strong> unit{filtered.length !== 1 ? "s" : ""}
                {filterBranch && <span> · <span className="text-primary">{BRANCH_ICONS[filterBranch as Branch]} {filterBranch}</span></span>}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((g, i) => <GroupCard key={g.id} group={g} index={i} featured={g.status === "featured"} />)}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({ group, index, featured = false }: { group: MilsimGroup; index: number; featured?: boolean }) {
  return (
    <motion.div layout
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className={`group bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-all ${featured ? "border-accent/40" : "border-border"}`}
    >
      <div className="relative h-32 bg-secondary/60 flex items-center justify-center overflow-hidden">
        {featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent/20 border border-accent/40 text-accent px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-widest z-10">
            <Star className="w-2.5 h-2.5" /> Featured
          </div>
        )}
        {/* Branch badge */}
        {group.branch && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 border border-white/10 px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-widest z-10 text-white/70">
{group.branch}
          </div>
        )}
        {group.logoUrl
          ? <img src={group.logoUrl} alt={`${group.name} logo`} className="w-20 h-20 object-contain" />
          : <Shield className="w-12 h-12 text-muted-foreground/30" />
        }
      </div>

      <div className="p-5">
        <h3 className="font-display font-black uppercase tracking-wider text-foreground text-lg mb-1 truncate">{group.name}</h3>
        {group.tagLine && (
          <p className="text-xs text-primary font-display font-bold uppercase tracking-widest mb-2 truncate">{group.tagLine}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {group.unitType && (
            <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-primary">
              {group.unitType}
            </span>
          )}
          {group.country && (
            <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 bg-secondary border border-border rounded text-muted-foreground">
              {group.country.replace(/^[^\s]+\s/, "")}
            </span>
          )}
          {group.language && (
            <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 bg-secondary border border-border rounded text-muted-foreground">
              {group.language}
            </span>
          )}
          {(group.games ?? []).slice(0, 2).map(g => (
            <span key={g} className="text-[10px] font-sans px-2 py-0.5 bg-secondary border border-border rounded text-muted-foreground">{g}</span>
          ))}
          {(group.games ?? []).length > 2 && (
            <span className="text-[10px] font-sans px-2 py-0.5 bg-secondary border border-border rounded text-muted-foreground">
              +{(group.games ?? []).length - 2} more
            </span>
          )}
        </div>

        {group.description && (
          <p className="text-sm text-muted-foreground font-sans line-clamp-2 mb-4 leading-relaxed">{group.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <Link href={`/milsim/${group.slug}`}
            className="flex-1 text-center font-display font-bold uppercase tracking-wider text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded clip-angled-sm transition-all">
            View Profile
          </Link>
          {group.discordUrl && (
            <a href={group.discordUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 border border-border hover:border-primary/40 rounded text-muted-foreground hover:text-foreground transition-colors" title="Discord">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {group.websiteUrl && (
            <a href={group.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 border border-border hover:border-primary/40 rounded text-muted-foreground hover:text-foreground transition-colors" title="Website">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
