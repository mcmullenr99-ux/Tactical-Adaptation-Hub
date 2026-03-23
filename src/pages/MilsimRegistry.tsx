import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useSEO } from "@/hooks/useSEO";
import {
  Shield, Globe, Star, Users, Plus, ExternalLink, Loader2,
  Search, X, Filter, ChevronDown,
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
  country?: string;
  language?: string;
  unitType?: string;
  games?: string[];
  tags?: string[];
}

// ─── Filter options ────────────────────────────────────────────────────────────

const GAMES = [
  "Arma 3", "Arma Reforger", "DCS World", "Squad", "Hell Let Loose",
  "Post Scriptum", "Insurgency: Sandstorm", "GHPC", "Foxhole", "Other",
];

const UNIT_TYPES = [
  "Infantry", "Armour", "Mechanized", "Motorized", "Special Forces",
  "Aviation", "Artillery", "Logistics", "Reconnaissance", "Engineers",
  "Naval", "Mixed Arms", "Other",
];

const COUNTRIES = [
  "🇬🇧 United Kingdom", "🇺🇸 United States", "🇨🇦 Canada",
  "🇦🇺 Australia", "🇳🇿 New Zealand", "🇩🇪 Germany", "🇫🇷 France",
  "🇮🇹 Italy", "🇵🇱 Poland", "🇳🇱 Netherlands", "🇳🇴 Norway",
  "🇸🇪 Sweden", "🇩🇰 Denmark", "🇧🇪 Belgium", "🇪🇸 Spain",
  "🇵🇹 Portugal", "🇹🇷 Turkey", "🇯🇵 Japan", "🇰🇷 South Korea",
  "🇧🇷 Brazil", "International", "Other",
];

const LANGUAGES = [
  "English", "German", "French", "Spanish", "Italian", "Polish",
  "Dutch", "Portuguese", "Norwegian", "Swedish", "Danish", "Turkish",
  "Japanese", "Korean", "Other",
];

// ─── Dropdown component ────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-display font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
          active
            ? "bg-primary/15 border-primary/50 text-primary"
            : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground bg-card"
        }`}
      >
        {active ? value.replace(/^[^\s]+\s/, "") : label}
        {active ? (
          <X className="w-3 h-3" onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }} />
        ) : (
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[180px] max-h-64 overflow-y-auto"
          >
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm font-sans text-muted-foreground hover:bg-secondary/60 transition-colors"
            >
              All
            </button>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-sans transition-colors ${
                  value === opt
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-secondary/60"
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MilsimRegistry() {
  useSEO({ title: "MilSim Registry", description: "Browse TAG's registered MilSim groups — find your unit and enlist in organised tactical play." });
  const [groups, setGroups] = useState<MilsimGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterUnitType, setFilterUnitType] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "featured">("all");

  useEffect(() => {
    apiFetch<MilsimGroup[]>("/api/milsim-groups")
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const anyFilterActive = search || filterGame || filterCountry || filterLanguage || filterUnitType;

  const clearFilters = () => {
    setSearch("");
    setFilterGame("");
    setFilterCountry("");
    setFilterLanguage("");
    setFilterUnitType("");
  };

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
    if (filterGame) {
      list = list.filter(g => (g.games ?? []).some(gm =>
        gm.toLowerCase().includes(filterGame.toLowerCase())
      ));
    }
    if (filterCountry) {
      list = list.filter(g => (g.country ?? "").toLowerCase().includes(
        filterCountry.replace(/^[^\s]+\s/, "").toLowerCase()
      ));
    }
    if (filterLanguage) {
      list = list.filter(g => (g.language ?? "").toLowerCase() === filterLanguage.toLowerCase());
    }
    if (filterUnitType) {
      list = list.filter(g => (g.unitType ?? "").toLowerCase().includes(filterUnitType.toLowerCase()));
    }

    return list;
  }, [groups, search, filterGame, filterCountry, filterLanguage, filterUnitType, activeTab]);

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
              Registered tactical units operating within the TAG ecosystem. Browse groups, view rosters, SOPs, and apply to join.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Search + Filters bar */}
        <div className="mb-8 space-y-3">
          {/* Top row: search + register button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search units by name, tag line, or tag..."
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Link
              href="/milsim/register"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Register Your Unit
            </Link>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              <Filter className="w-3 h-3" /> Filter:
            </div>
            <FilterDropdown label="Game" options={GAMES} value={filterGame} onChange={setFilterGame} />
            <FilterDropdown label="Country" options={COUNTRIES} value={filterCountry} onChange={setFilterCountry} />
            <FilterDropdown label="Language" options={LANGUAGES} value={filterLanguage} onChange={setFilterLanguage} />
            <FilterDropdown label="Unit Type" options={UNIT_TYPES} value={filterUnitType} onChange={setFilterUnitType} />
            {anyFilterActive && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 font-display font-bold uppercase tracking-wider transition-colors"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-border">
            {[
              { id: "all", label: `All Units (${groups.filter(g => g.status !== "pending").length})` },
              ...(featured.length > 0 ? [{ id: "featured", label: `Featured (${featured.length})` }] : []),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "all" | "featured")}
                className={`px-4 py-2.5 text-xs font-display font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-primary text-foreground -mb-px"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 border border-dashed border-border rounded-lg"
          >
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            {anyFilterActive ? (
              <>
                <p className="font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">No units match your filters</p>
                <p className="font-sans text-sm text-muted-foreground mb-6">Try adjusting or clearing your search and filters.</p>
                <button onClick={clearFilters}
                  className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-sm px-5 py-2.5 rounded clip-angled-sm transition-all">
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              </>
            ) : (
              <>
                <p className="font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">No Groups Yet</p>
                <p className="font-sans text-sm text-muted-foreground mb-6">Be the first to register your unit.</p>
                <Link
                  href="/milsim/register"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all"
                >
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
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((g, i) => (
                  <GroupCard key={g.id} group={g} index={i} featured={g.status === "featured"} />
                ))}
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className={`group bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-all ${featured ? "border-accent/40" : "border-border"}`}
    >
      {/* Logo / Banner */}
      <div className="relative h-32 bg-secondary/60 flex items-center justify-center overflow-hidden">
        {featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent/20 border border-accent/40 text-accent px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-widest z-10">
            <Star className="w-2.5 h-2.5" /> Featured
          </div>
        )}
        {group.logoUrl ? (
          <img src={group.logoUrl} alt={`${group.name} logo`} className="w-20 h-20 object-contain" />
        ) : (
          <Shield className="w-12 h-12 text-muted-foreground/30" />
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display font-black uppercase tracking-wider text-foreground text-lg mb-1 truncate">
          {group.name}
        </h3>
        {group.tagLine && (
          <p className="text-xs text-primary font-display font-bold uppercase tracking-widest mb-2 truncate">{group.tagLine}</p>
        )}

        {/* Meta tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
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
          {group.unitType && (
            <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-primary">
              {group.unitType}
            </span>
          )}
          {(group.games ?? []).slice(0, 2).map(g => (
            <span key={g} className="text-[10px] font-sans px-2 py-0.5 bg-secondary border border-border rounded text-muted-foreground">
              {g}
            </span>
          ))}
          {(group.games ?? []).length > 2 && (
            <span className="text-[10px] font-sans px-2 py-0.5 bg-secondary border border-border rounded text-muted-foreground">
              +{(group.games ?? []).length - 2} more
            </span>
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
              className="p-2 border border-border hover:border-primary/40 rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Discord">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {group.websiteUrl && (
            <a href={group.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 border border-border hover:border-primary/40 rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Website">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
