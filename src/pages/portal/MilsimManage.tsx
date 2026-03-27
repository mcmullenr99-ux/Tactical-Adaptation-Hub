import React, { useEffect, useState, useCallback, useRef, type ElementType } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import { BRANCHES, UNIT_TYPES_BY_BRANCH, GAMES_LIST as MC_GAMES, type Branch } from "@/lib/milsimConstants";
import { RIBBON_TEMPLATES, RIBBON_COUNTRIES, RIBBON_BRANCHES_BY_COUNTRY, type RibbonTemplate } from "@/lib/ribbonLibrary";
import { RibbonBuilder, RibbonPreview, ribbonToSvgDataUri, type RibbonConfig, type StripePattern } from "@/components/RibbonBuilder";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  Ban,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Crosshair,
  Crown,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Flag,
  GitBranch,
  GraduationCap,
  Link2,
  Loader2,
  MapPin,
  Medal, Search,
  Megaphone,
  Pencil,
  PlaneTakeoff,
  Plus,
  Radio,
  RefreshCw,
  Zap,
  Save,
  Shield,
  Siren,
  Star,
  Target,
  Globe,
  Trash2,
  TrendingUp,
  Trophy,
  Upload,
  Users,
  Wifi,
  WifiOff,
  X,
  XCircle,
  UserCheck,
  Archive,
  FileEdit,
  UserMinus2,
  BookCheck,
  Bell,
  ChevronRight,
  Download,
  Zap
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import OrbatBuilder from "@/components/OrbatBuilder";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";

interface Role { id: number; name: string; description: string | null; sortOrder: number }
interface Rank { id: number; name: string; abbreviation: string | null; tier: number }
interface RosterEntry { id: number; callsign: string; rankId: number | null; roleId: number | null; notes: string | null; status?: string; specialisations?: string[]; join_date?: string | null; ops_count?: number | null; }
interface AppQuestion { id: number; question: string; sortOrder: number; required: boolean }
interface MilsimAward { id: number; title: string; description: string | null; icon: string; awarded_by: string | null; awarded_at: string; roster_entry_id: number; callsign: string | null }

interface GroupDetail {
  id: number; name: string; slug: string; tagLine: string | null;
  description: string | null; discordUrl: string | null; websiteUrl: string | null;
  logoUrl: string | null; sops: string | null; orbat: string | null; status: string;
  stream_url: string | null; is_live: boolean;
  roles: Role[]; ranks: Rank[]; roster: RosterEntry[]; questions: AppQuestion[];
}

type Tab = "roles" | "ranks" | "roster" | "recognition" | "stream" | "questions" | "operations" | "readiness" | "analytics" | "campaigns" | "reputation" | "loa" | "calendar" | "pipeline" | "legacy" | "developer" | "troops" | "events" | "eventhub" | "onboarding" | "criteria" | "doctrine";

export default function MilsimManage() {
  const [, setLocation] = useLocation();
  const [group, setGroup] = useState<GroupDetail | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("doctrine");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiFetch<GroupDetail | null>("/api/milsim-groups/mine/own")
      .then(setGroup)
      .catch(() => setGroup(null));
  }, []);

  if (group === undefined) return (
    <PortalLayout>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    </PortalLayout>
  );

  if (group === null) return (
    <PortalLayout>
      <div className="text-center py-24 border border-dashed border-border rounded-lg">
        <Shield className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
        <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-3">No Group Registered</h2>
        <p className="text-muted-foreground font-sans mb-6">You haven't registered a MilSim group yet.</p>
        <button onClick={() => setLocation("/milsim/register")}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm px-6 py-3 rounded clip-angled-sm transition-all">
          <Plus className="w-4 h-4" /> Register Your Unit
        </button>
      </div>
    </PortalLayout>
  );

  const showMsg = (okOrText: boolean | string, textOrType?: string) => {
    // Accept both (ok: boolean, text: string) and (text: string, type: "success"|"error")
    let ok: boolean;
    let text: string;
    if (typeof okOrText === "boolean") {
      ok = okOrText;
      text = textOrType ?? "";
    } else {
      ok = textOrType !== "error";
      text = okOrText;
    }
    setSaveMsg({ ok, text });
    setTimeout(() => setSaveMsg(null), 3500);
  };

  // Sidebar nav groups
  const NAV_GROUPS: { label: string; items: { id: Tab; label: string; icon: typeof Shield; pro?: boolean; star?: boolean }[] }[] = [

    {
      label: "Onboarding",
      items: [
        { id: "onboarding", label: "Onboarding", icon: ClipboardList },
      ],
    },
    {
      label: "Personnel",
      items: [
        { id: "troops", label: "Troop Management", icon: Users },
      ],
    },
    {
      label: "Events",
      items: [
        { id: "eventhub", label: "Events", icon: Siren },
      ],
    },
    {
      label: "Recognition",
      items: [
        { id: "recognition", label: "Recognition", icon: Medal },
        { id: "legacy", label: "Unit Legacy", icon: Archive, pro: true },
        { id: "developer", label: "API & Webhooks", icon: GitBranch, pro: true },
      ],
    },
    {
      label: "Doctrine",
      items: [
        { id: "doctrine", label: "Doctrine", icon: BookOpen },
      ],
    },
    {
      label: "Command",
      items: [
        { id: "readiness", label: "Readiness", icon: Activity },
        { id: "analytics", label: "Analytics", icon: BarChart3, pro: true },
        { id: "stream", label: "Stream", icon: Radio, pro: true },
      ],
    },
  ];

  return (
    <PortalLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">{group.name}</h1>
              <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                group.status === "featured" ? "bg-accent/20 text-accent border-accent/40"
                : group.status === "approved" ? "bg-primary/20 text-primary border-primary/40"
                : "bg-secondary text-muted-foreground border-border"
              }`}>{group.status}</span>
              {group.is_live && (
                <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-sans">{group.tagLine ?? "No tag line set"}</p>
          </div>
          <a href={`/milsim/${group.slug}`}
            className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded clip-angled-sm transition-all">
            View Public Page <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {saveMsg && (
          <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-sans ${saveMsg.ok ? "bg-primary/10 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
            {saveMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {saveMsg.text}
          </div>
        )}

        {/* Sidebar + Content layout */}
        <div className="flex gap-6 min-h-[600px]">
          {/* Sidebar */}
          <nav className="w-52 shrink-0 space-y-5">
            {NAV_GROUPS.map((group_nav) => (
              <div key={group_nav.label}>
                <p className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-3 mb-1.5">{group_nav.label}</p>
                <div className="space-y-0.5">
                  {group_nav.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left text-xs font-display font-bold uppercase tracking-wider transition-all ${
                        tab === item.id
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.pro && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              {tab === "troops" && <TroopManagementTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
              {tab === "roles" && <RolesTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
              {tab === "ranks" && <RanksTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
              {tab === "roster" && <RosterTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
              {tab === "recognition" && <RecognitionTab group={group} showMsg={showMsg} />}
              {tab === "eventhub" && <EventHubTab group={group} showMsg={showMsg} />}
              {tab === "onboarding" && <OnboardingTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
              {tab === "events" && <EventsTab group={group} showMsg={showMsg} />}

              {tab === "readiness" && <ReadinessTab group={group} />}
              {tab === "reputation" && <ReputationTab group={group} />}

              {tab === "loa" && <LOATab group={group} showMsg={showMsg} />}
              {tab === "calendar" && <ActivityCalendarTab group={group} showMsg={showMsg} />}
              {tab === "analytics" && <AnalyticsTab group={group} />}
              {tab === "campaigns" && <CampaignsTab group={group} />}
              {tab === "pipeline" && <RecruitPipelineTab group={group} showMsg={showMsg} />}
              {tab === "legacy" && <UnitLegacyTab group={group} />}
              {tab === "developer" && <DeveloperTab group={group} showMsg={showMsg} />}
              {tab === "stream" && <StreamTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
              {tab === "doctrine" && <DoctrineTab group={group} onSaved={setGroup} setSaving={setSaving} saving={saving} showMsg={showMsg} />}
              {tab === "questions" && <QuestionsTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
            </motion.div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const MC_COUNTRIES = [
  // Europe
  "🇬🇧 United Kingdom", "🇩🇪 Germany", "🇫🇷 France", "🇮🇹 Italy",
  "🇵🇱 Poland", "🇳🇱 Netherlands", "🇳🇴 Norway", "🇸🇪 Sweden",
  "🇩🇰 Denmark", "🇧🇪 Belgium", "🇪🇸 Spain", "🇵🇹 Portugal",
  "🇨🇿 Czech Republic", "🇸🇰 Slovakia", "🇭🇺 Hungary", "🇷🇴 Romania",
  "🇧🇬 Bulgaria", "🇬🇷 Greece", "🇭🇷 Croatia", "🇷🇸 Serbia",
  "🇺🇦 Ukraine", "🇫🇮 Finland", "🇦🇹 Austria", "🇨🇭 Switzerland",
  "🇱🇺 Luxembourg", "🇮🇪 Ireland", "🇱🇹 Lithuania", "🇱🇻 Latvia",
  "🇪🇪 Estonia", "🇸🇮 Slovenia",
  // North America
  "🇺🇸 United States", "🇨🇦 Canada", "🇲🇽 Mexico",
  // South America
  "🇧🇷 Brazil", "🇦🇷 Argentina", "🇨🇱 Chile", "🇨🇴 Colombia",
  "🇵🇪 Peru", "🇻🇪 Venezuela", "🇺🇾 Uruguay", "🇪🇨 Ecuador", "🇧🇴 Bolivia",
  // Middle East
  "🇹🇷 Turkey", "🇸🇦 Saudi Arabia", "🇮🇱 Israel", "🇦🇪 UAE",
  "🇶🇦 Qatar", "🇰🇼 Kuwait", "🇮🇶 Iraq", "🇮🇷 Iran",
  "🇯🇴 Jordan", "🇱🇧 Lebanon", "🇪🇬 Egypt", "🇲🇦 Morocco",
  // Africa
  "🇿🇦 South Africa", "🇳🇬 Nigeria", "🇰🇪 Kenya", "🇬🇭 Ghana",
  "🇪🇹 Ethiopia", "🇹🇿 Tanzania",
  // Asia
  "🇯🇵 Japan", "🇰🇷 South Korea", "🇨🇳 China", "🇮🇳 India",
  "🇵🇰 Pakistan", "🇧🇩 Bangladesh", "🇻🇳 Vietnam", "🇹🇭 Thailand",
  "🇵🇭 Philippines", "🇮🇩 Indonesia", "🇲🇾 Malaysia", "🇸🇬 Singapore",
  "🇹🇼 Taiwan", "🇭🇰 Hong Kong",
  // Oceania
  "🇦🇺 Australia", "🇳🇿 New Zealand", "🇵🇬 Papua New Guinea", "🇫🇯 Fiji",
  // Other
  "International", "Other",
];
const MC_LANGS = [
  "English", "German", "French", "Spanish", "Italian", "Polish",
  "Dutch", "Portuguese", "Norwegian", "Swedish", "Danish", "Finnish",
  "Turkish", "Arabic", "Hebrew", "Japanese", "Korean", "Chinese (Mandarin)",
  "Tagalog", "Vietnamese", "Thai", "Malay", "Indonesian",
  "Ukrainian", "Romanian", "Czech", "Slovak", "Hungarian", "Greek",
  "Croatian", "Serbian", "Bulgarian", "Estonian", "Latvian", "Lithuanian",
  "Hindi", "Other",
];

function InfoTab({ group, onSaved, setSaving, saving, showMsg }: any) {
  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: {
    name: group.name, tagLine: group.tagLine ?? "", description: group.description ?? "",
    discordUrl: group.discordUrl ?? "", websiteUrl: group.websiteUrl ?? "", steamGroupUrl: group.steamGroupUrl ?? "", logoUrl: group.logoUrl ?? "", bannerUrl: group.banner_url ?? "",
    country: group.country ?? "", language: group.language ?? "",
    branch: group.branch ?? "", unitType: group.unitType ?? "",
    games: (group.games ?? []) as string[],
  }});
  const gamesValue: string[] = watch("games") ?? [];
  const branchValue: string = watch("branch") ?? "";
  const unitTypeOptions = branchValue ? (UNIT_TYPES_BY_BRANCH[branchValue as Branch] ?? []) : [];
  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/milsim-groups/${group.id}/info`, { method: "PATCH", body: JSON.stringify({ ...data, banner_url: data.bannerUrl }) });
      onSaved(updated);
      showMsg(true, "Group info saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <MField label="Unit Name"><input {...register("name")} className="mf-input" /></MField>
      <MField label="Tag Line"><input {...register("tagLine")} className="mf-input" /></MField>
      <MField label="Description"><textarea {...register("description")} rows={5} className="mf-input resize-none" /></MField>
      {/* Logo Upload */}
      <MField label="Logo Image">
        <div className="space-y-2">
          <LogoUploadField value={watch("logoUrl") ?? ""} onChange={(url) => setValue("logoUrl", url)} />
          <p className="text-[10px] text-muted-foreground font-sans">Upload a PNG/JPG (recommended: 256×256px square). Or paste a URL below.</p>
          <input {...register("logoUrl")} className="mf-input text-xs" placeholder="https://i.imgur.com/..." />
        </div>
      </MField>
      {/* Banner Upload */}
      <MField label="Banner Image">
        <div className="space-y-2">
          <BannerUploadField value={watch("bannerUrl") ?? ""} onChange={(url) => setValue("bannerUrl", url)} />
          <p className="text-[10px] text-muted-foreground font-sans">Upload a wide banner image (recommended: 1200×400px). Or paste a URL below.</p>
          <input {...register("bannerUrl")} className="mf-input text-xs" placeholder="https://i.imgur.com/..." />
        </div>
      </MField>
      <MField label="Discord URL"><input {...register("discordUrl")} className="mf-input" placeholder="https://discord.gg/invite" /></MField>
      <MField label="Website URL"><input {...register("websiteUrl")} className="mf-input" placeholder="https://yourunit.com" /></MField>
      <MField label="Steam Group URL"><input {...register("steamGroupUrl")} className="mf-input" placeholder="https://steamcommunity.com/groups/..." /></MField>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Discovery & Filtering</p>
        <div className="space-y-4">
          {/* Branch selector */}
          <MField label="Military Branch">
            <div className="flex flex-wrap gap-2 mt-1">
              {BRANCHES.map(b => {
                const sel = branchValue === b;
                return (
                  <button key={b} type="button"
                    onClick={() => { setValue("branch", b); setValue("unitType", ""); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                      sel ? "bg-primary/15 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}>
                    <span className="w-2 h-2 rounded-full bg-current opacity-60 shrink-0" />{b}
                  </button>
                );
              })}
              {branchValue && (
                <button type="button" onClick={() => { setValue("branch", ""); setValue("unitType", ""); }}
                  className="px-2 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-destructive transition-colors">
                  ✕ Clear
                </button>
              )}
            </div>
          </MField>
          {/* Unit type — context-aware */}
          <MField label="Unit Type">
            <select {...register("unitType")} className="mf-input" disabled={!branchValue}>
              <option value="">{branchValue ? "Select unit type..." : "Select a branch first"}</option>
              {unitTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </MField>
          <MField label="Country / Nationality">
            <select {...register("country")} className="mf-input">
              <option value="">Select...</option>
              {MC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </MField>
          <MField label="Primary Language">
            <select {...register("language")} className="mf-input">
              <option value="">Select...</option>
              {MC_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </MField>
          <MField label="Games You Play">
            <div className="flex flex-wrap gap-2 mt-1">
              {MC_GAMES.map(game => {
                const selected = gamesValue.includes(game);
                return (
                  <button key={game} type="button"
                    onClick={() => {
                      const next = selected ? gamesValue.filter(g => g !== game) : [...gamesValue, game];
                      setValue("games", next);
                    }}
                    className={`px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                      selected ? "bg-primary/15 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {game}
                  </button>
                );
              })}
            </div>
          </MField>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
      </button>
    </form>
  );
}

// Forward ref so OrbatProGate can use it (full const defined near AnalyticsTab)
const _PRO_STATUS_URL_MANAGE = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/getProStatus";

/* ─── Doctrine Tab (Info + SOPs + Org Chart + Training Docs) ──────────────── */
type DoctrineSubTab = "info" | "sops" | "orbat" | "orgchart" | "training";

function DoctrineTab({ group, onSaved, setSaving, saving, showMsg }: any) {
  const [sub, setSub] = useState<DoctrineSubTab>("info");

  const SUB_TABS: { id: DoctrineSubTab; label: string; icon: typeof Shield }[] = [
    { id: "info",      label: "Unit Info",      icon: Shield },
    { id: "sops",      label: "SOPs",           icon: BookOpen },
    { id: "orbat",     label: "ORBAT",          icon: GitBranch },
    { id: "orgchart",  label: "Org Chart",      icon: GitBranch },
    { id: "training",  label: "Training Docs",  icon: Brain },
  ];

  return (
    <div className="space-y-5">
      {/* Inner sub-tab bar */}
      <div className="flex items-center gap-1 border-b border-border pb-0 overflow-x-auto">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-display font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              sub === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="w-3.5 h-3.5 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <motion.div key={sub} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }}>
        {sub === "info"     && <InfoTab group={group} onSaved={onSaved} setSaving={setSaving} saving={saving} showMsg={showMsg} />}
        {sub === "sops"     && <SopsOnlyTab group={group} onSaved={onSaved} setSaving={setSaving} saving={saving} showMsg={showMsg} />}
        {sub === "orbat"    && <OrbatOnlyTab group={group} onSaved={onSaved} setSaving={setSaving} saving={saving} showMsg={showMsg} />}
        {sub === "orgchart" && <OrgChartTab group={group} />}
        {sub === "training" && <TrainingDocsTab group={group} showMsg={showMsg} />}
      </motion.div>
    </div>
  );
}

function SopsOnlyTab({ group, onSaved, setSaving, saving, showMsg }: any) {
  const [sopsText, setSopsText] = useState(group.sops ?? "");

  const saveSops = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/milsim-groups/${group.id}/info`, { method: "PATCH", body: JSON.stringify({ sops: sopsText, orbat: group.orbat }) });
      onSaved(updated);
      showMsg(true, "SOPs saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="font-display font-black text-lg uppercase tracking-wider text-foreground">Standard Operating Procedures</h2>
      </div>
      <MField label="SOPs">
        <textarea value={sopsText} onChange={e => setSopsText(e.target.value)} rows={20}
          className="mf-input resize-y font-mono text-sm"
          placeholder="1. Comms discipline — PTT only when necessary&#10;2. Movement protocols..." />
      </MField>
      <button onClick={saveSops} disabled={saving}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save SOPs
      </button>
    </div>
  );
}

function OrbatOnlyTab({ group, onSaved, setSaving, saving, showMsg }: any) {
  const [orbatJson, setOrbatJson] = useState(group.orbat ?? "");

  const saveOrbat = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/milsim-groups/${group.id}/info`, { method: "PATCH", body: JSON.stringify({ sops: group.sops, orbat: orbatJson }) });
      onSaved(updated);
      showMsg(true, "ORBAT saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <GitBranch className="w-5 h-5 text-primary" />
        <h2 className="font-display font-black text-lg uppercase tracking-wider text-foreground">ORBAT Builder</h2>
        <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
          <Crown className="w-2.5 h-2.5" /> Pro
        </span>
      </div>
      <OrbatProGate group={group} orbatJson={orbatJson} setOrbatJson={setOrbatJson} saveOrbat={saveOrbat} saving={saving} />
    </div>
  );
}

function OrbatProGate({ group, orbatJson, setOrbatJson, saveOrbat, saving }: any) {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  useEffect(() => {
    fetch(`${_PRO_STATUS_URL_MANAGE}?group_id=${group.id}`)
      .then(r => r.json())
      .then(s => setIsPro(!!s.is_pro))
      .catch(() => setIsPro(false));
  }, [group.id]);

  if (isPro === null) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isPro) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-6">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center">
        <Crown className="w-8 h-8 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-display font-black text-2xl uppercase tracking-wider text-foreground mb-2">Commander Pro Required</h3>
        <p className="text-muted-foreground font-sans leading-relaxed">
          The visual ORBAT Builder is a Pro feature. Build your command structure with NATO APP-6 symbology, drag-and-drop hierarchy, echelon markers, and print-ready PDF export.
        </p>
      </div>
      <a href="/commander-pro"
        className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-sm px-8 py-3 rounded transition-all shadow-[0_0_20px_hsla(48,96%,53%,0.3)]">
        <Crown className="w-4 h-4" /> Upgrade to Pro — £10/mo
      </a>
      <p className="text-xs text-muted-foreground font-sans">SOPs remain free — ORBAT is a Pro visual tool.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <OrbatBuilder value={orbatJson} onChange={setOrbatJson} groupName={group.name} />
      <div className="flex justify-end pt-2">
        <button onClick={saveOrbat} disabled={saving}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save ORBAT
        </button>
      </div>
    </div>
  );
}

// ─── Troop Management Tab (Roles + Ranks + Roster + Pipeline + LOA + Reputation) ──
function TroopManagementTab({ group, onUpdated, showMsg }: any) {
  type TTSub = "roster" | "roles" | "ranks" | "pipeline" | "loa" | "reputation";
  const [sub, setSub] = useState<TTSub>("roster");

  const SUBS: { id: TTSub; label: string; icon: React.ReactNode; pro?: boolean }[] = [
    { id: "roster",     label: "Roster",      icon: <Users className="w-3.5 h-3.5" /> },
    { id: "roles",      label: "Roles",       icon: <Crosshair className="w-3.5 h-3.5" /> },
    { id: "ranks",      label: "Ranks",       icon: <Award className="w-3.5 h-3.5" /> },
    { id: "pipeline",   label: "Pipeline",    icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: "loa",        label: "LOA Manager", icon: <PlaneTakeoff className="w-3.5 h-3.5" /> },
    { id: "reputation", label: "Service Files", icon: <Star className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab pills */}
      <div className="flex flex-wrap gap-2">
        {SUBS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded font-display font-bold uppercase tracking-widest text-xs border transition-colors ${
              sub === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {s.icon}
            {s.label}
            {s.pro && <span className="ml-1 text-[9px] text-amber-400">★</span>}
          </button>
        ))}
      </div>

      {sub === "roster"     && <RosterTab     group={group} onUpdated={onUpdated} showMsg={showMsg} />}
      {sub === "roles"      && <RolesTab      group={group} onUpdated={onUpdated} showMsg={showMsg} />}
      {sub === "ranks"      && <RanksTab      group={group} onUpdated={onUpdated} showMsg={showMsg} />}
      {sub === "pipeline"   && <RecruitPipelineTab group={group} showMsg={showMsg} />}
      {sub === "loa"        && <LOATab        group={group} showMsg={showMsg} />}
      {sub === "reputation" && <ReputationTab group={group} />}
    </div>
  );
}


function RolesTab({ group, onUpdated, showMsg }: any) {
  const [roles, setRoles] = useState<Role[]>(group.roles);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const role = await apiFetch<Role>(`/api/milsim-groups/${group.id}/roles`, { method: "POST", body: JSON.stringify({ name, description: desc || undefined, sortOrder: roles.length }) });
      const updated = [...roles, role]; setRoles(updated); onUpdated({ ...group, roles: updated });
      setName(""); setDesc(""); showMsg(true, "Role added.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/roles/${id}`, { method: "DELETE" });
      const updated = roles.filter((r) => r.id !== id); setRoles(updated); onUpdated({ ...group, roles: updated });
    } catch (e: any) { showMsg(false, e.message); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        {roles.length === 0 && <p className="text-muted-foreground font-sans text-sm">No roles added yet.</p>}
        {roles.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3">
            <div>
              <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{r.name}</p>
              {r.description && <p className="text-xs text-muted-foreground font-sans">{r.description}</p>}
            </div>
            <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Add Role</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mf-input" placeholder="Infantry, Medic, Engineer, Logistics..." />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} className="mf-input" placeholder="Description (optional)" />
        <button onClick={add} disabled={adding || !name.trim()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Role
        </button>
      </div>
    </div>
  );
}

function RanksTab({ group, onUpdated, showMsg }: any) {
  const [ranks, setRanks] = useState<Rank[]>(group.ranks);
  const [name, setName] = useState(""); const [abbr, setAbbr] = useState(""); const [tier, setTier] = useState("0");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const rank = await apiFetch<Rank>(`/api/milsim-groups/${group.id}/ranks`, { method: "POST", body: JSON.stringify({ name, abbreviation: abbr || undefined, tier: parseInt(tier) || 0 }) });
      const updated = [...ranks, rank].sort((a, b) => b.tier - a.tier);
      setRanks(updated); onUpdated({ ...group, ranks: updated });
      setName(""); setAbbr(""); setTier("0"); showMsg(true, "Rank added.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/ranks/${id}`, { method: "DELETE" });
      const updated = ranks.filter((r) => r.id !== id); setRanks(updated); onUpdated({ ...group, ranks: updated });
    } catch (e: any) { showMsg(false, e.message); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        {ranks.length === 0 && <p className="text-muted-foreground font-sans text-sm">No ranks added yet.</p>}
        {ranks.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center font-display font-black text-xs text-primary">{r.tier}</span>
              <div>
                <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{r.name}</p>
                {r.abbreviation && <p className="text-xs text-muted-foreground font-mono">{r.abbreviation}</p>}
              </div>
            </div>
            <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Add Rank</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mf-input" placeholder="Private, Corporal, Sergeant..." />
        <div className="grid grid-cols-2 gap-3">
          <input value={abbr} onChange={(e) => setAbbr(e.target.value)} className="mf-input" placeholder="Abbreviation (e.g. SGT)" />
          <input value={tier} onChange={(e) => setTier(e.target.value)} type="number" className="mf-input" placeholder="Tier (higher = senior)" />
        </div>
        <button onClick={add} disabled={adding || !name.trim()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Rank
        </button>
      </div>
    </div>
  );
}

function RosterTab({ group, onUpdated, showMsg }: any) {
  const [roster, setRoster] = useState<RosterEntry[]>(group.roster);
  const [editEntry, setEditEntry] = useState<RosterEntry | null>(null);
  const [editData, setEditData] = useState<Partial<RosterEntry & { specInput: string }>>({});
  const [adding, setAdding] = useState(false);
  const [newCallsign, setNewCallsign] = useState("");
  const [saving, setSaving] = useState(false);

  const STATUSES = ["Active", "Reserve", "AWOL", "MIA", "KIA", "Discharged"];

  const openEdit = (e: RosterEntry) => {
    setEditEntry(e);
    setEditData({ ...e, specInput: "" });
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    setSaving(true);
    try {
      const updated = await apiFetch<RosterEntry>(`/api/milsim-groups/${group.id}/roster/${editEntry.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          callsign: editData.callsign,
          rankId: editData.rankId ? Number(editData.rankId) : null,
          roleId: editData.roleId ? Number(editData.roleId) : null,
          notes: editData.notes || null,
          status: editData.status || "Active",
          specialisations: editData.specialisations ?? [],
          join_date: editData.join_date || null,
          ops_count: editData.ops_count ?? null,
        }),
      });
      const newRoster = roster.map(r => r.id === editEntry.id ? { ...updated, qualifications: (editEntry as any).qualifications ?? [], awards: (editEntry as any).awards ?? [] } : r);
      setRoster(newRoster); onUpdated({ ...group, roster: newRoster });
      setEditEntry(null); showMsg(true, "Operator record updated.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };

  const enlist = async () => {
    if (!newCallsign.trim()) return;
    setAdding(true);
    try {
      const entry = await apiFetch<RosterEntry>(`/api/milsim-groups/${group.id}/roster`, {
        method: "POST",
        body: JSON.stringify({ callsign: newCallsign, status: "Active" }),
      });
      const updated = [...roster, { ...entry, qualifications: [], awards: [] }];
      setRoster(updated); onUpdated({ ...group, roster: updated });
      setNewCallsign(""); showMsg(true, "Operator enlisted.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/roster/${id}`, { method: "DELETE" });
      const updated = roster.filter((r) => r.id !== id); setRoster(updated); onUpdated({ ...group, roster: updated });
      showMsg(true, "Operator removed.");
    } catch (e: any) { showMsg(false, e.message); }
  };

  const addSpec = () => {
    const val = (editData.specInput ?? "").trim().toUpperCase();
    if (!val) return;
    setEditData(d => ({ ...d, specialisations: [...(d.specialisations ?? []), val], specInput: "" }));
  };

  const statusColour = (s: string) =>
    s === "Active"     ? "bg-green-500/15 text-green-400 border-green-500/30" :
    s === "Reserve"    ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
    s === "AWOL"       ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
    s === "MIA"        ? "bg-orange-500/15 text-orange-400 border-orange-500/30" :
    s === "KIA"        ? "bg-red-500/15 text-red-400 border-red-500/30" :
    s === "Discharged" ? "bg-secondary text-muted-foreground border-border" :
    "bg-green-500/15 text-green-400 border-green-500/30";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Roster list */}
      <div className="space-y-2">
        {roster.length === 0 && <p className="text-muted-foreground font-sans text-sm p-4 bg-card border border-border rounded-lg">Roster is empty. Enlist your first operator below.</p>}
        {roster.map((e) => {
          const rank = e.rankId ? group.ranks.find((r: any) => r.id === e.rankId) : null;
          const role = e.roleId ? group.roles.find((r: any) => r.id === e.roleId) : null;
          return (
            <div key={e.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/20 transition-colors">
              <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="font-display font-black text-[10px] text-primary">{e.callsign.slice(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{e.callsign}</span>
                  <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${statusColour(e.status ?? "Active")}`}>
                    {e.status ?? "Active"}
                  </span>
                  {rank && <span className="text-[9px] text-primary font-display font-bold uppercase tracking-widest">{rank.name}</span>}
                  {role && <span className="text-[9px] text-muted-foreground font-display uppercase tracking-widest bg-secondary border border-border px-1.5 py-0.5 rounded">{role.name}</span>}
                </div>
                {(e.specialisations ?? []).length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(e.specialisations ?? []).map((s, i) => (
                      <span key={i} className="text-[8px] font-display font-bold uppercase tracking-widest bg-accent/10 border border-accent/25 text-accent px-1 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(e)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit Operator Record">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(e.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remove">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enlist form */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Enlist Operator</h3>
        <div className="flex gap-3">
          <input value={newCallsign} onChange={(e) => setNewCallsign(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") enlist(); }}
            className="mf-input flex-1" placeholder="Callsign" />
          <button onClick={enlist} disabled={adding || !newCallsign.trim()}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Enlist
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-sans">Use the edit button to set rank, role, status, specialisations, and more.</p>
      </div>

      {/* Edit Modal */}
      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditEntry(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-black uppercase tracking-widest text-sm text-foreground">Operator Record — {editEntry.callsign}</h2>
              <button onClick={() => setEditEntry(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">

              {/* Callsign */}
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Callsign</label>
                <input value={editData.callsign ?? ""} onChange={e => setEditData(d => ({...d, callsign: e.target.value}))} className="mf-input w-full" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Duty Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setEditData(d => ({...d, status: s}))}
                      className={`text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1.5 rounded border transition-colors ${editData.status === s ? statusColour(s) : "bg-secondary border-border text-muted-foreground hover:border-primary/30"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rank + Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Rank</label>
                  <select value={editData.rankId ?? ""} onChange={e => setEditData(d => ({...d, rankId: e.target.value ? Number(e.target.value) : null}))} className="mf-input w-full">
                    <option value="">No Rank</option>
                    {group.ranks.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Role</label>
                  <select value={editData.roleId ?? ""} onChange={e => setEditData(d => ({...d, roleId: e.target.value ? Number(e.target.value) : null}))} className="mf-input w-full">
                    <option value="">No Role</option>
                    {group.roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Specialisations */}
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Specialisations / MOS Tags</label>
                <div className="flex gap-2 mb-2">
                  <input value={editData.specInput ?? ""} onChange={e => setEditData(d => ({...d, specInput: e.target.value}))}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }}
                    className="mf-input flex-1" placeholder="e.g. CQB, JTAC, Medic, Sniper, EOD..." />
                  <button onClick={addSpec} className="px-3 py-2 bg-secondary border border-border rounded text-xs font-display font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editData.specialisations ?? []).map((s, i) => (
                    <span key={i} className="text-[10px] font-display font-bold uppercase tracking-widest bg-accent/10 border border-accent/25 text-accent px-2 py-0.5 rounded flex items-center gap-1">
                      {s}
                      <button onClick={() => setEditData(d => ({...d, specialisations: (d.specialisations ?? []).filter((_, j) => j !== i)}))} className="hover:text-destructive ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Join date + Ops count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Date Enlisted</label>
                  <input type="date" value={editData.join_date ?? ""} onChange={e => setEditData(d => ({...d, join_date: e.target.value || null}))} className="mf-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Ops Participated</label>
                  <input type="number" min={0} value={editData.ops_count ?? ""} onChange={e => setEditData(d => ({...d, ops_count: e.target.value ? parseInt(e.target.value) : null}))} className="mf-input w-full" placeholder="0" />
                </div>
              </div>

              {/* Notes / biog */}
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Commander Notes / Bio</label>
                <textarea value={editData.notes ?? ""} onChange={e => setEditData(d => ({...d, notes: e.target.value}))}
                  className="mf-input w-full min-h-[80px] resize-y" placeholder="Conduct record, background, notable service..." />
              </div>

              <button onClick={saveEdit} disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-3 rounded clip-angled-sm transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Operator Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TYPE_DEFS = [
  { id: "medal", label: "Medal", Icon: Medal, desc: "Worn on uniform" },
  { id: "ribbon", label: "Ribbon", Icon: Star, desc: "Service ribbon bar" },
  { id: "qualification-patch", label: "Qual. Patch", Icon: GraduationCap, desc: "Skill or unit patch" },
] as const;

function AwardImage({ path, fallbackIcon: FIcon }: { path: string | null | undefined; fallbackIcon: ElementType }) {
  const cleanPath = path ? path.replace(/^\/objects\//, "") : null;
  return (
    <div className="w-14 h-14 rounded-lg bg-secondary border border-border shrink-0 overflow-hidden flex items-center justify-center">
      {cleanPath ? (
        <img src={`/api/storage/objects/${cleanPath}`} alt="" className="w-full h-full object-contain" />
      ) : (
        <FIcon className="w-7 h-7 text-primary opacity-40" />
      )}
    </div>
  );
}



// ─── Recognition Tab (Awards + Commendations + Qualifications merged) ────────
function RecognitionTab({ group, showMsg }: any) {
  const [sub, setSub] = useState<"awards" | "quals">("awards");
  const SUB_TABS = [
    { id: "awards" as const, label: "Awards",         icon: Medal },
    { id: "quals" as const,  label: "Qualifications", icon: GraduationCap },
  ];
  return (
    <div className="space-y-4">
      {/* Sub-tab pills */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSub(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-all border ${
              sub === id ? "bg-primary/15 border-primary/50 text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>
      {sub === "awards" && <AwardsTab group={group} showMsg={showMsg} />}
      {sub === "quals"  && <QualsTab  group={group} showMsg={showMsg} />}
    </div>
  );
}

// ─── Image Upload Helper Components ─────────────────────────────────────────
const UPLOAD_API = "https://api.base44.com/api/apps/" + (import.meta.env.VITE_BASE44_APP_ID ?? "69bf52c997cae5d4cff87ae4") + "/files/upload";
const SERVICE_TOKEN = import.meta.env.VITE_BASE44_SERVICE_TOKEN ?? "";

async function uploadImageToStorage(file: File): Promise<string | null> {
  const token = localStorage.getItem("auth_token") ?? "";
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(UPLOAD_API, {
    method: "POST",
    headers: { "x-api-key": token || SERVICE_TOKEN },
    body: fd,
  });
  if (!res.ok) {
    // Fallback: try via our backend function
    const fd2 = new FormData();
    fd2.append("file", file);
    const res2 = await fetch("/api/storage/upload", { method: "POST", body: fd2, credentials: "include" });
    if (!res2.ok) throw new Error("Upload failed");
    const d2 = await res2.json();
    return d2.url ?? d2.file_url ?? null;
  }
  const data = await res.json();
  return data.file_url ?? data.url ?? null;
}

function ImageUploadField({ value, onChange, aspectHint, label }: { value: string; onChange: (url: string) => void; aspectHint?: string; label?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Max file size is 5MB."); return; }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file);
      if (url) onChange(url);
      else setError("Upload returned no URL.");
    } catch (err: any) {
      setError(err.message ?? "Upload failed.");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg cursor-pointer transition-all ${aspectHint === "banner" ? "h-24" : "h-20"} ${uploading ? "border-primary/60 bg-primary/5" : value ? "border-green-500/40 bg-green-500/5" : "border-border hover:border-primary/40 bg-secondary/20"}`}>
        {value && !uploading && (
          <img src={value} alt="preview" className={`absolute inset-0 w-full h-full object-cover rounded-lg opacity-50`} />
        )}
        <div className="relative z-10 flex flex-col items-center gap-1">
          {uploading ? (
            <><Loader2 className="w-5 h-5 animate-spin text-primary" /><p className="text-[10px] font-display uppercase tracking-wider text-primary">Uploading...</p></>
          ) : value ? (
            <><Upload className="w-4 h-4 text-green-400" /><p className="text-[10px] font-display uppercase tracking-wider text-green-400">✓ Uploaded — click to replace</p></>
          ) : (
            <><Upload className="w-5 h-5 text-muted-foreground" /><p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Click to upload {label ?? "image"}</p><p className="text-[9px] text-muted-foreground/60">{aspectHint === "banner" ? "1200×400px recommended" : "256×256px recommended"} · PNG/JPG · Max 5MB</p></>
          )}
        </div>
      </div>
      {error && <p className="text-[10px] text-red-400 font-sans">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function LogoUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  return <ImageUploadField value={value} onChange={onChange} aspectHint="logo" label="logo" />;
}
function BannerUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  return <ImageUploadField value={value} onChange={onChange} aspectHint="banner" label="banner" />;
}

function AwardsTab({ group, showMsg }: any) {
  const [subView, setSubView] = useState<"library" | "issued">("library");
  const [defs, setDefs] = useState<any[]>([]);
  const [issued, setIssued] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Ribbon picker state
  const [createMode, setCreateMode] = useState<"build" | "library">("build");
  const [ribbonConfig, setRibbonConfig] = useState<RibbonConfig>({ colors: ["#1a3a6b","#c8102e","#ffffff"], pattern: "thirds" });
  const [awardName, setAwardName] = useState("");
  const [pickerCountry, setPickerCountry] = useState<string>("");
  const [pickerBranch, setPickerBranch] = useState<string>("US Army");
  const [pickerSearch, setPickerSearch] = useState<string>("");
  const [pickerPage, setPickerPage] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState<RibbonTemplate | null>(null);
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Issue state
  const [issuingDefId, setIssuingDefId] = useState<string | null>(null);
  const [issueRosterId, setIssueRosterId] = useState("");
  const [issueCitation, setIssueCitation] = useState("");
  const [issuing, setIssuing] = useState(false);

  // Library search / filter / pagination
  const [libSearch, setLibSearch] = useState("");
  const [libCountry, setLibCountry] = useState("all");
  const [libPage, setLibPage] = useState(1);
  const LIB_PER_PAGE = 20;

  // Derived filtered/paged defs
  const filteredDefs = React.useMemo(() => {
    const q = libSearch.toLowerCase();
    return defs.filter(d => {
      if (libCountry !== "all" && d.source_country !== libCountry) return false;
      if (q && !(d.name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [defs, libSearch, libCountry]);
  const libTotalPages = Math.ceil(filteredDefs.length / LIB_PER_PAGE);
  const pagedDefs = filteredDefs.slice((libPage - 1) * LIB_PER_PAGE, libPage * LIB_PER_PAGE);
  const libCountries = React.useMemo(() => {
    const s = new Set<string>();
    defs.forEach(d => { if (d.source_country) s.add(d.source_country); });
    return Array.from(s).sort();
  }, [defs]);
  const handleLibSearch = (v: string) => { setLibSearch(v); setLibPage(1); setIssuingDefId(null); };
  const handleLibCountry = (v: string) => { setLibCountry(v); setLibPage(1); setIssuingDefId(null); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [defsData, issuedData, rosterData] = await Promise.all([
        apiFetch<any>(`/milsimAwards?path=${group.id}/award-defs`).catch(() => []),
        apiFetch<any>(`/milsimAwards?path=${group.id}/awards`).catch(() => []),
        apiFetch<any>(`/milsimGroups?path=mine/own`).catch(() => ({ roster: [] })),
      ]);
      setDefs(Array.isArray(defsData) ? defsData : []);
      setIssued(Array.isArray(issuedData) ? issuedData : []);
      setRoster(rosterData?.roster ?? []);
    } catch { showMsg(false, "Failed to load awards."); }
    finally { setLoading(false); }
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  // Derive available branches based on selected country
  const availableBranches = pickerCountry
    ? (RIBBON_BRANCHES_BY_COUNTRY[pickerCountry] ?? [])
    : [];

  // Filter ribbon templates
  const filteredTemplates = RIBBON_TEMPLATES.filter(r => {
    if (pickerCountry && r.country !== pickerCountry) return false;
    if (pickerBranch && r.branch !== pickerBranch) return false;
    if (pickerSearch) {
      const q = pickerSearch.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !(r.sku ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const RIBBONS_PER_PAGE = 48;
  const totalPages = Math.ceil(filteredTemplates.length / RIBBONS_PER_PAGE);
  const pagedTemplates = filteredTemplates.slice(pickerPage * RIBBONS_PER_PAGE, (pickerPage + 1) * RIBBONS_PER_PAGE);

  const resetForm = () => {
    setShowCreate(false);
    setSelectedTemplate(null);
    setPickerCountry(""); setPickerBranch("US Army"); setPickerSearch(""); setDesc(""); setPickerPage(0);
    setAwardName(""); setRibbonConfig({ colors: ["#1a3a6b","#c8102e","#ffffff"], pattern: "thirds" });
    setCreateMode("build");
  };

  const createDef = async () => {
    if (!selectedTemplate) { showMsg(false, "Select a ribbon first."); return; }
    setCreating(true);
    try {
      const payload = { name: selectedTemplate!.name, description: desc || undefined, award_type: "ribbon", image_url: selectedTemplate!.url, source_country: selectedTemplate!.country, source_branch: selectedTemplate!.branch, sort_order: defs.length };
      await apiFetch(`/milsimAwards?path=${group.id}/award-defs`, { method: "POST", body: JSON.stringify(payload) });
      resetForm();
      showMsg(true, "Award added to library.");
      load();
    } catch (e: any) { showMsg(false, e.message || "Failed to create award."); }
    finally { setCreating(false); }
  };

  const deleteDef = async (defId: string) => {
    try {
      await apiFetch(`/milsimAwards?path=${group.id}/award-defs/${defId}`, { method: "DELETE" });
      showMsg(true, "Award removed."); load();
    } catch (e: any) { showMsg(false, e.message); }
  };

  const issueAward = async (defId: string) => {
    if (!issueRosterId) { showMsg(false, "Select a roster member."); return; }
    setIssuing(true);
    try {
      await apiFetch(`/milsimAwards?path=${group.id}/awards`, {
        method: "POST",
        body: JSON.stringify({ rosterEntryId: issueRosterId, awardDefId: defId, citation: issueCitation || undefined }),
      });
      showMsg(true, "Award issued.");
      setIssuingDefId(null); setIssueRosterId(""); setIssueCitation("");
      load();
    } catch (e: any) { showMsg(false, e.message); }
    finally { setIssuing(false); }
  };

  const revokeAward = async (id: string) => {
    try {
      await apiFetch(`/milsimAwards?path=${group.id}/awards/${id}`, { method: "DELETE" });
      showMsg(true, "Award revoked."); load();
    } catch (e: any) { showMsg(false, e.message); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl space-y-5">

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "library", label: "Award Library" },
          { id: "issued", label: `Issued (${issued.length})` },
        ] as const).map(v => (
          <button key={v.id} onClick={() => setSubView(v.id)}
            className={`px-4 py-2.5 font-display font-bold uppercase tracking-wider text-xs border-b-2 transition-colors ${subView === v.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── AWARD LIBRARY ── */}
      {subView === "library" && (
        <div className="space-y-4">

          {/* Existing award defs — search, filter, pagination */}
          {defs.length > 0 && (
            <div className="space-y-3">
              {/* Search + filter bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search award library..."
                    value={libSearch}
                    onChange={e => handleLibSearch(e.target.value)}
                    className="w-full text-xs bg-background border border-border rounded pl-6 pr-2 py-1.5 font-sans focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {libCountries.length > 0 && (
                  <select
                    value={libCountry}
                    onChange={e => handleLibCountry(e.target.value)}
                    className="text-xs bg-background border border-border rounded px-2 py-1.5 font-sans focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Countries</option>
                    {libCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                <span className="text-[10px] text-muted-foreground font-sans whitespace-nowrap">
                  {filteredDefs.length} of {defs.length} awards
                  {libTotalPages > 1 && ` — page ${libPage}/${libTotalPages}`}
                </span>
              </div>
              {filteredDefs.length === 0 && (
                <div className="text-center py-6 border border-dashed border-border rounded-lg text-muted-foreground text-xs font-sans">
                  No awards match your search
                </div>
              )}
              <div className="space-y-2">
              {pagedDefs.map((d: any) => {
                const isIssuing = issuingDefId === d.id;
                const imgUrl = d.image_url ?? d.image_path ?? null;
                return (
                  <div key={d.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      <div className="shrink-0 w-14 flex items-center justify-center">
                        {imgUrl
                          ? <img src={imgUrl} alt={d.name} className="h-7 w-auto object-fill rounded-sm" />
                          : <Medal className="w-6 h-6 text-muted-foreground opacity-40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold uppercase tracking-wider text-sm">{d.name}</p>
                        {(d.source_country || d.source_branch) && (
                          <p className="text-[10px] font-sans text-muted-foreground mt-0.5">
                            {d.source_country}{d.source_branch && ` — ${d.source_branch}`}
                          </p>
                        )}
                        {d.description && (
                          <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-1">{d.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setIssuingDefId(isIssuing ? null : d.id); setIssueRosterId(""); setIssueCitation(""); }}
                          className="text-xs font-display font-bold uppercase tracking-widest px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded hover:bg-accent/20 transition-colors">
                          Issue
                        </button>
                        <button onClick={() => deleteDef(d.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-display uppercase tracking-widest px-2 py-1.5 rounded hover:bg-red-500/10 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Issue panel */}
                    {isIssuing && (
                      <div className="border-t border-border p-4 bg-secondary/20 flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[180px]">
                          <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Recipient</label>
                          <select value={issueRosterId} onChange={e => setIssueRosterId(e.target.value)}
                            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm font-sans text-foreground">
                            <option value="">Select member...</option>
                            {roster.filter(r => r.status !== "Kicked" && r.status !== "Resigned").map((r: any) => (
                              <option key={r.id} value={r.id}>{r.rank_name ? `${r.rank_name} ` : ""}{r.callsign}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 min-w-[180px]">
                          <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Citation (optional)</label>
                          <input value={issueCitation} onChange={e => setIssueCitation(e.target.value)}
                            placeholder="For gallantry in action..."
                            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm font-sans text-foreground" />
                        </div>
                        <button onClick={() => issueAward(d.id)} disabled={issuing || !issueRosterId}
                          className="px-4 py-1.5 bg-accent text-accent-foreground rounded font-display text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-accent/90 transition-colors flex items-center gap-1.5">
                          {issuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                          Confirm Issue
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
              {/* Pagination */}
              {libTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => setLibPage(p => Math.max(1, p - 1))}
                    disabled={libPage === 1}
                    className="px-3 py-1 text-xs font-display uppercase tracking-widest border border-border rounded hover:bg-secondary disabled:opacity-40 transition-colors">
                    ← Prev
                  </button>
                  <div className="flex gap-1 flex-wrap justify-center">
                    {Array.from({ length: libTotalPages }, (_, i) => i + 1).map(pg => (
                      <button key={pg} onClick={() => setLibPage(pg)}
                        className={`w-7 h-7 text-xs font-display rounded transition-colors ${pg === libPage ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary text-muted-foreground"}`}>
                        {pg}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setLibPage(p => Math.min(libTotalPages, p + 1))}
                    disabled={libPage === libTotalPages}
                    className="px-3 py-1 text-xs font-display uppercase tracking-widest border border-border rounded hover:bg-secondary disabled:opacity-40 transition-colors">
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add award button */}
          {!showCreate && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-lg text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors w-full justify-center">
              <Plus className="w-3.5 h-3.5" /> Add Award to Library
            </button>
          )}

          {/* ── RIBBON PICKER ── */}
          {showCreate && (
            <div className="border border-primary/30 rounded-lg bg-card overflow-hidden">
              <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-display font-black text-xs uppercase tracking-widest text-primary">Add Award from Ribbon Library</p>
                  <p className="text-[10px] font-sans text-muted-foreground mt-0.5">1,172 curated military ribbons — US, UK, Australia, Canada, NATO & 23 nations</p>
                </div>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors ml-4 shrink-0">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">

                {/* Filters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Country</label>
                    <select value={pickerCountry}
                      onChange={e => { const v = e.target.value; setPickerCountry(v); const brs = RIBBON_BRANCHES_BY_COUNTRY[v] ?? []; setPickerBranch(brs.length === 1 ? brs[0] : ""); setSelectedTemplate(null); setPickerPage(0); }}
                      className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm font-sans text-foreground">
                      <option value="">All countries</option>
                      {RIBBON_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Branch / Force</label>
                    <select value={pickerBranch}
                      onChange={e => { setPickerBranch(e.target.value); setSelectedTemplate(null); setPickerPage(0); }}
                      disabled={!pickerCountry}
                      className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm font-sans text-foreground disabled:opacity-40">
                      <option value="">All branches</option>
                      {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Search</label>
                    <input value={pickerSearch}
                      onChange={e => { setPickerSearch(e.target.value); setSelectedTemplate(null); setPickerPage(0); }}
                      placeholder="e.g. Bronze Star, Victoria Cross..."
                      className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm font-sans text-foreground" />
                  </div>
                </div>

                {/* Selected ribbon preview */}
                {selectedTemplate && (
                  <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <img src={selectedTemplate.url} alt={selectedTemplate.name}
                      className="h-8 w-auto object-fill rounded-sm border border-white/10"
                      onError={(e: any) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm uppercase tracking-wider text-primary truncate">{selectedTemplate.name}</p>
                      <p className="text-[10px] text-muted-foreground font-sans">{selectedTemplate.country} — {selectedTemplate.branch}</p>
                    </div>
                    <button onClick={() => setSelectedTemplate(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Ribbon grid */}
                {!selectedTemplate && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-secondary/40 border-b border-border px-3 py-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                        {filteredTemplates.length} ribbons {pickerSearch || pickerCountry ? "matching filters" : "available"}
                        {totalPages > 1 && <span className="ml-1 text-primary">— page {pickerPage + 1}/{totalPages}</span>}
                      </p>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            disabled={pickerPage === 0}
                            onClick={() => setPickerPage(p => Math.max(0, p - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold">
                            ‹
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} onClick={() => setPickerPage(i)}
                              className={`w-6 h-6 flex items-center justify-center rounded border text-[9px] font-display font-bold transition-colors ${pickerPage === i ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                              {i + 1}
                            </button>
                          ))}
                          <button
                            disabled={pickerPage >= totalPages - 1}
                            onClick={() => setPickerPage(p => Math.min(totalPages - 1, p + 1))}
                            className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold">
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {pagedTemplates.map((r, i) => (
                        <button key={pickerPage * RIBBONS_PER_PAGE + i} onClick={() => setSelectedTemplate(r)}
                          title={`${r.name} (${r.country})`}
                          className="flex flex-col items-center gap-1 p-1.5 rounded border border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all group">
                          <img src={r.url} alt={r.name}
                            className="h-5 w-auto object-fill rounded-sm"
                            onError={(e: any) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} />
                          <p className="text-[8px] font-sans text-muted-foreground text-center leading-tight line-clamp-2 group-hover:text-foreground w-full">
                            {r.name.split(" (")[0]}
                          </p>
                        </button>
                      ))}
                      {filteredTemplates.length === 0 && (
                        <div className="col-span-6 text-center py-8 text-xs text-muted-foreground font-sans">
                          No ribbons match — try clearing filters
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Optional description */}
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">Award Criteria / Description (optional)</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
                    placeholder="Awarded for acts of gallantry..."
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans text-foreground resize-none" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={resetForm}
                    className="px-4 py-2 border border-border rounded font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                  <button onClick={createDef} disabled={creating || !selectedTemplate}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add to Award Library
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ISSUED AWARDS ── */}
      {subView === "issued" && (
        <div className="space-y-3">
          {issued.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-border rounded-lg text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-display text-sm uppercase tracking-widest">No awards issued yet</p>
            </div>
          ) : (
            issued.map((a: any) => (
              <div key={a.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="shrink-0 w-14 flex justify-center">
                  {a.award_image_url
                    ? <img src={a.award_image_url} alt={a.award_name} className="h-7 w-auto object-fill rounded-sm" />
                    : <Medal className="w-6 h-6 text-muted-foreground opacity-40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold uppercase tracking-wider text-sm">{a.award_name}</p>
                  <p className="text-xs text-muted-foreground font-sans">
                    To: <span className="text-foreground font-medium">{a.recipient_callsign}</span>
                    {a.reason && <> · <span className="italic">{a.reason}</span></>}
                  </p>
                </div>
                <button onClick={() => revokeAward(a.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-display uppercase tracking-widest px-2 py-1.5 rounded hover:bg-red-500/10 transition-colors shrink-0">
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}


function StreamTab({ group, onUpdated, showMsg }: any) {
  const [streamUrl, setStreamUrl] = useState(group.stream_url ?? "");
  const [isLive, setIsLive] = useState(group.is_live ?? false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/stream`, {
        method: "PATCH",
        body: JSON.stringify({ streamUrl: streamUrl || null, isLive }),
      });
      onUpdated({ ...group, stream_url: streamUrl || null, is_live: isLive });
      showMsg(true, isLive ? "Stream is now LIVE!" : "Stream settings saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };

  const getEmbedUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        const vid = u.searchParams.get("v") || u.pathname.split("/").pop();
        return vid ? `https://www.youtube.com/embed/${vid}?autoplay=0` : null;
      }
      if (u.hostname.includes("twitch.tv")) {
        const channel = u.pathname.split("/").filter(Boolean)[0];
        return channel ? `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}` : null;
      }
    } catch { /* invalid url */ }
    return null;
  };

  const embedUrl = streamUrl ? getEmbedUrl(streamUrl) : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold uppercase tracking-wider">Broadcast Control</h3>
        </div>

        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Stream URL</label>
          <input
            value={streamUrl}
            onChange={e => setStreamUrl(e.target.value)}
            className="mf-input w-full"
            placeholder="https://twitch.tv/yourchannel  or  https://youtube.com/watch?v=..."
          />
          <p className="text-xs text-muted-foreground mt-1">Supports YouTube and Twitch. Visible to anyone viewing your unit page.</p>
        </div>

        <div className="flex items-center justify-between bg-secondary/40 border border-border rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            {isLive ? <Wifi className="w-5 h-5 text-red-400" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
            <div>
              <p className="font-display font-bold uppercase tracking-wider text-sm">{isLive ? "Broadcasting LIVE" : "Off Air"}</p>
              <p className="text-xs text-muted-foreground">{isLive ? "Visitors can see your live stream" : "Toggle to go live"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isLive ? "bg-red-500" : "bg-secondary border border-border"}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isLive ? "left-7" : "left-1"}`} />
          </button>
        </div>

        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Stream Settings
        </button>
      </div>

      {embedUrl && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="font-display font-bold uppercase tracking-wider text-xs">Preview</span>
          </div>
          <div className="aspect-video w-full">
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Stream Preview" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onboarding Tab (Selection Criteria + App Questions + Pipeline) ───────────
function OnboardingTab({ group, onUpdated, showMsg }: any) {
  type OBSub = "criteria" | "questions" | "pipeline";
  const [sub, setSub] = useState<OBSub>("criteria");

  const SUBS: { id: OBSub; label: string; icon: React.ReactNode }[] = [
    { id: "criteria",  label: "Selection Criteria", icon: <Target className="w-3.5 h-3.5" /> },
    { id: "questions", label: "App Questions",       icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "pipeline",  label: "Pipeline",            icon: <UserCheck className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SUBS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded font-display font-bold uppercase tracking-widest text-xs border transition-colors ${
              sub === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {sub === "criteria"  && <SelectionCriteriaTab  group={group} onUpdated={onUpdated} showMsg={showMsg} />}
      {sub === "questions" && <QuestionsTab          group={group} onUpdated={onUpdated} showMsg={showMsg} />}
      {sub === "pipeline"  && <RecruitPipelineTab    group={group} showMsg={showMsg} />}
    </div>
  );
}

// ─── Selection Criteria Tab ───────────────────────────────────────────────────
function SelectionCriteriaTab({ group, onUpdated, showMsg }: any) {
  const [criteria, setCriteria] = useState<string>(group.selection_criteria ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/milsim-groups/${group.id}/info`, {
        method: "PATCH",
        body: JSON.stringify({ selection_criteria: criteria }),
      });
      onUpdated(updated);
      showMsg("Selection criteria saved", "success");
    } catch {
      showMsg("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-black text-lg uppercase tracking-wider text-foreground mb-1">Selection Criteria</h2>
            <p className="text-xs text-muted-foreground font-sans">
              Define the standards, requirements, and expectations applicants must meet to join your unit.
              This is displayed publicly on your unit's profile page.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-2 py-1 rounded">
            <Globe className="w-3 h-3" /> Public
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Criteria (Markdown supported)</p>
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            rows={16}
            className="mf-input w-full resize-y font-mono text-sm"
            placeholder={`## Minimum Requirements
- Age 18+
- Mic required
- Available for scheduled ops

## What We Look For
- Teamwork and communication
- Ability to take orders under pressure
- Prior milsim experience preferred

## Selection Process
1. Submit application
2. Review by command
3. Trial op participation
4. Final acceptance or rejection`}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground font-sans">
            {criteria.length > 0 ? `${criteria.length} characters` : "No criteria set yet — applicants will see an empty page."}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-display font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded transition-all"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            Save Criteria
          </button>
        </div>
      </div>

      {/* Preview */}
      {criteria.trim() && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Public Preview
          </p>
          <div className="prose prose-sm prose-invert max-w-none font-sans text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {criteria}
          </div>
        </div>
      )}
    </div>
  );
}


function QuestionsTab({ group, onUpdated, showMsg }: any) {
  const [questions, setQuestions] = useState<AppQuestion[]>(group.questions);
  const [question, setQuestion] = useState(""); const [required, setRequired] = useState(true);
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!question.trim()) return;
    setAdding(true);
    try {
      const q = await apiFetch<AppQuestion>(`/api/milsim-groups/${group.id}/questions`, { method: "POST", body: JSON.stringify({ question, sortOrder: questions.length, required }) });
      const updated = [...questions, q]; setQuestions(updated); onUpdated({ ...group, questions: updated });
      setQuestion(""); setRequired(true); showMsg(true, "Question added.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/questions/${id}`, { method: "DELETE" });
      const updated = questions.filter((q) => q.id !== id); setQuestions(updated); onUpdated({ ...group, questions: updated });
    } catch (e: any) { showMsg(false, e.message); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground font-sans">These questions are shown publicly on your group profile so prospective applicants know what to prepare.</p>
      <div className="space-y-2">
        {questions.length === 0 && <p className="text-muted-foreground font-sans text-sm">No questions added yet.</p>}
        {questions.map((q, i) => (
          <div key={q.id} className="flex items-start justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 shrink-0 rounded bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-bold text-xs text-primary mt-0.5">{i + 1}</span>
              <div>
                <p className="font-sans text-sm text-foreground">{q.question}</p>
                {q.required && <span className="text-[10px] font-display font-bold uppercase text-accent">Required</span>}
              </div>
            </div>
            <button onClick={() => remove(q.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Add Question</h3>
        <input value={question} onChange={e => setQuestion(e.target.value)} className="mf-input" placeholder="e.g. How long have you played Squad?" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} className="accent-primary w-4 h-4" />
          Required question
        </label>
        <button onClick={add} disabled={adding || !question.trim()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Question
        </button>
      </div>
    </div>
  );
}

// ─── Commendation Wall ────────────────────────────────────────────────────────
function CommendationsTab({ group }: any) {
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch<any[]>(`/api/milsim-groups/${group.id}/awards`)
      .then(d => setAwards(Array.isArray(d) ? d : [])).catch(() => setAwards([])).finally(() => setLoading(false));
  }, [group.id]);
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs text-muted-foreground font-sans">A public record of all commendations bestowed within this unit.</p>
      {awards.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No commendations on record</p>
        </div>
      ) : (
        <div className="space-y-3">
          {awards.map((a: any) => (
            <div key={a.id} className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-4">
              <div className="w-11 h-11 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                {a.award_image_url ? (
                  <img src={a.award_image_url} alt={a.award_name} className="w-8 h-8 object-contain" />
                ) : (
                  <Medal className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{a.award_name}</p>
                  <span className="text-xs text-muted-foreground">{a.created_date ? formatDistanceToNow(new Date(a.created_date), { addSuffix: true }) : ""}</span>
                </div>
                {a.recipient_callsign && <p className="text-xs text-primary font-display font-bold mt-0.5">Awarded to {a.recipient_callsign}</p>}
                {a.award_description && <p className="text-xs text-muted-foreground font-sans mt-1">{a.award_description}</p>}
                {a.reason && <p className="text-xs text-muted-foreground font-sans mt-0.5 italic">"{a.reason}"</p>}
                {a.awarded_by && <p className="text-xs text-muted-foreground mt-0.5">By {a.awarded_by}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Qualifications ───────────────────────────────────────────────────────────
function QualsTab({ group, showMsg }: any) {
  const [quals, setQuals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [adding, setAdding] = useState(false);
  const [grantModal, setGrantModal] = useState<any | null>(null); const [grantRosterId, setGrantRosterId] = useState("");
  const load = () => { apiFetch<any[]>(`/api/milsim-groups/${group.id}/qualifications`).then(setQuals).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [group.id]);
  const add = async () => {
    if (!name.trim()) return; setAdding(true);
    try { await apiFetch(`/api/milsim-groups/${group.id}/qualifications`, { method: "POST", body: JSON.stringify({ name, description: desc || undefined }) }); setName(""); setDesc(""); showMsg(true, "Qualification added."); load(); }
    catch (e: any) { showMsg(false, e.message); } finally { setAdding(false); }
  };
  const remove = async (qid: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/qualifications/${qid}`, { method: "DELETE" }); showMsg(true, "Removed."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  const grant = async (qid: number) => {
    if (!grantRosterId) return;
    try { await apiFetch(`/api/milsim-groups/${group.id}/qualifications/${qid}/grant`, { method: "POST", body: JSON.stringify({ rosterEntryId: parseInt(grantRosterId) }) }); showMsg(true, "Granted."); setGrantModal(null); setGrantRosterId(""); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  const revokeGrant = async (qid: number, grantId: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/qualifications/${qid}/grant/${grantId}`, { method: "DELETE" }); showMsg(true, "Revoked."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return (
    <div className="max-w-3xl space-y-6">
      {quals.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No qualifications defined</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quals.map((q: any) => (
            <div key={q.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3"><GraduationCap className="w-4 h-4 text-primary shrink-0" /><div><p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{q.name}</p>{q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}<p className="text-xs text-muted-foreground">{q.grants?.length ?? 0} qualified</p></div></div>
                <div className="flex gap-2 shrink-0"><button onClick={() => setGrantModal(q)} className="text-xs font-display font-bold uppercase tracking-widest px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors">Grant</button><button onClick={() => remove(q.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button></div>
              </div>
              {q.grants?.length > 0 && (
                <div className="border-t border-border px-5 py-3 bg-secondary/20">
                  <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Qualified Personnel</p>
                  <div className="flex flex-wrap gap-2">
                    {q.grants.map((g: any) => (<div key={g.id} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-primary/20">{g.callsign}<button onClick={() => revokeGrant(q.id, g.id)} className="ml-1 hover:text-destructive transition-colors"><X className="w-3 h-3" /></button></div>))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {grantModal && (
        <div className="bg-card border border-primary/30 rounded-lg p-5 space-y-3">
          <h3 className="font-display font-bold uppercase tracking-wider text-sm">Grant: {grantModal.name}</h3>
          <select value={grantRosterId} onChange={e => setGrantRosterId(e.target.value)} className="mf-input"><option value="">Select member...</option>{group.roster.map((r: RosterEntry) => <option key={r.id} value={r.id}>{r.callsign}</option>)}</select>
          <div className="flex gap-2"><button onClick={() => grant(grantModal.id)} disabled={!grantRosterId} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2 rounded transition-all disabled:opacity-50"><Check className="w-3.5 h-3.5" /> Grant</button><button onClick={() => { setGrantModal(null); setGrantRosterId(""); }} className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">Cancel</button></div>
        </div>
      )}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Add Qualification Type</h3>
        <input value={name} onChange={e => setName(e.target.value)} className="mf-input" placeholder="CQB Certified, Medic Qualified, JTAC..." />
        <input value={desc} onChange={e => setDesc(e.target.value)} className="mf-input" placeholder="Description (optional)" />
        <button onClick={add} disabled={adding || !name.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">{adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add</button>
      </div>
    </div>
  );
}


// ─── Operations Tab (Live Ops + AARs + Briefings merged) ─────────────────────
// ─── Event Hub Tab (Events + Activity Calendar + Campaigns merged) ────────────
function EventHubTab({ group, showMsg }: any) {
  type EHSub = "events" | "calendar" | "campaigns";
  const [sub, setSub] = useState<EHSub>("events");

  const SUBS: { id: EHSub; label: string; icon: React.ReactNode; pro?: boolean }[] = [
    { id: "events",    label: "Operations", icon: <Siren className="w-3.5 h-3.5" /> },
    { id: "calendar",  label: "Calendar",   icon: <CalendarDays className="w-3.5 h-3.5" />, pro: true },
    { id: "campaigns", label: "Campaigns",  icon: <Zap className="w-3.5 h-3.5" />, pro: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SUBS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded font-display font-bold uppercase tracking-widest text-xs border transition-colors ${
              sub === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {s.icon}
            {s.label}
            {s.pro && <span className="ml-1 text-[9px] text-amber-400">★</span>}
          </button>
        ))}
      </div>

      {sub === "events"    && <EventsTab    group={group} showMsg={showMsg} />}
      {sub === "calendar"  && <ActivityCalendarTab group={group} showMsg={showMsg} />}
      {sub === "campaigns" && <CampaignsTab group={group} />}
    </div>
  );
}


function EventsTab({ group, showMsg }: any) {
  const [sub, setSub] = useState<"ops" | "aars" | "briefings" | "warnos" | "lace" | "sitrep" | "medevac" | "conduct">("ops");
  const SUB_TABS = [
    { id: "ops" as const,       label: "Operations",  icon: Siren },
    { id: "aars" as const,      label: "AARs",        icon: ClipboardList },
    { id: "briefings" as const, label: "Briefings",   icon: MapPin },
    { id: "warnos" as const,    label: "WARNOs",      icon: AlertTriangle },
    { id: "lace" as const,      label: "LACE",        icon: Radio },
    { id: "sitrep" as const,    label: "SITREPs",     icon: Target },
    { id: "medevac" as const,   label: "MEDEVAC",     icon: Radio },
    { id: "conduct" as const,   label: "Conduct",     icon: UserMinus2 },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSub(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-all border ${
              sub === id ? "bg-primary/15 border-primary/50 text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>
      {sub === "ops"       && <OpsTab       group={group} showMsg={showMsg} />}
      {sub === "aars"      && <AARsTab      group={group} showMsg={showMsg} />}
      {sub === "briefings" && <BriefingsTab group={group} showMsg={showMsg} />}
      {sub === "warnos"    && <WarnosTab    group={group} showMsg={showMsg} />}
      {sub === "lace"      && <LaceTab         group={group} showMsg={showMsg} />}
      {sub === "sitrep"    && <SitrepTab        group={group} showMsg={showMsg} />}
      {sub === "medevac"   && <MedevacTab         group={group} showMsg={showMsg} />}
      {sub === "conduct"   && <ConductReportTab  group={group} showMsg={showMsg} />}
    </div>
  );
}

// ─── Live Ops / Check-In ──────────────────────────────────────────────────────
function OpsTab({ group, showMsg }: any) {
  const { user } = useAuth();
  const [ops, setOps] = useState<any[]>([]);
  const [aars, setAars] = useState<any[]>([]);
  const [briefings, setBriefings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOp, setExpandedOp] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkTarget, setLinkTarget] = useState<{ opId: string; type: "aar" | "briefing" } | null>(null);
  const emptyForm = { name: "", description: "", game: "", event_type: "Op" as const, scheduled_at: "", end_date: "", status: "Planned" as const };
  const [form, setForm] = useState<any>(emptyForm);
  const [editOpId, setEditOpId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [opsData, aarsData, briefsData] = await Promise.all([
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
        apiFetch(`/milsimAars?path=list&group_id=${group.id}`),
        apiFetch(`/milsimBriefings?path=list&group_id=${group.id}`),
      ]);
      setOps(opsData.events ?? []);
      setAars(aarsData.aars ?? []);
      setBriefings(briefsData.briefings ?? []);
    } catch { }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const saveOp = async () => {
    if (!form.name) { showMsg("Op name required", "error"); return; }
    setSaving(true);
    try {
      if (editOpId) {
        await apiFetch("/activityCalendar?path=update", { method: "POST", body: JSON.stringify({ id: editOpId, title: form.name, ...form }) });
        showMsg("Op updated", "success");
      } else {
        await apiFetch("/activityCalendar?path=create", { method: "POST", body: JSON.stringify({ group_id: group.id, title: form.name, created_by: user?.username, ...form }) });
        showMsg("Op created", "success");
      }
      setShowCreateForm(false); setEditOpId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const deleteOp = async (id: string) => {
    if (!confirm("Delete this op?")) return;
    await apiFetch("/activityCalendar?path=delete", { method: "POST", body: JSON.stringify({ id }) });
    showMsg("Deleted", "success"); load();
  };

  const setOpStatus = async (id: string, status: string) => {
    await apiFetch("/activityCalendar?path=update", { method: "POST", body: JSON.stringify({ id, status }) });
    load();
  };

  const linkDoc = async (docId: string) => {
    if (!linkTarget) return;
    try {
      if (linkTarget.type === "aar") {
        await apiFetch("/milsimAars?path=link-op", { method: "POST", body: JSON.stringify({ aar_id: docId, op_id: linkTarget.opId }) });
      } else {
        await apiFetch("/milsimBriefings?path=link-op", { method: "POST", body: JSON.stringify({ briefing_id: docId, op_id: linkTarget.opId }) });
      }
      showMsg("Linked", "success"); setLinkTarget(null); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const unlinkDoc = async (docId: string, type: "aar" | "briefing") => {
    try {
      if (type === "aar") await apiFetch("/milsimAars?path=link-op", { method: "POST", body: JSON.stringify({ aar_id: docId, op_id: null }) });
      else await apiFetch("/milsimBriefings?path=link-op", { method: "POST", body: JSON.stringify({ briefing_id: docId, op_id: null }) });
      load();
    } catch {}
  };

  const STATUS_COLOR: Record<string, string> = {
    Active: "text-red-400 bg-red-500/10 border-red-500/30",
    Planned: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    Confirmed: "text-green-400 bg-green-500/10 border-green-500/30",
    Completed: "text-muted-foreground bg-secondary border-border",
    Cancelled: "text-muted-foreground bg-secondary/40 border-border",
  };
  const TYPE_COLOR: Record<string, string> = { Op:"text-red-400", Training:"text-yellow-400", Meeting:"text-purple-400", Social:"text-green-400", Admin:"text-muted-foreground", Other:"text-muted-foreground" };
  const CL: Record<string, string> = { unclassified:"text-green-400 border-green-500/30", confidential:"text-blue-400 border-blue-500/30", classified:"text-yellow-400 border-yellow-500/30", "top-secret":"text-red-400 border-red-500/30" };

  const opAars = (opId: string) => aars.filter((a: any) => a.op_id === opId);
  const opBriefings = (opId: string) => briefings.filter((b: any) => b.op_id === opId);
  const unlinkedAars = aars.filter((a: any) => !a.op_id);
  const unlinkedBriefings = briefings.filter((b: any) => !b.op_id);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {linkTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest">Attach {linkTarget.type === "aar" ? "AAR" : "Briefing"}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(linkTarget.type === "aar" ? unlinkedAars : unlinkedBriefings).length === 0 ? (
                <p className="text-xs text-muted-foreground font-sans">No unlinked {linkTarget.type === "aar" ? "AARs" : "briefings"} available.</p>
              ) : (
                (linkTarget.type === "aar" ? unlinkedAars : unlinkedBriefings).map((doc: any) => (
                  <button key={doc.id} onClick={() => linkDoc(doc.id)} className="w-full text-left px-4 py-3 border border-border rounded-lg hover:bg-secondary/40 transition-colors">
                    <p className="font-display font-bold text-sm">{doc.title ?? doc.op_name}</p>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">{doc.author_username ?? doc.created_by ?? ""}</p>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setLinkTarget(null)} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-lg uppercase tracking-widest">Live Ops</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Plan, run, and debrief operations. Attach briefings pre-op and AARs post-op.</p>
        </div>
        <button onClick={() => { setShowCreateForm(v => !v); setEditOpId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Op
        </button>
      </div>

      {(showCreateForm || editOpId) && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary">{editOpId ? "Edit Op" : "New Op"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MField label="Op Name *"><input value={form.name} onChange={e => setForm((f:any) => ({...f, name:e.target.value}))} placeholder="Operation Iron Fist" className="mf-input w-full" /></MField>
            <MField label="Type"><select value={form.event_type} onChange={e => setForm((f:any) => ({...f, event_type:e.target.value}))} className="mf-input w-full">{["Op","Training","Meeting","Social","Admin","Other"].map(t => <option key={t} value={t}>{t}</option>)}</select></MField>
            <MField label="Scheduled Date / Time"><input type="datetime-local" value={form.scheduled_at} onChange={e => setForm((f:any) => ({...f, scheduled_at:e.target.value}))} className="mf-input w-full" /></MField>
            <MField label="End Date"><input type="date" value={form.end_date} onChange={e => setForm((f:any) => ({...f, end_date:e.target.value}))} className="mf-input w-full" /></MField>
            <MField label="Game"><input value={form.game} onChange={e => setForm((f:any) => ({...f, game:e.target.value}))} placeholder="e.g. Arma 3" className="mf-input w-full" /></MField>
            <MField label="Status"><select value={form.status} onChange={e => setForm((f:any) => ({...f, status:e.target.value}))} className="mf-input w-full">{["Planned","Confirmed","Active","Completed","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}</select></MField>
            <div className="md:col-span-2"><MField label="Description"><textarea value={form.description} onChange={e => setForm((f:any) => ({...f, description:e.target.value}))} rows={2} className="mf-input w-full resize-none" /></MField></div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveOp} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editOpId ? "Save" : "Create"}</button>
            <button onClick={() => { setShowCreateForm(false); setEditOpId(null); setForm(emptyForm); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {ops.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-sans text-sm border border-dashed border-border rounded-lg"><Siren className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No ops scheduled yet.</p></div>
      ) : (
        <div className="space-y-3">
          {[...ops].sort((a,b) => new Date(b.scheduled_at ?? b.created_date).getTime() - new Date(a.scheduled_at ?? a.created_date).getTime()).map((op: any) => {
            const linkedAars = opAars(op.id);
            const linkedBriefs = opBriefings(op.id);
            const isExpanded = expandedOp === op.id;
            const isActive = op.status === "Active";
            return (
              <div key={op.id} className={`border rounded-lg overflow-hidden ${isActive ? "border-red-500/40 bg-red-500/5" : "border-border"}`}>
                <button onClick={() => setExpandedOp(isExpanded ? null : op.id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/10 transition-colors text-left">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    {isActive && <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-red-400 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded animate-pulse"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />LIVE</span>}
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_COLOR[op.status] ?? "text-muted-foreground border-border"}`}>{op.status}</span>
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest ${TYPE_COLOR[op.event_type] ?? ""}`}>[{op.event_type ?? "Op"}]</span>
                    <span className="font-display font-bold text-sm">{op.name ?? op.title}</span>
                    {op.game && <span className="text-xs text-muted-foreground font-sans hidden md:block">{op.game}</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground font-sans">
                    {linkedBriefs.length > 0 && <span className="flex items-center gap-1 text-blue-400"><MapPin className="w-3 h-3" />{linkedBriefs.length}</span>}
                    {linkedAars.length > 0 && <span className="flex items-center gap-1 text-green-400"><ClipboardList className="w-3 h-3" />{linkedAars.length}</span>}
                    {op.scheduled_at && <span>{new Date(op.scheduled_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>}
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5 bg-secondary/10">
                    {op.description && <p className="text-sm text-muted-foreground font-sans">{op.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      {["Planned","Confirmed","Active","Completed","Cancelled"].filter(s => s !== op.status).map(s => (
                        <button key={s} onClick={() => setOpStatus(op.id, s)} className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 border border-border rounded hover:bg-secondary transition-colors">→ {s}</button>
                      ))}
                      <button onClick={() => { setEditOpId(op.id); setForm({ name:op.name??op.title??"", description:op.description??"", game:op.game??"", event_type:op.event_type??"Op", scheduled_at:op.scheduled_at?op.scheduled_at.slice(0,16):"", end_date:op.end_date??"", status:op.status??"Planned" }); setShowCreateForm(false); }}
                        className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 border border-border text-muted-foreground rounded hover:text-primary transition-colors"><Pencil className="w-3 h-3" /> Edit</button>
                      <button onClick={() => deleteOp(op.id)} className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors"><Trash2 className="w-3 h-3" /> Delete</button>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-display font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Briefings</p>
                        <button onClick={() => setLinkTarget({ opId: op.id, type: "briefing" })} className="flex items-center gap-1 text-[10px] font-display font-bold uppercase text-muted-foreground border border-border rounded px-2 py-0.5 hover:text-primary transition-colors"><Plus className="w-3 h-3" /> Attach</button>
                      </div>
                      {linkedBriefs.length === 0 ? <p className="text-xs text-muted-foreground font-sans italic">No briefings attached.</p> : (
                        <div className="space-y-1.5">
                          {linkedBriefs.map((b: any) => (
                            <div key={b.id} className="flex items-center justify-between px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded">
                              <div><span className="text-xs font-display font-bold">{b.title}</span><span className={`ml-2 text-[10px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded border ${CL[b.classification] ?? ""}`}>{b.classification ?? "unclassified"}</span></div>
                              <button onClick={() => unlinkDoc(b.id, "briefing")} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-display font-bold uppercase tracking-widest text-green-400 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" /> After Action Reports</p>
                        <button onClick={() => setLinkTarget({ opId: op.id, type: "aar" })} className="flex items-center gap-1 text-[10px] font-display font-bold uppercase text-muted-foreground border border-border rounded px-2 py-0.5 hover:text-primary transition-colors"><Plus className="w-3 h-3" /> Attach</button>
                      </div>
                      {linkedAars.length === 0 ? <p className="text-xs text-muted-foreground font-sans italic">No AARs filed yet.</p> : (
                        <div className="space-y-1.5">
                          {linkedAars.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-green-500/5 border border-green-500/20 rounded">
                              <div><span className="text-xs font-display font-bold">{a.title ?? a.op_name}</span>{a.outcome && <span className="ml-2 text-[10px] text-muted-foreground font-sans">{a.outcome}</span>}</div>
                              <button onClick={() => unlinkDoc(a.id, "aar")} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AARs ─────────────────────────────────────────────────────────────────────
function AARField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p><p className="text-sm text-foreground font-sans whitespace-pre-wrap">{value}</p></div>;
}


/* ─── WARNOs Tab ─────────────────────────────────────────────────────────── */
function WarnosTab({ group, showMsg }: any) {
  const emptyForm = {
    title: "", op_date: "", op_id: "", status: "draft",
    situation_ground: "", situation_enemy: "", situation_friendly: "",
    mission: "",
    timings_hh: "", timings_nmb: "", timings_other: "",
    o_group_time: "", o_group_loc: "", o_group_other: "",
    css: "",
    acknowledge_1_sect: "", acknowledge_2_sect: "", acknowledge_3_sect: "", acknowledge_4_sect: "",
    acknowledge_pl_sgt: "", acknowledge_atts_1: "", acknowledge_atts_2: "", acknowledge_atts_3: "",
  };
  const [warnos, setWarnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    apiFetch<any[]>(`/api/milsim-groups/${group.id}/warnos`)
      .then(d => setWarnos(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  const [ops, setOps] = useState<any[]>([]);
  useEffect(() => {
    apiFetch<any>(`/api/milsim-groups/${group.id}/ops`).then((d: any) => setOps((Array.isArray(d) ? d : (d?.events ?? [])).filter((o:any) => ["Active","Confirmed","Planned","Completed"].includes(o.status)))).catch(() => {});
  }, [group.id]);

  useEffect(() => { load(); }, [group.id]);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await apiFetch(`/api/milsim-groups/${group.id}/warnos/${editId}`, { method: "PATCH", body: JSON.stringify(form) });
        showMsg(true, "WARNO updated.");
      } else {
        await apiFetch(`/api/milsim-groups/${group.id}/warnos`, { method: "POST", body: JSON.stringify(form) });
        showMsg(true, "WARNO created.");
      }
      setCreating(false); setEditId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(false, e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/warnos/${id}`, { method: "DELETE" });
      showMsg(true, "WARNO deleted."); load();
    } catch (e: any) { showMsg(false, e.message); }
  };

  const startEdit = (w: any) => {
    setEditId(w.id);
    setForm({
      title: w.title ?? "", op_date: w.op_date ?? "", status: w.status ?? "draft",
      situation_ground: w.situation_ground ?? "", situation_enemy: w.situation_enemy ?? "", situation_friendly: w.situation_friendly ?? "",
      mission: w.mission ?? "",
      timings_hh: w.timings_hh ?? "", timings_nmb: w.timings_nmb ?? "", timings_other: w.timings_other ?? "",
      o_group_time: w.o_group_time ?? "", o_group_loc: w.o_group_loc ?? "", o_group_other: w.o_group_other ?? "",
      css: w.css ?? "",
      acknowledge_1_sect: w.acknowledge_1_sect ?? "", acknowledge_2_sect: w.acknowledge_2_sect ?? "",
      acknowledge_3_sect: w.acknowledge_3_sect ?? "", acknowledge_4_sect: w.acknowledge_4_sect ?? "",
      acknowledge_pl_sgt: w.acknowledge_pl_sgt ?? "",
      acknowledge_atts_1: w.acknowledge_atts_1 ?? "", acknowledge_atts_2: w.acknowledge_atts_2 ?? "", acknowledge_atts_3: w.acknowledge_atts_3 ?? "",
    });
    setCreating(true);
  };

  const STATUS_STYLE: Record<string, string> = {
    draft:    "text-muted-foreground bg-secondary border-border",
    issued:   "text-orange-400 bg-orange-500/10 border-orange-500/30",
    archived: "text-muted-foreground bg-secondary/40 border-border",
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">Warning Orders — issued before an operation to give early notice of upcoming tasks.</p>
        {!creating && !editId && (
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-all">
            <Plus className="w-3.5 h-3.5" /> New WARNO
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {(creating || editId) && (
        <div className="bg-card border border-primary/30 rounded-lg overflow-hidden">
          {/* WARNO header bar */}
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="font-display font-black text-sm uppercase tracking-widest text-foreground">Warning Order</span>
          </div>

          <div className="p-6 space-y-5">
            {/* Title + Status + Date row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><label className="mf-label">Title *</label><input value={form.title} onChange={setF("title")} className="mf-input" placeholder="Op IRON FIST — WARNO 1" /></div>
              <div><label className="mf-label">Op Date</label><input type="datetime-local" value={form.op_date} onChange={setF("op_date")} className="mf-input" /></div>
            </div>
            <div><label className="mf-label">Linked Op</label><select value={form.op_id ?? ""} onChange={setF("op_id")} className="mf-input"><option value="">— No op —</option>{ops.map((o:any) => <option key={o.id} value={o.id}>{o.title ?? o.name}</option>)}</select></div>
            <div className="w-40"><label className="mf-label">Status</label>
              <select value={form.status} onChange={setF("status")} className="mf-input">
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Section 1 — Situation */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/60 px-4 py-2 border-b border-border"><p className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">1. Situation</p></div>
              <div className="divide-y divide-border">
                <div className="px-4 py-3"><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Ground</label><textarea rows={3} value={form.situation_ground} onChange={setF("situation_ground")} className="mf-input resize-none" placeholder="Terrain, weather, visibility..." /></div>
                <div className="px-4 py-3"><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Enemy</label><textarea rows={3} value={form.situation_enemy} onChange={setF("situation_enemy")} className="mf-input resize-none" placeholder="Enemy strength, disposition, likely COA..." /></div>
                <div className="px-4 py-3"><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Friendly</label><textarea rows={3} value={form.situation_friendly} onChange={setF("situation_friendly")} className="mf-input resize-none" placeholder="Higher unit intentions, adjacent units..." /></div>
              </div>
            </div>

            {/* Section 2 — Mission */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/60 px-4 py-2 border-b border-border"><p className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">2. Mission</p></div>
              <div className="px-4 py-3"><textarea rows={3} value={form.mission} onChange={setF("mission")} className="mf-input resize-none" placeholder="Who, what, where, when, why..." /></div>
            </div>

            {/* Section 3 — Timings */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/60 px-4 py-2 border-b border-border"><p className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">3. Timings</p></div>
              <div className="px-4 py-3 grid grid-cols-3 gap-3">
                <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">H Hr</label><input value={form.timings_hh} onChange={setF("timings_hh")} className="mf-input" placeholder="e.g. 1800Z" /></div>
                <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">NMB</label><input value={form.timings_nmb} onChange={setF("timings_nmb")} className="mf-input" placeholder="e.g. 30 mins" /></div>
                <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Other</label><input value={form.timings_other} onChange={setF("timings_other")} className="mf-input" /></div>
              </div>
            </div>

            {/* Section 4 — O Group */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/60 px-4 py-2 border-b border-border"><p className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">4. O Group</p></div>
              <div className="px-4 py-3 grid grid-cols-3 gap-3">
                <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Time</label><input value={form.o_group_time} onChange={setF("o_group_time")} className="mf-input" placeholder="e.g. 1700Z" /></div>
                <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Loc</label><input value={form.o_group_loc} onChange={setF("o_group_loc")} className="mf-input" placeholder="e.g. Grid 123456" /></div>
                <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Other</label><input value={form.o_group_other} onChange={setF("o_group_other")} className="mf-input" /></div>
              </div>
            </div>

            {/* Section 5 — CSS */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/60 px-4 py-2 border-b border-border"><p className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">5. CSS (Combat Service Support)</p></div>
              <div className="px-4 py-3"><textarea rows={3} value={form.css} onChange={setF("css")} className="mf-input resize-none" placeholder="Ammo, medical, transport, resupply..." /></div>
            </div>

            {/* Section 6 — Acknowledge */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/60 px-4 py-2 border-b border-border"><p className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">6. Acknowledge (Radio or Sign)</p></div>
              <div className="px-4 py-3 space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">1 Sect</label><input value={form.acknowledge_1_sect} onChange={setF("acknowledge_1_sect")} className="mf-input text-xs" /></div>
                  <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">2 Sect</label><input value={form.acknowledge_2_sect} onChange={setF("acknowledge_2_sect")} className="mf-input text-xs" /></div>
                  <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">3 Sect</label><input value={form.acknowledge_3_sect} onChange={setF("acknowledge_3_sect")} className="mf-input text-xs" /></div>
                  <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">4 Sect</label><input value={form.acknowledge_4_sect} onChange={setF("acknowledge_4_sect")} className="mf-input text-xs" /></div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Pl Sgt</label><input value={form.acknowledge_pl_sgt} onChange={setF("acknowledge_pl_sgt")} className="mf-input text-xs" /></div>
                  <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Atts 1</label><input value={form.acknowledge_atts_1} onChange={setF("acknowledge_atts_1")} className="mf-input text-xs" /></div>
                  <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Atts 2</label><input value={form.acknowledge_atts_2} onChange={setF("acknowledge_atts_2")} className="mf-input text-xs" /></div>
                  <div><label className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground block mb-1">Atts 3</label><input value={form.acknowledge_atts_3} onChange={setF("acknowledge_atts_3")} className="mf-input text-xs" /></div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={submit} disabled={saving || !form.title.trim()}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editId ? "Update WARNO" : "Issue WARNO"}
              </button>
              <button onClick={() => { setCreating(false); setEditId(null); setForm(emptyForm); }}
                className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {warnos.length === 0 && !creating ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-display text-sm uppercase tracking-widest">No warning orders issued</p>
        </div>
      ) : (
        <div className="space-y-3">
          {warnos.map((w: any) => (
            <div key={w.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === w.id ? null : w.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm uppercase tracking-wider text-foreground truncate">{w.title}</p>
                  {w.op_date && <p className="text-xs text-muted-foreground font-sans mt-0.5">{new Date(w.op_date).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}</p>}
                </div>
                <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_STYLE[w.status] ?? STATUS_STYLE.draft}`}>{w.status}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${expandedId === w.id ? "rotate-180" : ""}`} />
              </button>

              {expandedId === w.id && (
                <div className="border-t border-border px-4 py-4 space-y-4">
                  {/* Situation */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-display font-black uppercase tracking-widest text-primary border-b border-border pb-1">1. Situation</p>
                    {w.situation_ground && <WField label="Ground" value={w.situation_ground} />}
                    {w.situation_enemy && <WField label="Enemy" value={w.situation_enemy} />}
                    {w.situation_friendly && <WField label="Friendly" value={w.situation_friendly} />}
                  </div>
                  {w.mission && <div><p className="text-[10px] font-display font-black uppercase tracking-widest text-primary border-b border-border pb-1 mb-2">2. Mission</p><p className="text-sm text-foreground font-sans whitespace-pre-wrap">{w.mission}</p></div>}
                  {(w.timings_hh || w.timings_nmb || w.timings_other) && (
                    <div><p className="text-[10px] font-display font-black uppercase tracking-widest text-primary border-b border-border pb-1 mb-2">3. Timings</p>
                      <div className="flex gap-6 text-sm font-sans">
                        {w.timings_hh && <span><span className="text-muted-foreground text-xs">H Hr: </span>{w.timings_hh}</span>}
                        {w.timings_nmb && <span><span className="text-muted-foreground text-xs">NMB: </span>{w.timings_nmb}</span>}
                        {w.timings_other && <span>{w.timings_other}</span>}
                      </div>
                    </div>
                  )}
                  {(w.o_group_time || w.o_group_loc || w.o_group_other) && (
                    <div><p className="text-[10px] font-display font-black uppercase tracking-widest text-primary border-b border-border pb-1 mb-2">4. O Group</p>
                      <div className="flex gap-6 text-sm font-sans">
                        {w.o_group_time && <span><span className="text-muted-foreground text-xs">Time: </span>{w.o_group_time}</span>}
                        {w.o_group_loc && <span><span className="text-muted-foreground text-xs">Loc: </span>{w.o_group_loc}</span>}
                        {w.o_group_other && <span>{w.o_group_other}</span>}
                      </div>
                    </div>
                  )}
                  {w.css && <div><p className="text-[10px] font-display font-black uppercase tracking-widest text-primary border-b border-border pb-1 mb-2">5. CSS</p><p className="text-sm text-foreground font-sans whitespace-pre-wrap">{w.css}</p></div>}
                  {(w.acknowledge_1_sect || w.acknowledge_2_sect || w.acknowledge_pl_sgt) && (
                    <div><p className="text-[10px] font-display font-black uppercase tracking-widest text-primary border-b border-border pb-1 mb-2">6. Acknowledge</p>
                      <div className="grid grid-cols-4 gap-2 text-xs font-sans">
                        {w.acknowledge_1_sect && <span><span className="text-muted-foreground">1 Sect: </span>{w.acknowledge_1_sect}</span>}
                        {w.acknowledge_2_sect && <span><span className="text-muted-foreground">2 Sect: </span>{w.acknowledge_2_sect}</span>}
                        {w.acknowledge_3_sect && <span><span className="text-muted-foreground">3 Sect: </span>{w.acknowledge_3_sect}</span>}
                        {w.acknowledge_4_sect && <span><span className="text-muted-foreground">4 Sect: </span>{w.acknowledge_4_sect}</span>}
                        {w.acknowledge_pl_sgt && <span><span className="text-muted-foreground">Pl Sgt: </span>{w.acknowledge_pl_sgt}</span>}
                        {w.acknowledge_atts_1 && <span><span className="text-muted-foreground">Atts 1: </span>{w.acknowledge_atts_1}</span>}
                        {w.acknowledge_atts_2 && <span><span className="text-muted-foreground">Atts 2: </span>{w.acknowledge_atts_2}</span>}
                        {w.acknowledge_atts_3 && <span><span className="text-muted-foreground">Atts 3: </span>{w.acknowledge_atts_3}</span>}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button onClick={() => startEdit(w)} className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5 transition-colors"><Pencil className="w-3 h-3" /> Edit</button>
                    <button onClick={() => remove(w.id)} className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-destructive/70 hover:text-destructive border border-border hover:border-destructive/40 rounded px-3 py-1.5 transition-colors"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p><p className="text-sm text-foreground font-sans whitespace-pre-wrap pl-2 border-l border-border">{value}</p></div>;
}

function AARsTab({ group, showMsg }: any) {
  const [aars, setAars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const emptyForm = { op_name: "", op_date: "", op_id: "", summary: "", objectives_hit: "", objectives_missed: "", casualties: "", commendations: "", recommendations: "", classification: "unclassified" };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const load = () => { apiFetch<any[]>(`/api/milsim-groups/${group.id}/aars`).then(setAars).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [group.id]);
  const [ops, setOps] = useState<any[]>([]);
  useEffect(() => {
    apiFetch<any>(`/api/milsim-groups/${group.id}/ops`).then((d: any) => setOps((Array.isArray(d) ? d : (d?.events ?? [])).filter((o:any) => ["Active","Confirmed","Planned","Completed"].includes(o.status)))).catch(() => {});
  }, [group.id]);

  const submit = async () => {
    if (!form.op_name.trim()) return; setSaving(true);
    try {
      if (editId) { await apiFetch(`/api/milsim-groups/${group.id}/aars/${editId}`, { method: "PATCH", body: JSON.stringify(form) }); showMsg(true, "AAR updated."); }
      else { await apiFetch(`/api/milsim-groups/${group.id}/aars`, { method: "POST", body: JSON.stringify(form) }); showMsg(true, "AAR filed."); }
      setCreating(false); setEditId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(false, e.message); } finally { setSaving(false); }
  };
  const remove = async (id: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/aars/${id}`, { method: "DELETE" }); showMsg(true, "AAR deleted."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  const CL: Record<string, string> = { "unclassified": "text-green-400 bg-green-500/10 border-green-500/30", "confidential": "text-blue-400 bg-blue-500/10 border-blue-500/30", "classified": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", "top-secret": "text-red-400 bg-red-500/10 border-red-500/30" };
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  const setF = (k: string) => (e: any) => setForm((f: any) => ({...f, [k]: e.target.value}));
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">After Action Reports — filed post-op.</p>
        {!creating && !editId && <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-all"><Plus className="w-3.5 h-3.5" /> File AAR</button>}
      </div>
      {(creating || editId !== null) && (
        <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-4">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm">{editId ? "Edit AAR" : "New AAR"}</h3>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Op Name *</label><input value={form.op_name} onChange={setF("op_name")} className="mf-input" placeholder="Operation Iron Fist" /></div><div><label className="mf-label">Op Date</label><input type="date" value={form.op_date} onChange={setF("op_date")} className="mf-input" /></div></div>
          <div><label className="mf-label">Linked Op</label><select value={form.op_id ?? ""} onChange={setF("op_id")} className="mf-input"><option value="">— No op —</option>{ops.map((o:any) => <option key={o.id} value={o.id}>{o.title ?? o.name}</option>)}</select></div>
          <div><label className="mf-label">Classification</label><select value={form.classification} onChange={setF("classification")} className="mf-input">{["unclassified","confidential","classified","top-secret"].map(c => <option key={c} value={c}>{c.replace("-"," ").toUpperCase()}</option>)}</select></div>
          <div><label className="mf-label">Summary</label><textarea rows={3} value={form.summary} onChange={setF("summary")} className="mf-input resize-none" placeholder="Overall mission summary..." /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Objectives Hit</label><textarea rows={3} value={form.objectives_hit} onChange={setF("objectives_hit")} className="mf-input resize-none" /></div><div><label className="mf-label">Objectives Missed</label><textarea rows={3} value={form.objectives_missed} onChange={setF("objectives_missed")} className="mf-input resize-none" /></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Casualties</label><textarea rows={2} value={form.casualties} onChange={setF("casualties")} className="mf-input resize-none" /></div><div><label className="mf-label">Commendations</label><textarea rows={2} value={form.commendations} onChange={setF("commendations")} className="mf-input resize-none" /></div></div>
          <div><label className="mf-label">Recommendations</label><textarea rows={3} value={form.recommendations} onChange={setF("recommendations")} className="mf-input resize-none" /></div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving || !form.op_name.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editId ? "Update" : "File AAR"}</button>
            <button onClick={() => { setCreating(false); setEditId(null); setForm(emptyForm); }} className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
      {aars.length === 0 && !creating ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground"><ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No AARs filed</p></div>
      ) : (
        <div className="space-y-3">
          {aars.map((a: any) => (
            <div key={a.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
                <div className="flex items-center gap-3 flex-wrap"><span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CL[a.classification] ?? ""}`}>{(a.classification ?? "unclassified").replace("-"," ")}</span><span className="font-display font-bold text-sm text-foreground">{a.op_name}</span>{a.op_date && <span className="text-xs text-muted-foreground">{format(new Date(a.op_date + "T00:00:00"), "MMM dd, yyyy")}</span>}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditId(a.id); setForm({ op_name: a.op_name, op_date: a.op_date?.split("T")[0] ?? "", summary: a.summary ?? a.content ?? "", objectives_hit: a.objectives_hit ?? "", objectives_missed: a.objectives_missed ?? "", casualties: a.casualties ?? "", commendations: a.commendations ?? "", recommendations: a.recommendations ?? "", classification: a.classification }); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); remove(a.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  {expandedId === a.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedId === a.id && (
                <div className="border-t border-border p-5 space-y-4 bg-secondary/10">
                  {(a.summary ?? a.content) && <AARField label="Summary" value={a.summary ?? a.content} />}
                  {a.objectives_hit && <AARField label="Objectives Hit" value={a.objectives_hit} />}
                  {a.objectives_missed && <AARField label="Objectives Missed" value={a.objectives_missed} />}
                  {a.casualties && <AARField label="Casualties" value={a.casualties} />}
                  {a.commendations && <AARField label="Commendations" value={a.commendations} />}
                  {a.recommendations && <AARField label="Recommendations" value={a.recommendations} />}
                  <p className="text-xs text-muted-foreground">Filed by {a.created_by} · {formatDistanceToNow(new Date(a.created_date ?? a.created_at ?? Date.now()), { addSuffix: true })}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Briefings ────────────────────────────────────────────────────────────────

/* ─── LACE Report Tab ─────────────────────────────────────────────────────── */
/* ─── LACE Report Tab — NATO Standard ───────────────────────────────────────
   LACE: Liquid · Ammo · Casualty · Equipment
   Colour codes: GREEN (good — shown for visibility), ORANGE (low/degraded), RED (out/critical)
   DTG format, FROM/TO callsigns, slate-card layout
──────────────────────────────────────────────────────────────────────────── */
function LaceTab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success" | "error") => void }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const dtgNow = `${String(now.getUTCDate()).padStart(2,'0')}${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}Z ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  const emptyForm = {
    from_callsign: "", to_callsign: "", op_id: "", op_name: "",
    report_time: dtgNow,
    liquid: "GREEN", liquid_note: "",
    ammo: "GREEN", ammo_note: "",
    casualty: "GREEN", casualty_note: "",
    equipment: "GREEN", equipment_note: "",
  };
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [d, opsData, rosterData] = await Promise.all([
        apiFetch(`/milsimLace?path=list&group_id=${group.id}`),
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
        apiFetch(`/milsimGroups?path=mine/own`),
      ]);
      setReports(d.lace_reports ?? []);
      setOps((opsData.events ?? []).filter((o: any) => ["Active","Confirmed","Planned"].includes(o.status)));
      setRoster((rosterData.roster ?? []).filter((m:any) => m.status === "Active"));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [group.id]);

  const save = async () => {
    if (!form.from_callsign) { showMsg("FROM callsign required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        group_id: group.id, reported_by: user?.username ?? "Unknown",
        callsign: form.from_callsign,
        report_time: form.report_time,
        op_id: form.op_id, op_name: form.op_name,
        liquid: form.liquid, liquid_note: form.liquid_note,
        ammo: form.ammo, ammo_note: form.ammo_note,
        casualty: form.casualty, casualty_note: form.casualty_note,
        equipment: form.equipment, equipment_note: form.equipment_note,
      };
      if (payload.op_id) { const op = ops.find((o:any) => o.id === payload.op_id); if (op) payload.op_name = op.title ?? op.name ?? ""; }
      await apiFetch("/milsimLace?path=create", { method: "POST", body: JSON.stringify(payload) });
      showMsg("LACE filed", "success"); setShowForm(false); setForm({ ...emptyForm, report_time: dtgNow }); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const STATUS: Record<string, { color: string; bg: string; border: string; dot: string; desc: string }> = {
    GREEN:  { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40",  dot: "bg-green-400",  desc: "All Good / Fully Operational" },
    ORANGE: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/40", dot: "bg-orange-400", desc: "Low / Degraded — able to continue" },
    RED:    { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40",    dot: "bg-red-400",    desc: "Out / Critical — resupply required" },
  };

  const FIELDS: { key: "liquid"|"ammo"|"casualty"|"equipment"; letter: string; label: string; sublabel: string; noteKey: "liquid_note"|"ammo_note"|"casualty_note"|"equipment_note"; notePlaceholder: string }[] = [
    { key: "liquid",    letter: "L", label: "LIQUID",    sublabel: "Water / hydration supply",          noteKey: "liquid_note",    notePlaceholder: "e.g. 2x water bottles remaining per man" },
    { key: "ammo",      letter: "A", label: "AMMO",      sublabel: "Ammunition across all weapons",     noteKey: "ammo_note",      notePlaceholder: "e.g. Orange 5.56, Red AT4" },
    { key: "casualty",  letter: "C", label: "CASUALTY",  sublabel: "# up / # WIA / # KIA",             noteKey: "casualty_note",  notePlaceholder: "e.g. 4 up, 1 WIA (walking)" },
    { key: "equipment", letter: "E", label: "EQUIPMENT", sublabel: "Mission-critical gear status",       noteKey: "equipment_note", notePlaceholder: "e.g. Orange bandages, Red NVG" },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg uppercase tracking-widest">LACE Report</h2>
            <span className="text-xs font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded">NATO Standard</span>
          </div>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Liquid · Ammo · Casualty · Equipment — section status to higher command.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> File LACE
        </button>
      </div>

      {/* Colour Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {Object.entries(STATUS).map(([k, s]) => (
          <div key={k} className={`flex items-start gap-2.5 p-2.5 rounded border ${s.bg} ${s.border}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot} mt-0.5 shrink-0`} />
            <div><p className={`font-display font-black text-xs uppercase tracking-widest ${s.color}`}>{k}</p><p className="text-xs text-muted-foreground font-sans">{s.desc}</p></div>
          </div>
        ))}
      </div>

      {/* Form — styled as slate card */}
      {showForm && (
        <div className="border border-primary/40 rounded-lg overflow-hidden">
          {/* Slate card header */}
          <div className="bg-primary/15 border-b border-primary/30 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-display font-black text-sm uppercase tracking-widest text-primary">LACE REPORT — SLATE CARD</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">Complete all fields. Report to next higher element.</p>
            </div>
            <span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground border border-border px-2 py-1 rounded">UNCLASSIFIED</span>
          </div>

          <div className="p-5 space-y-5 bg-card">
            {/* Header fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-border">
              <MField label="DTG (Date-Time Group)">
                <input value={form.report_time} onChange={e => setForm((f:any) => ({...f, report_time: e.target.value}))} placeholder={dtgNow} className="mf-input w-full font-mono text-xs" />
              </MField>
              <MField label="FROM (Callsign) *">
                <select value={form.from_callsign} onChange={e => setForm((f:any) => ({...f, from_callsign: e.target.value}))} className="mf-input w-full">
                  <option value="">— Select callsign —</option>
                  {roster.map((m:any) => <option key={m.id} value={m.callsign}>{m.callsign}{m.rank_name ? ` (${m.rank_name})` : ""}</option>)}
                </select>
              </MField>
              <MField label="TO (Higher Element)">
                <input value={form.to_callsign} onChange={e => setForm((f:any) => ({...f, to_callsign: e.target.value}))} placeholder="e.g. PLATOON ACTUAL / Coy HQ" className="mf-input w-full" />
              </MField>
            </div>
            <MField label="Linked Op (Optional)">
              <select value={form.op_id} onChange={e => setForm((f:any) => ({...f, op_id: e.target.value}))} className="mf-input w-full">
                <option value="">— No op —</option>
                {ops.map((o:any) => <option key={o.id} value={o.id}>{o.title ?? o.name}</option>)}
              </select>
            </MField>

            {/* LACE fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELDS.map(f => (
                <div key={f.key} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-secondary/40 px-4 py-2 border-b border-border flex items-center gap-2">
                    <span className={`w-7 h-7 rounded flex items-center justify-center font-display font-black text-sm ${STATUS[form[f.key]]?.bg} ${STATUS[form[f.key]]?.color} border ${STATUS[form[f.key]]?.border}`}>{f.letter}</span>
                    <div>
                      <p className="font-display font-black text-xs uppercase tracking-widest">{f.label}</p>
                      <p className="text-xs text-muted-foreground font-sans">{f.sublabel}</p>
                    </div>
                  </div>
                  <div className="p-3 space-y-2.5">
                    <div className="flex gap-2">
                      {(["GREEN","ORANGE","RED"] as const).map(status => {
                        const cfg = STATUS[status];
                        const active = form[f.key] === status;
                        return (
                          <button key={status} onClick={() => setForm((prev:any) => ({...prev, [f.key]: status}))}
                            className={`flex-1 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${active ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-1 ring-inset ${cfg.border}` : "border-border text-muted-foreground hover:bg-secondary/60"}`}>
                            <span className={`w-2 h-2 rounded-full ${active ? cfg.dot : "bg-muted-foreground/30"}`} />{status}
                          </button>
                        );
                      })}
                    </div>
                    <input value={form[f.noteKey]} onChange={e => setForm((prev:any) => ({...prev, [f.noteKey]: e.target.value}))} placeholder={f.notePlaceholder} className="mf-input w-full text-xs font-sans" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Transmit Report
              </button>
              <button onClick={() => { setShowForm(false); setForm({...emptyForm, report_time: dtgNow}); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Records */}
      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg"><Radio className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-sans">No LACE reports filed.</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map((r:any) => {
            const vals = [r.liquid, r.ammo, r.casualty, r.equipment];
            const hasRed = vals.some(v => v === "RED");
            const hasOrange = vals.some(v => v === "ORANGE");
            const bCls = hasRed ? "border-red-500/50" : hasOrange ? "border-orange-500/40" : "border-green-500/30";
            return (
              <div key={r.id} className={`border ${bCls} rounded-lg overflow-hidden bg-card`}>
                <div className="bg-secondary/30 border-b border-border px-4 py-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="font-display font-black text-sm uppercase tracking-widest">{r.callsign}</span>
                      {r.op_name && <span className="ml-2 text-xs text-muted-foreground font-sans">/ {r.op_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">{r.report_time || new Date(r.created_date).toUTCString().slice(5,22)}</span>
                    <span className="text-xs text-muted-foreground font-sans">{r.reported_by}</span>
                    <button onClick={async () => { if(!confirm("Delete?")) return; await apiFetch("/milsimLace?path=delete",{method:"POST",body:JSON.stringify({id:r.id})}); load(); }} className="text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-4">
                  {FIELDS.map((f,i) => {
                    const val:string = (r[f.key] ?? "GREEN").toUpperCase();
                    const cfg = STATUS[val] ?? STATUS["GREEN"];
                    return (
                      <div key={f.key} className={`p-3 space-y-1 ${i < 3 ? "border-r border-border" : ""}`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-display font-black text-xs ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{f.letter}</span>
                          <span className="text-xs text-muted-foreground font-display font-bold uppercase tracking-wider">{f.label}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-display font-black text-xs uppercase tracking-widest ${cfg.color}`}>
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{val}
                        </div>
                        {r[f.noteKey] && <p className="text-xs text-muted-foreground font-sans">{r[f.noteKey]}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── SITREP Tab — NATO Standard ─────────────────────────────────────────────
   NATO SITREP: DTG · FROM · TO · LOCATION · ACTIVITY · REMARKS
   Compact slate card — answers "where are you?" and "what are you doing?"
──────────────────────────────────────────────────────────────────────────── */
/* ─── SITREP Tab — NATO Slate Card (ABCDE format) ────────────────────────────
   A = When  B = Where  C = What it is  D = What is it doing  E = What are you doing about it
   Gold/amber table layout matching real slate card
──────────────────────────────────────────────────────────────────────────── */
function SitrepTab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success" | "error") => void }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const dtgNow = `${String(now.getUTCDate()).padStart(2,'0')}${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}Z ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  const emptyForm = {
    from_callsign: "", to_callsign: "", op_id: "", op_name: "",
    report_time: dtgNow,
    // ABCDE
    field_a: "",  // When (DTG of event/sighting)
    field_b: "",  // Where (Grid/Location)
    field_c: "",  // What it is (Description of subject)
    field_d: "",  // What is it doing (Activity)
    field_e: "",  // What are you doing about it (Own action)
    // Supplementary
    enemy_contact: "NONE",
    friendly_casualties: "NONE", casualty_notes: "",
    mission_status: "ON TRACK",
  };
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [d, opsData, rosterData] = await Promise.all([
        apiFetch(`/milsimSitrep?path=list&group_id=${group.id}`),
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
        apiFetch(`/milsimGroups?path=mine/own`),
      ]);
      setReports(d.sitreps ?? []);
      setOps((opsData.events ?? []).filter((o:any) => ["Active","Confirmed","Planned"].includes(o.status)));
      setRoster((rosterData.roster ?? []).filter((m:any) => m.status === "Active"));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [group.id]);

  const save = async () => {
    if (!form.from_callsign) { showMsg("FROM callsign required", "error"); return; }
    if (!form.field_b) { showMsg("Where (B — Location) is mandatory", "error"); return; }
    setSaving(true);
    try {
      const payload: any = {
        group_id: group.id, reported_by: user?.username ?? "Unknown",
        callsign: form.from_callsign, report_time: form.report_time,
        op_id: form.op_id, op_name: form.op_name,
        // Map ABCDE to existing entity fields
        position: form.field_b,
        activity: form.field_d,
        enemy_contact: form.enemy_contact,
        friendly_casualties: form.friendly_casualties, casualty_notes: form.casualty_notes,
        mission_status: form.mission_status,
        next_action: form.field_e,
        additional_info: JSON.stringify({
          a: form.field_a,
          c: form.field_c,
          b: form.field_b,
          d: form.field_d,
          e: form.field_e,
        }),
      };
      if (payload.op_id) { const op = ops.find((o:any) => o.id === payload.op_id); if (op) payload.op_name = op.title ?? op.name ?? ""; }
      await apiFetch("/milsimSitrep?path=create", { method: "POST", body: JSON.stringify(payload) });
      showMsg("SITREP transmitted", "success"); setShowForm(false); setForm({...emptyForm, report_time: dtgNow}); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const CONTACT: Record<string, { color: string; bg: string; border: string }> = {
    NONE:      { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40" },
    POSSIBLE:  { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/40" },
    CONFIRMED: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/40" },
    ENGAGED:   { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40" },
  };
  const MISSION: Record<string, { color: string; bg: string; border: string }> = {
    "ON TRACK":    { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40" },
    "DELAYED":     { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/40" },
    "COMPROMISED": { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/40" },
    "ABORT":       { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40" },
  };
  const CAS_COLOR: Record<string, string> = { NONE:"text-green-400", MINOR:"text-yellow-400", SIGNIFICANT:"text-orange-400", CRITICAL:"text-red-400" };

  // The 5 ABCDE rows
  const ROWS: { letter: string; label: string; sublabel: string; field: string; placeholder: string; rows?: number }[] = [
    { letter: "A", label: "When?",                    sublabel: "DTG of the event / sighting / activity",     field: "field_a", placeholder: `e.g. ${dtgNow}` },
    { letter: "B", label: "Where?",                   sublabel: "Grid reference or location descriptor",       field: "field_b", placeholder: "e.g. Grid 4523, Compound 6-6, Treeline NE of OBJ" },
    { letter: "C", label: "What is it?",              sublabel: "Description — type, size, composition",       field: "field_c", placeholder: "e.g. Enemy infantry section, ~8 personnel, light weapons" },
    { letter: "D", label: "What is it doing?",        sublabel: "Observed activity or direction of movement",  field: "field_d", placeholder: "e.g. Patrolling south along Route AMBER, no apparent awareness" },
    { letter: "E", label: "What are you doing about it?", sublabel: "Own element's action or intent",         field: "field_e", placeholder: "e.g. Breaking contact, requesting fire support, holding position", rows: 2 },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg uppercase tracking-widest">SITREP</h2>
            <span className="text-xs font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 rounded">NATO Slate Card</span>
          </div>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Situation Report — A=When · B=Where · C=What is it · D=What is it doing · E=What are you doing about it</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Send SITREP
        </button>
      </div>

      {showForm && (
        <div className="border border-amber-500/50 rounded-lg overflow-hidden">
          {/* Slate card header — amber to match real card */}
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-display font-black text-sm uppercase tracking-widest text-amber-400">SITREP — SLATE CARD</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">AUTHORITY: NATO Standard · 4IB 2 Signals Regiment Format</p>
            </div>
            <span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground border border-border px-2 py-1 rounded">UNCLASSIFIED</span>
          </div>

          <div className="bg-card">
            {/* FROM / TO / DTG header row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b border-amber-500/20">
              <MField label="DTG (Report Time)">
                <input value={form.report_time} onChange={e => setForm((f:any) => ({...f, report_time: e.target.value}))} placeholder={dtgNow} className="mf-input w-full font-mono text-xs" />
              </MField>
              <MField label="FROM (Callsign) *">
                <select value={form.from_callsign} onChange={e => setForm((f:any) => ({...f, from_callsign: e.target.value}))} className="mf-input w-full">
                  <option value="">— Select callsign —</option>
                  {roster.map((m:any) => <option key={m.id} value={m.callsign}>{m.callsign}{m.rank_name ? ` (${m.rank_name})` : ""}</option>)}
                </select>
              </MField>
              <MField label="TO (Higher Element)">
                <input value={form.to_callsign} onChange={e => setForm((f:any) => ({...f, to_callsign: e.target.value}))} placeholder="e.g. PLATOON ACTUAL" className="mf-input w-full" />
              </MField>
            </div>
            <div className="px-4 pb-4 border-b border-amber-500/20">
              <MField label="Linked Op (Optional)">
                <select value={form.op_id} onChange={e => setForm((f:any) => ({...f, op_id: e.target.value}))} className="mf-input w-full">
                  <option value="">— No op —</option>
                  {ops.map((o:any) => <option key={o.id} value={o.id}>{o.title ?? o.name}</option>)}
                </select>
              </MField>
            </div>

            {/* ABCDE table — styled to match the amber slate card */}
            <div className="border-b border-amber-500/20">
              {ROWS.map((row, i) => (
                <div key={row.letter} className={`flex border-b border-amber-500/20 last:border-0 ${i % 2 === 0 ? "" : ""}`}>
                  {/* Letter column */}
                  <div className="w-12 shrink-0 flex items-center justify-center bg-amber-500/15 border-r border-amber-500/30">
                    <span className="font-display font-black text-lg text-amber-400">{row.letter}</span>
                  </div>
                  {/* Label column */}
                  <div className="w-44 shrink-0 flex flex-col justify-center px-3 py-3 bg-amber-500/10 border-r border-amber-500/30">
                    <p className="font-display font-black text-xs uppercase tracking-widest text-amber-300">{row.label}</p>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5 leading-tight">{row.sublabel}</p>
                  </div>
                  {/* Input column */}
                  <div className="flex-1 p-2.5">
                    {row.rows ? (
                      <textarea
                        value={form[row.field]}
                        onChange={e => setForm((f:any) => ({...f, [row.field]: e.target.value}))}
                        rows={row.rows}
                        placeholder={row.placeholder}
                        className="mf-input w-full resize-none text-sm"
                      />
                    ) : (
                      <input
                        value={form[row.field]}
                        onChange={e => setForm((f:any) => ({...f, [row.field]: e.target.value}))}
                        placeholder={row.placeholder}
                        className="mf-input w-full text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Supplementary status strip */}
            <div className="p-4 border-t border-amber-500/20">
              <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">— Supplementary Status (Optional) —</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Enemy Contact */}
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <p className="font-display font-bold text-xs uppercase tracking-widest">Enemy Contact</p>
                  <div className="flex flex-wrap gap-1">
                    {(["NONE","POSSIBLE","CONFIRMED","ENGAGED"] as const).map(v => {
                      const cfg = CONTACT[v];
                      return <button key={v} onClick={() => setForm((f:any) => ({...f, enemy_contact: v}))}
                        className={`px-2 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.enemy_contact === v ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{v}</button>;
                    })}
                  </div>
                </div>
                {/* Casualties */}
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <p className="font-display font-bold text-xs uppercase tracking-widest">Own Casualties</p>
                  <div className="flex flex-wrap gap-1">
                    {(["NONE","MINOR","SIGNIFICANT","CRITICAL"] as const).map(v => (
                      <button key={v} onClick={() => setForm((f:any) => ({...f, friendly_casualties: v}))}
                        className={`px-2 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.friendly_casualties === v ? `bg-secondary/80 border-primary/50 ${CAS_COLOR[v]}` : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{v}</button>
                    ))}
                  </div>
                  {form.friendly_casualties !== "NONE" && (
                    <input value={form.casualty_notes} onChange={e => setForm((f:any) => ({...f, casualty_notes: e.target.value}))} placeholder="e.g. 5 up, 1 WIA walking" className="mf-input w-full text-xs" />
                  )}
                </div>
                {/* Mission */}
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <p className="font-display font-bold text-xs uppercase tracking-widest">Mission Status</p>
                  <div className="flex flex-wrap gap-1">
                    {(["ON TRACK","DELAYED","COMPROMISED","ABORT"] as const).map(v => {
                      const cfg = MISSION[v];
                      return <button key={v} onClick={() => setForm((f:any) => ({...f, mission_status: v}))}
                        className={`px-2 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.mission_status === v ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{v}</button>;
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-4 pt-0">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Transmit SITREP
              </button>
              <button onClick={() => { setShowForm(false); setForm({...emptyForm, report_time: dtgNow}); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Records */}
      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-sans">No SITREPs on record.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r:any) => {
            // Parse ABCDE from additional_info if stored as JSON
            let abcde: any = {};
            try { if (r.additional_info && r.additional_info.startsWith('{')) abcde = JSON.parse(r.additional_info); } catch {}
            const fieldA = abcde.a ?? r.report_time ?? "";
            const fieldB = abcde.b ?? r.position ?? "";
            const fieldC = abcde.c ?? "";
            const fieldD = abcde.d ?? r.activity ?? "";
            const fieldE = abcde.e ?? r.next_action ?? "";
            const ec = CONTACT[(r.enemy_contact ?? "NONE").toUpperCase()] ?? CONTACT["NONE"];
            const ms = MISSION[(r.mission_status ?? "ON TRACK").toUpperCase()] ?? MISSION["ON TRACK"];
            const isHot = (r.enemy_contact ?? "").toUpperCase() === "ENGAGED" || (r.mission_status ?? "").toUpperCase() === "ABORT";
            return (
              <div key={r.id} className={`border ${isHot ? "border-red-500/50" : "border-amber-500/30"} rounded-lg overflow-hidden bg-card`}>
                {/* Card header */}
                <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-display font-black text-sm uppercase tracking-widest">{r.callsign}</span>
                    {r.op_name && <span className="text-xs text-muted-foreground font-sans">/ {r.op_name}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">{r.report_time || ""}</span>
                    <span className="text-xs text-muted-foreground font-sans">{r.reported_by}</span>
                    <button onClick={async () => { if(!confirm("Delete?")) return; await apiFetch("/milsimSitrep?path=delete",{method:"POST",body:JSON.stringify({id:r.id})}); load(); }} className="text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* ABCDE table in record */}
                {[
                  { letter:"A", label:"When",          val: fieldA },
                  { letter:"B", label:"Where",          val: fieldB },
                  { letter:"C", label:"What is it",     val: fieldC },
                  { letter:"D", label:"What doing",     val: fieldD },
                  { letter:"E", label:"Own action",     val: fieldE },
                ].filter(row => row.val).map((row, i, arr) => (
                  <div key={row.letter} className={`flex ${i < arr.length - 1 ? "border-b border-amber-500/15" : ""}`}>
                    <div className="w-8 shrink-0 flex items-center justify-center bg-amber-500/10 border-r border-amber-500/20">
                      <span className="font-display font-black text-xs text-amber-400">{row.letter}</span>
                    </div>
                    <div className="w-28 shrink-0 flex items-center px-2 py-2 bg-amber-500/5 border-r border-amber-500/15">
                      <span className="font-display font-bold text-xs uppercase tracking-widest text-amber-300/70">{row.label}</span>
                    </div>
                    <div className="flex-1 px-3 py-2">
                      <p className="text-sm font-sans">{row.val}</p>
                    </div>
                  </div>
                ))}
                {/* Status strip */}
                {(r.enemy_contact !== "NONE" || r.mission_status !== "ON TRACK" || r.friendly_casualties !== "NONE") && (
                  <div className="grid grid-cols-3 text-xs border-t border-amber-500/20">
                    <div className={`p-2 border-r border-border ${ec.bg}`}>
                      <p className="text-muted-foreground font-display font-bold uppercase tracking-wider text-xs mb-0.5">Enemy</p>
                      <p className={`font-display font-black uppercase ${ec.color}`}>{r.enemy_contact ?? "NONE"}</p>
                    </div>
                    <div className={`p-2 border-r border-border ${ms.bg}`}>
                      <p className="text-muted-foreground font-display font-bold uppercase tracking-wider text-xs mb-0.5">Mission</p>
                      <p className={`font-display font-black uppercase ${ms.color}`}>{r.mission_status ?? "ON TRACK"}</p>
                    </div>
                    <div className="p-2">
                      <p className="text-muted-foreground font-display font-bold uppercase tracking-wider text-xs mb-0.5">Casualties</p>
                      <p className={`font-display font-black uppercase ${CAS_COLOR[(r.friendly_casualties ?? "NONE").toUpperCase()] ?? "text-green-400"}`}>{r.friendly_casualties ?? "NONE"}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── MEDEVAC Tab — NATO 9-Line Request ───────────────────────────────────────
   Exact fields from the 4IB 2 Signals Regiment MEDEVAC card:
   1 Callsign & Freq  2 HLS Grid  3 Patients/Precedence  4 Special Equipment
   5 Patient Type     6 HLS Security  7 HLS Marking  8 Nationality/Status  9 HLS Terrain
──────────────────────────────────────────────────────────────────────────── */
function MedevacTab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success" | "error") => void }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const dtgNow = `${String(now.getUTCDate()).padStart(2,'0')}${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}Z ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  const emptyForm = {
    callsign: "", unit: "", dtg: dtgNow, op_id: "", op_name: "",
    // Line 1
    l1_callsign_freq: "",
    // Line 2
    l2_hls_grid: "",
    // Line 3 — patients by precedence
    l3_p1: 0, l3_p2: 0, l3_p3: 0,
    // Line 4 — special equipment
    l4_equipment: "A" as "A"|"B"|"C"|"D"|"E",
    l4_other: "",
    // Line 5 — patient type
    l5_stretcher: 0, l5_walking: 0, l5_escort: 0, l5_other: "",
    // Line 6 — HLS security
    l6_security: "N" as "N"|"P"|"E"|"X",
    // Line 7 — HLS marking
    l7_marking: "C" as "A"|"B"|"C"|"D"|"E",
    l7_smoke_colour: "",
    // Line 8 — nationality/status (checkboxes)
    l8_a: 0, l8_b: 0, l8_c: 0, l8_d: 0, l8_e: 0, l8_f: 0, l8_g: 0, l8_h: 0,
    // Line 9
    l9_terrain: "",
  };
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [d, opsData, rosterData] = await Promise.all([
        apiFetch(`/milsimSitrep?path=medevac_list&group_id=${group.id}`),
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
        apiFetch(`/milsimGroups?path=mine/own`),
      ]);
      setRequests(d.medevacs ?? []);
      setOps((opsData.events ?? []).filter((o:any) => ["Active","Confirmed","Planned"].includes(o.status)));
      setRoster((rosterData.roster ?? []).filter((m:any) => m.status === "Active"));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [group.id]);

  const save = async () => {
    if (!form.callsign) { showMsg("Callsign required", "error"); return; }
    if (!form.l1_callsign_freq) { showMsg("Line 1 (Callsign & Freq) required", "error"); return; }
    if (!form.l2_hls_grid) { showMsg("Line 2 (HLS Grid) required", "error"); return; }
    setSaving(true);
    try {
      const payload: any = {
        group_id: group.id, reported_by: user?.username ?? "Unknown",
        callsign: form.callsign, report_time: form.dtg,
        op_id: form.op_id, op_name: form.op_name,
        // Store as structured JSON in additional_info
        additional_info: JSON.stringify({
          type: "MEDEVAC_9LINE",
          unit: form.unit, dtg: form.dtg,
          l1: form.l1_callsign_freq,
          l2: form.l2_hls_grid,
          l3: { p1: form.l3_p1, p2: form.l3_p2, p3: form.l3_p3 },
          l4: { code: form.l4_equipment, other: form.l4_other },
          l5: { s: form.l5_stretcher, w: form.l5_walking, e: form.l5_escort, o: form.l5_other },
          l6: form.l6_security,
          l7: { code: form.l7_marking, colour: form.l7_smoke_colour },
          l8: { a:form.l8_a, b:form.l8_b, c:form.l8_c, d:form.l8_d, e:form.l8_e, f:form.l8_f, g:form.l8_g, h:form.l8_h },
          l9: form.l9_terrain,
        }),
        // Summaries for list view
        position: form.l2_hls_grid,
        activity: `MEDEVAC — ${(form.l3_p1||0)+(form.l3_p2||0)+(form.l3_p3||0)} cas, P1:${form.l3_p1||0} P2:${form.l3_p2||0} P3:${form.l3_p3||0}`,
        enemy_contact: form.l6_security === "X" ? "CONFIRMED" : form.l6_security === "E" ? "POSSIBLE" : "NONE",
        friendly_casualties: ((form.l3_p1||0)+(form.l3_p2||0)+(form.l3_p3||0)) > 0 ? "SIGNIFICANT" : "NONE",
        mission_status: "ON TRACK",
      };
      if (payload.op_id) { const op = ops.find((o:any) => o.id === payload.op_id); if (op) payload.op_name = op.title ?? op.name ?? ""; }
      await apiFetch("/milsimSitrep?path=create", { method: "POST", body: JSON.stringify(payload) });
      showMsg("MEDEVAC 9-Line transmitted", "success"); setShowForm(false); setForm({...emptyForm, dtg: dtgNow}); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const L4_OPTS = [
    { code: "A", label: "A — NONE" },
    { code: "B", label: "B — HOIST" },
    { code: "C", label: "C — EXTRACTION EQUIP" },
    { code: "D", label: "D — VENTILATOR" },
    { code: "E", label: "E — OTHER" },
  ];
  const L6_OPTS = [
    { code: "N", label: "N — NO ENEMY",           color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40" },
    { code: "P", label: "P — POSSIBLE ENEMY",     color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/40" },
    { code: "E", label: "E — ENEMY IN AREA",      color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/40" },
    { code: "X", label: "X — ARMED ESCORT REQ'D", color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40" },
  ];
  const L7_OPTS = [
    { code: "A", label: "A — PANELS" },
    { code: "B", label: "B — PYRO" },
    { code: "C", label: "C — SMOKE (colour?)" },
    { code: "D", label: "D — NONE" },
    { code: "E", label: "E — OTHER" },
  ];
  const L8_CATS = [
    { code: "A", label: "A — UK / NATO Military" },
    { code: "B", label: "B — UK / NATO Civilian" },
    { code: "C", label: "C — Non-UK / NATO Military" },
    { code: "D", label: "D — Non-UK / NATO Civilian" },
    { code: "E", label: "E — Detainees / PW" },
    { code: "F", label: "F — Embedded Interpreter" },
    { code: "G", label: "G — Civ Cas caused by FF" },
    { code: "H", label: "H — Child" },
  ];

  // Row renderer for the pink table style
  const MRow = ({ lineNum, title, children, subrow }: { lineNum: number | string; title: string; children: React.ReactNode; subrow?: React.ReactNode }) => (
    <div className={`border-b border-pink-500/25 last:border-0`}>
      <div className="flex min-h-[3.25rem]">
        <div className="w-10 shrink-0 flex items-center justify-center bg-pink-500/10 border-r border-pink-500/25">
          <span className="font-display font-black text-sm text-pink-400">{lineNum}</span>
        </div>
        <div className="w-52 shrink-0 flex items-center px-3 py-2.5 bg-pink-500/5 border-r border-pink-500/20">
          <p className="font-display font-black text-xs uppercase tracking-widest text-pink-300">{title}</p>
        </div>
        <div className="flex-1 p-2.5 flex items-center">{children}</div>
      </div>
      {subrow && <div className="border-t border-pink-500/20 bg-secondary/20 px-4 py-2">{subrow}</div>}
    </div>
  );

  const NumInput = ({ field, label }: { field: string; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-muted-foreground font-display font-bold uppercase tracking-wider">{label}</p>
      <input type="number" min={0} max={99} value={form[field]} onChange={e => setForm((f:any) => ({...f, [field]: parseInt(e.target.value)||0}))} className="mf-input w-16 text-center font-mono font-bold" />
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg uppercase tracking-widest">MEDEVAC</h2>
            <span className="text-xs font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-pink-500/15 border border-pink-500/40 text-pink-400 rounded">NATO 9-Line</span>
          </div>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Medical Evacuation Request — 9-Line format. AUTHORITY: 4IB 2 Signals Regiment.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 border border-pink-500/40 text-pink-400 rounded font-display text-xs uppercase tracking-widest hover:bg-pink-500/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> File 9-Line
        </button>
      </div>

      {showForm && (
        <div className="border border-pink-500/50 rounded-lg overflow-hidden">
          {/* Header — pink to match real card */}
          <div className="bg-pink-500/20 border-b border-pink-500/40 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-display font-black text-sm uppercase tracking-widest text-pink-400">MEDEVAC — 9-LINE REQUEST</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">Complete all 9 lines before transmitting. Priority 1 = within 60 mins.</p>
            </div>
            <span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground border border-border px-2 py-1 rounded">URGENT</span>
          </div>
          <div className="bg-card">
            {/* Admin / header block */}
            <div className="p-4 border-b border-pink-500/20 grid grid-cols-2 md:grid-cols-4 gap-4">
              <MField label="DTG">
                <input value={form.dtg} onChange={e => setForm((f:any) => ({...f, dtg: e.target.value}))} placeholder={dtgNow} className="mf-input w-full font-mono text-xs" />
              </MField>
              <MField label="Reporting Callsign *">
                <select value={form.callsign} onChange={e => setForm((f:any) => ({...f, callsign: e.target.value}))} className="mf-input w-full">
                  <option value="">— Select callsign —</option>
                  {roster.map((m:any) => <option key={m.id} value={m.callsign}>{m.callsign}{m.rank_name ? ` (${m.rank_name})` : ""}</option>)}
                </select>
              </MField>
              <MField label="Unit Name">
                <input value={form.unit} onChange={e => setForm((f:any) => ({...f, unit: e.target.value}))} placeholder="e.g. 2 SECTION" className="mf-input w-full" />
              </MField>
              <MField label="Linked Op">
                <select value={form.op_id} onChange={e => setForm((f:any) => ({...f, op_id: e.target.value}))} className="mf-input w-full">
                  <option value="">— No op —</option>
                  {ops.map((o:any) => <option key={o.id} value={o.id}>{o.title ?? o.name}</option>)}
                </select>
              </MField>
            </div>

            {/* 9-Line table */}
            <div>
              {/* Line 1 */}
              <MRow lineNum={1} title="Callsign & Freq">
                <input value={form.l1_callsign_freq} onChange={e => setForm((f:any) => ({...f, l1_callsign_freq: e.target.value}))} placeholder="e.g. SUNRAY ACTUAL, Freq 46.50" className="mf-input w-full text-sm" />
              </MRow>

              {/* Line 2 */}
              <MRow lineNum={2} title="Location (Grid of HLS)">
                <input value={form.l2_hls_grid} onChange={e => setForm((f:any) => ({...f, l2_hls_grid: e.target.value}))} placeholder="8 or 10 digit grid of HLS" className="mf-input w-full text-sm font-mono" />
              </MRow>

              {/* Line 3 */}
              <MRow lineNum={3} title="No. of Patients / Precedence"
                subrow={
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-display font-bold uppercase tracking-wider">
                    <span className="text-red-400">P1 — within 60 mins</span>
                    <span className="text-orange-400">P2 — within 4 hrs</span>
                    <span className="text-yellow-400">P3 — within 24 hrs</span>
                  </div>
                }>
                <div className="flex gap-4 flex-wrap">
                  <NumInput field="l3_p1" label="P1 (Urgent)" />
                  <NumInput field="l3_p2" label="P2 (Priority)" />
                  <NumInput field="l3_p3" label="P3 (Routine)" />
                </div>
              </MRow>

              {/* Line 4 */}
              <MRow lineNum={4} title="Special Equipment Required"
                subrow={
                  <div className="flex flex-wrap gap-2">
                    {L4_OPTS.map(o => (
                      <button key={o.code} onClick={() => setForm((f:any) => ({...f, l4_equipment: o.code}))}
                        className={`px-2.5 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.l4_equipment === o.code ? "bg-pink-500/20 border-pink-500/50 text-pink-400" : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{o.label}</button>
                    ))}
                    {form.l4_equipment === "E" && <input value={form.l4_other} onChange={e => setForm((f:any) => ({...f, l4_other: e.target.value}))} placeholder="Specify other equipment..." className="mf-input text-xs" />}
                  </div>
                }>
                <span className={`font-display font-black text-sm text-pink-400`}>{L4_OPTS.find(o => o.code === form.l4_equipment)?.label ?? "—"}</span>
              </MRow>

              {/* Line 5 */}
              <MRow lineNum={5} title="No. of Patients / Type"
                subrow={
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-display font-bold uppercase tracking-wider">
                    <span>S — Stretcher</span><span>W — Walking</span><span>E — Escort</span><span>O — Other (specify)</span>
                  </div>
                }>
                <div className="flex gap-4 flex-wrap items-end">
                  <NumInput field="l5_stretcher" label="S (Stretcher)" />
                  <NumInput field="l5_walking" label="W (Walking)" />
                  <NumInput field="l5_escort" label="E (Escort)" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground font-display font-bold uppercase tracking-wider">O (Other)</p>
                    <input value={form.l5_other} onChange={e => setForm((f:any) => ({...f, l5_other: e.target.value}))} placeholder="Details..." className="mf-input w-32 text-xs" />
                  </div>
                </div>
              </MRow>

              {/* Line 6 */}
              <MRow lineNum={6} title="Security at HLS"
                subrow={
                  <div className="flex flex-wrap gap-2">
                    {L6_OPTS.map(o => (
                      <button key={o.code} onClick={() => setForm((f:any) => ({...f, l6_security: o.code}))}
                        className={`px-2.5 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.l6_security === o.code ? `${o.bg} ${o.border} ${o.color}` : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{o.label}</button>
                    ))}
                  </div>
                }>
                {(() => { const o = L6_OPTS.find(x => x.code === form.l6_security); return o ? <span className={`font-display font-black text-sm ${o.color}`}>{o.label}</span> : null; })()}
              </MRow>

              {/* Line 7 */}
              <MRow lineNum={7} title="HLS Marking Method"
                subrow={
                  <div className="flex flex-wrap gap-2 items-center">
                    {L7_OPTS.map(o => (
                      <button key={o.code} onClick={() => setForm((f:any) => ({...f, l7_marking: o.code}))}
                        className={`px-2.5 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.l7_marking === o.code ? "bg-pink-500/20 border-pink-500/50 text-pink-400" : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{o.label}</button>
                    ))}
                    {form.l7_marking === "C" && <input defaultValue={form.l7_smoke_colour} onBlur={e => setForm((f:any) => ({...f, l7_smoke_colour: e.target.value}))} onKeyDown={e => { if(e.key==="Enter") e.currentTarget.blur(); }} placeholder="Smoke colour..." className="mf-input text-xs w-36" key={`smoke-${form.l7_marking}`} />}
                  </div>
                }>
                <span className="font-display font-black text-sm text-pink-400">{L7_OPTS.find(o => o.code === form.l7_marking)?.label ?? "—"}{form.l7_smoke_colour && ` — ${form.l7_smoke_colour}`}</span>
              </MRow>

              {/* Line 8 */}
              <MRow lineNum={8} title="Patients by Nationality / Status"
                subrow={
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {L8_CATS.map(cat => (
                      <div key={cat.code} className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground font-display font-bold uppercase tracking-wider w-4">{cat.code}</p>
                        <input type="number" min={0} max={99} value={form[`l8_${cat.code.toLowerCase()}`]} onChange={e => setForm((f:any) => ({...f, [`l8_${cat.code.toLowerCase()}`]: parseInt(e.target.value)||0}))} className="mf-input w-14 text-center font-mono text-xs font-bold" />
                        <p className="text-xs text-muted-foreground font-sans">{cat.label.slice(4)}</p>
                      </div>
                    ))}
                  </div>
                }>
                <div className="flex gap-3 flex-wrap text-xs font-mono font-bold">
                  {L8_CATS.map(cat => form[`l8_${cat.code.toLowerCase()}`] > 0 ? <span key={cat.code} className="text-pink-400">{cat.code}: {form[`l8_${cat.code.toLowerCase()}`]}</span> : null)}
                </div>
              </MRow>

              {/* Line 9 */}
              <MRow lineNum={9} title="HLS Terrain / Obstacles">
                <input value={form.l9_terrain} onChange={e => setForm((f:any) => ({...f, l9_terrain: e.target.value}))} placeholder="e.g. Flat open ground, power lines to north, soft soil, no obstacles" className="mf-input w-full text-sm" />
              </MRow>
            </div>

            <div className="flex gap-2 p-4 border-t border-pink-500/20">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-pink-500/80 hover:bg-pink-500 text-white rounded font-display text-xs uppercase tracking-widest transition-colors">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Transmit 9-Line
              </button>
              <button onClick={() => { setShowForm(false); setForm({...emptyForm, dtg: dtgNow}); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Records */}
      {requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-sans">No MEDEVAC requests on record.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r:any) => {
            let d: any = {};
            try { if (r.additional_info) d = JSON.parse(r.additional_info); } catch {}
            if (d.type !== "MEDEVAC_9LINE") return null;
            const totalCas = (d.l3?.p1||0) + (d.l3?.p2||0) + (d.l3?.p3||0);
            const secCfg = L6_OPTS.find(o => o.code === d.l6) ?? L6_OPTS[0];
            return (
              <div key={r.id} className="border border-pink-500/40 rounded-lg overflow-hidden bg-card">
                <div className="bg-pink-500/10 border-b border-pink-500/25 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-display font-black text-pink-400 border border-pink-500/40 px-2 py-0.5 rounded">MEDEVAC</span>
                    <span className="font-display font-black text-sm uppercase tracking-widest">{r.callsign}</span>
                    {r.op_name && <span className="text-xs text-muted-foreground font-sans">/ {r.op_name}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">{r.report_time || ""}</span>
                    <span className={`font-display font-black text-xs uppercase ${(d.l3?.p1||0) > 0 ? "text-red-400" : (d.l3?.p2||0) > 0 ? "text-orange-400" : "text-yellow-400"}`}>{totalCas} CASUALTIES</span>
                    <button onClick={async () => { if(!confirm("Delete?")) return; await apiFetch("/milsimSitrep?path=delete",{method:"POST",body:JSON.stringify({id:r.id})}); load(); }} className="text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* Summary grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 text-xs">
                  <div className="p-3 border-r border-border">
                    <p className="text-muted-foreground font-display font-bold uppercase tracking-wider mb-1">HLS Grid</p>
                    <p className="font-mono font-bold">{d.l2 || "—"}</p>
                  </div>
                  <div className="p-3 border-r border-border">
                    <p className="text-muted-foreground font-display font-bold uppercase tracking-wider mb-1">Casualties</p>
                    <p className="font-display font-bold">
                      {(d.l3?.p1||0) > 0 && <span className="text-red-400 mr-1.5">P1:{d.l3.p1}</span>}
                      {(d.l3?.p2||0) > 0 && <span className="text-orange-400 mr-1.5">P2:{d.l3.p2}</span>}
                      {(d.l3?.p3||0) > 0 && <span className="text-yellow-400">P3:{d.l3.p3}</span>}
                      {totalCas === 0 && "—"}
                    </p>
                  </div>
                  <div className={`p-3 border-r border-border ${secCfg.bg}`}>
                    <p className="text-muted-foreground font-display font-bold uppercase tracking-wider mb-1">HLS Security</p>
                    <p className={`font-display font-bold uppercase ${secCfg.color}`}>{secCfg.label}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-muted-foreground font-display font-bold uppercase tracking-wider mb-1">Marking</p>
                    <p className="font-display font-bold">{L7_OPTS.find(o => o.code === d.l7?.code)?.label ?? "—"}{d.l7?.colour && ` — ${d.l7.colour}`}</p>
                  </div>
                </div>
                {(d.l9 || d.l1) && (
                  <div className="px-3 pb-2 text-xs border-t border-border">
                    {d.l1 && <p className="text-muted-foreground font-sans mt-1.5"><span className="font-display font-bold text-foreground">Line 1: </span>{d.l1}</p>}
                    {d.l9 && <p className="text-muted-foreground font-sans mt-0.5"><span className="font-display font-bold text-foreground">Terrain: </span>{d.l9}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function ConductReportTab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success" | "error") => void }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const dtgNow = `${String(now.getUTCDate()).padStart(2,'0')}${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}Z ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  const emptyForm = {
    subject_callsign: "", report_date: dtgNow, filed_by_rank: "",
    op_id: "", op_name: "",
    category: "Conduct", severity: "Minor",
    description: "", evidence: "",
    outcome: "No Action", outcome_notes: "", reviewed_by: "",
  };
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [d, opsData, rosterData] = await Promise.all([
        apiFetch(`/milsimConductReport?path=list&group_id=${group.id}`),
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
        apiFetch(`/milsimGroups?path=mine/own`),
      ]);
      setReports(d.reports ?? []);
      setOps((opsData.events ?? []).filter((o: any) => ["Active","Confirmed","Planned","Completed"].includes(o.status)));
      setRoster((rosterData.roster ?? []).filter((m:any) => m.status === "Active"));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [group.id]);

  const save = async () => {
    if (!form.subject_callsign) { showMsg("Subject callsign required", "error"); return; }
    if (!form.description) { showMsg("Description of incident required", "error"); return; }
    setSaving(true);
    try {
      const crPayload: any = { ...form, group_id: group.id, filed_by: (form.filed_by_rank ? form.filed_by_rank + " " : "") + (user?.username ?? "Unknown") };
      if (crPayload.op_id) { const op = ops.find((o:any) => o.id === crPayload.op_id); if (op) crPayload.op_name = op.title ?? op.name ?? ""; }
      await apiFetch("/milsimConductReport?path=create", { method: "POST", body: JSON.stringify(crPayload) });
      showMsg("Admin report filed", "success"); setShowForm(false); setForm({...emptyForm, report_date: dtgNow}); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const SEV: Record<string, { color: string; bg: string; border: string }> = {
    Info:     { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
    Minor:    { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    Major:    { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    Critical: { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
  };
  const CAT_COLOR: Record<string, string> = {
    Absence:"text-yellow-400", Conduct:"text-orange-400", Insubordination:"text-red-400",
    Negligence:"text-orange-400", Commendation:"text-green-400", Admin:"text-muted-foreground",
  };
  const OUTCOME_COLOR: Record<string, string> = {
    "No Action":"text-muted-foreground", "Verbal Warning":"text-yellow-400", "Written Warning":"text-orange-400",
    "Strike":"text-red-400", "Demotion":"text-red-400", "Removal":"text-red-500", "Commendation":"text-green-400",
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg uppercase tracking-widest">Admin / Conduct Reports</h2>
            <span className="text-xs font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded">Military Admin</span>
          </div>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Disciplinary notices, commendations, absences, admin actions. Filed by chain of command.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> File Report
        </button>
      </div>

      {showForm && (
        <div className="border border-primary/40 rounded-lg overflow-hidden">
          <div className="bg-primary/15 border-b border-primary/30 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-display font-black text-sm uppercase tracking-widest text-primary">ADMIN / CONDUCT REPORT</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">To be raised by chain of command only. Filed reports are permanent record.</p>
            </div>
            <span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground border border-border px-2 py-1 rounded">RESTRICTED</span>
          </div>
          <div className="p-5 space-y-5 bg-card">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-border">
              <MField label="DTG (Date-Time Group)">
                <input value={form.report_date} onChange={e => setForm((f:any) => ({...f, report_date: e.target.value}))} placeholder={dtgNow} className="mf-input w-full font-mono text-xs" />
              </MField>
              <MField label="Subject (Individual) *">
                <select value={form.subject_callsign} onChange={e => setForm((f:any) => ({...f, subject_callsign: e.target.value}))} className="mf-input w-full">
                  <option value="">— Select soldier —</option>
                  {roster.map((m:any) => <option key={m.id} value={m.callsign}>{m.callsign}{m.rank_name ? ` (${m.rank_name})` : ""}</option>)}
                </select>
              </MField>
              <MField label="Reviewing Authority (Commander / NCO)">
                <select value={form.reviewed_by} onChange={e => setForm((f:any) => ({...f, reviewed_by: e.target.value}))} className="mf-input w-full">
                  <option value="">— Select authority —</option>
                  {roster.map((m:any) => <option key={m.id} value={m.callsign}>{m.callsign}{m.rank_name ? ` (${m.rank_name})` : ""}</option>)}
                </select>
              </MField>
            </div>

            {/* Linked Op */}
            <MField label="Linked Op (Optional)">
              <select value={form.op_id} onChange={e => setForm((f:any) => ({...f, op_id: e.target.value}))} className="mf-input w-full">
                <option value="">— No op —</option>
                {ops.map((o:any) => <option key={o.id} value={o.id}>{o.title ?? o.name}</option>)}
              </select>
            </MField>

            {/* Category + Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-3 space-y-2">
                <p className="font-display font-bold text-xs uppercase tracking-widest">Report Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["Absence","Conduct","Insubordination","Negligence","Commendation","Admin"] as const).map(cat => (
                    <button key={cat} onClick={() => setForm((f:any) => ({...f, category: cat}))}
                      className={`px-2.5 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.category === cat ? `bg-secondary/80 border-primary/50 ${CAT_COLOR[cat]}` : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 space-y-2">
                <p className="font-display font-bold text-xs uppercase tracking-widest">Severity</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(["Info","Minor","Major","Critical"] as const).map(sev => {
                    const cfg = SEV[sev];
                    return <button key={sev} onClick={() => setForm((f:any) => ({...f, severity: sev}))}
                      className={`px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.severity === sev ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{sev}</button>;
                  })}
                </div>
              </div>
            </div>

            {/* Incident detail */}
            <MField label="Description of Incident / Conduct *">
              <textarea value={form.description} onChange={e => setForm((f:any) => ({...f, description: e.target.value}))} rows={4} placeholder="Detailed account of the incident, conduct, absence, or commendation..." className="mf-input w-full resize-none" />
            </MField>
            <MField label="Evidence / Supporting References">
              <textarea value={form.evidence} onChange={e => setForm((f:any) => ({...f, evidence: e.target.value}))} rows={2} placeholder="Witness callsigns, timestamps, screenshots, prior reports..." className="mf-input w-full resize-none" />
            </MField>

            {/* Outcome */}
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="font-display font-bold text-xs uppercase tracking-widest">Outcome / Action Taken</p>
              <div className="flex flex-wrap gap-1.5">
                {(["No Action","Verbal Warning","Written Warning","Strike","Demotion","Removal","Commendation"] as const).map(o => (
                  <button key={o} onClick={() => setForm((f:any) => ({...f, outcome: o}))}
                    className={`px-2.5 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${form.outcome === o ? `bg-secondary/80 border-primary/50 ${OUTCOME_COLOR[o]}` : "border-border text-muted-foreground hover:bg-secondary/60"}`}>{o}</button>
                ))}
              </div>
            </div>
            <MField label="Outcome Notes / Instructions">
              <textarea value={form.outcome_notes} onChange={e => setForm((f:any) => ({...f, outcome_notes: e.target.value}))} rows={2} placeholder="Terms of warning, demotion details, commendation citation..." className="mf-input w-full resize-none" />
            </MField>

            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} File Report
              </button>
              <button onClick={() => { setShowForm(false); setForm({...emptyForm, report_date: dtgNow}); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg"><UserMinus2 className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-sans">No admin or conduct reports on record.</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map((r:any) => {
            const sev = SEV[r.severity] ?? SEV["Minor"];
            const isComm = r.category === "Commendation";
            return (
              <div key={r.id} className={`border ${isComm ? "border-green-500/30" : sev.border} rounded-lg overflow-hidden bg-card`}>
                <div className={`border-b border-border px-4 py-2 flex items-center justify-between flex-wrap gap-2 ${isComm ? "bg-green-500/5" : "bg-secondary/30"}`}>
                  <div className="flex items-center gap-3">
                    <UserMinus2 className={`w-4 h-4 shrink-0 ${isComm ? "text-green-400" : "text-primary"}`} />
                    <span className="font-display font-black text-sm uppercase tracking-widest">{r.subject_callsign}</span>
                    {r.op_name && <span className="text-xs text-muted-foreground font-sans">/ {r.op_name}</span>}
                    <span className={`text-xs font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${sev.bg} ${sev.border} ${sev.color}`}>{r.severity}</span>
                    <span className={`text-xs font-display font-bold uppercase tracking-widest ${CAT_COLOR[r.category] ?? "text-muted-foreground"}`}>{r.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-display font-bold uppercase tracking-widest ${OUTCOME_COLOR[r.outcome] ?? "text-muted-foreground"}`}>{r.outcome}</span>
                    <span className="text-xs text-muted-foreground font-mono">{r.report_date || ""}</span>
                    <span className="text-xs text-muted-foreground font-sans">{r.filed_by}</span>
                    <button onClick={async () => { if(!confirm("Delete?")) return; await apiFetch("/milsimConductReport?path=delete",{method:"POST",body:JSON.stringify({id:r.id})}); load(); }} className="text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-sans">{r.description}</p>
                  {r.evidence && <p className="text-xs text-muted-foreground font-sans border-t border-border pt-2"><span className="font-display font-bold uppercase tracking-wider text-foreground">Evidence: </span>{r.evidence}</p>}
                  {r.outcome_notes && <p className="text-xs text-muted-foreground font-sans"><span className="font-display font-bold uppercase tracking-wider text-foreground">Action: </span>{r.outcome_notes}</p>}
                  {r.reviewed_by && <p className="text-xs text-muted-foreground font-sans text-right">Reviewed by: <span className="text-foreground font-bold">{r.reviewed_by}</span></p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function BriefingsTab({ group, showMsg }: any) {
  const [briefings, setBriefings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const emptyForm = { title: "", op_date: "", op_id: "", ao: "", objectives: "", comms_plan: "", roe: "", additional_notes: "", status: "draft" };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const load = () => { apiFetch<any[]>(`/api/milsim-groups/${group.id}/briefings`).then(setBriefings).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [group.id]);
  const [ops, setOps] = useState<any[]>([]);
  useEffect(() => {
    apiFetch<any>(`/api/milsim-groups/${group.id}/ops`).then((d: any) => setOps((Array.isArray(d) ? d : (d?.events ?? [])).filter((o:any) => ["Active","Confirmed","Planned","Completed"].includes(o.status)))).catch(() => {});
  }, [group.id]);

  const submit = async () => {
    if (!form.title.trim()) return; setSaving(true);
    try {
      if (editId) { await apiFetch(`/api/milsim-groups/${group.id}/briefings/${editId}`, { method: "PATCH", body: JSON.stringify(form) }); showMsg(true, "Briefing updated."); }
      else { await apiFetch(`/api/milsim-groups/${group.id}/briefings`, { method: "POST", body: JSON.stringify(form) }); showMsg(true, "Briefing created."); }
      setCreating(false); setEditId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(false, e.message); } finally { setSaving(false); }
  };
  const remove = async (id: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/briefings/${id}`, { method: "DELETE" }); showMsg(true, "Deleted."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  const SC: Record<string, string> = { draft: "text-muted-foreground bg-secondary border-border", published: "text-primary bg-primary/10 border-primary/30", archived: "text-muted-foreground bg-secondary/40 border-border" };
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  const setF = (k: string) => (e: any) => setForm((f: any) => ({...f, [k]: e.target.value}));
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">Op briefings — distributed to members before an operation.</p>
        {!creating && !editId && <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-all"><Plus className="w-3.5 h-3.5" /> New Briefing</button>}
      </div>
      {(creating || editId !== null) && (
        <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-4">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm">{editId ? "Edit Briefing" : "New Briefing"}</h3>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Title *</label><input value={form.title} onChange={setF("title")} className="mf-input" placeholder="Operation Iron Fist — OPORD" /></div><div><label className="mf-label">Op Date / Time</label><input type="datetime-local" value={form.op_date} onChange={setF("op_date")} className="mf-input" /></div></div>
          <div><label className="mf-label">Linked Op</label><select value={form.op_id ?? ""} onChange={setF("op_id")} className="mf-input"><option value="">— No op —</option>{ops.map((o:any) => <option key={o.id} value={o.id}>{o.title ?? o.name}</option>)}</select></div>
          <div><label className="mf-label">Status</label><select value={form.status} onChange={setF("status")} className="mf-input"><option value="draft">Draft</option><option value="published">Published (visible to all members)</option><option value="archived">Archived</option></select></div>
          <div><label className="mf-label">Area of Operations (AO)</label><input value={form.ao} onChange={setF("ao")} className="mf-input" placeholder="Grid reference, map name..." /></div>
          <div><label className="mf-label">Objectives</label><textarea rows={4} value={form.objectives} onChange={setF("objectives")} className="mf-input resize-none" placeholder="1. Secure FOB Alpha&#10;2. Eliminate HVT Bravo..." /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Comms Plan</label><textarea rows={3} value={form.comms_plan} onChange={setF("comms_plan")} className="mf-input resize-none" placeholder="Primary: CH1&#10;Secondary: CH2..." /></div><div><label className="mf-label">ROE</label><textarea rows={3} value={form.roe} onChange={setF("roe")} className="mf-input resize-none" placeholder="Weapons free in AO..." /></div></div>
          <div><label className="mf-label">Additional Notes</label><textarea rows={3} value={form.additional_notes} onChange={setF("additional_notes")} className="mf-input resize-none" /></div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving || !form.title.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editId ? "Update" : "Create"}</button>
            <button onClick={() => { setCreating(false); setEditId(null); setForm(emptyForm); }} className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
      {briefings.length === 0 && !creating ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground"><MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No briefings created</p></div>
      ) : (
        <div className="space-y-3">
          {briefings.map((b: any) => (
            <div key={b.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
                <div className="flex items-center gap-3 flex-wrap"><span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${SC[b.status] ?? ""}`}>{b.status}</span><span className="font-display font-bold text-sm text-foreground">{b.title}</span>{b.op_date && <span className="text-xs text-muted-foreground">{format(new Date(b.op_date), "MMM dd, yyyy HH:mm")}</span>}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditId(b.id); setForm({ title: b.title, op_date: b.op_date ? b.op_date.slice(0,16) : "", ao: b.ao ?? "", objectives: b.objectives ?? "", comms_plan: b.comms_plan ?? "", roe: b.roe ?? "", additional_notes: b.additional_notes ?? "", status: b.status }); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); remove(b.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  {expandedId === b.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedId === b.id && (
                <div className="border-t border-border p-5 space-y-4 bg-secondary/10">
                  {b.ao && <AARField label="Area of Operations" value={b.ao} />}
                  {b.objectives && <AARField label="Objectives" value={b.objectives} />}
                  {b.comms_plan && <AARField label="Comms Plan" value={b.comms_plan} />}
                  {b.roe && <AARField label="ROE" value={b.roe} />}
                  {b.additional_notes && <AARField label="Additional Notes" value={b.additional_notes} />}
                  <p className="text-xs text-muted-foreground font-sans">By {b.created_by} · {formatDistanceToNow(new Date(b.created_date ?? b.created_at ?? Date.now()), { addSuffix: true })}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Org Chart ────────────────────────────────────────────────────────────────
function OrgChartTab({ group }: any) {
  const rankById = Object.fromEntries((group.ranks as Rank[]).map((r: Rank) => [r.id, r]));
  const roleById = Object.fromEntries((group.roles as Role[]).map((r: Role) => [r.id, r]));
  const sorted = [...(group.roster as RosterEntry[])].sort((a, b) => {
    const ra = a.rankId ? (rankById[a.rankId]?.tier ?? 0) : 0;
    const rb = b.rankId ? (rankById[b.rankId]?.tier ?? 0) : 0;
    return rb - ra;
  });
  const byTier = sorted.reduce<Record<number, RosterEntry[]>>((acc, entry) => {
    const tier = entry.rankId ? (rankById[entry.rankId]?.tier ?? -1) : -1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(entry);
    return acc;
  }, {});
  const tiers = Object.keys(byTier).map(Number).sort((a, b) => b - a);
  if (sorted.length === 0) return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground"><GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">Roster is empty</p></div>
  );
  return (
    <div className="max-w-4xl space-y-6">
      <p className="text-xs text-muted-foreground font-sans">Chain of command — organized by rank tier (highest first).</p>
      <div className="space-y-6">
        {tiers.map(tier => (
          <div key={tier} className="space-y-2">
            <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">{tier >= 0 ? `Tier ${tier} — ${rankById[byTier[tier][0]?.rankId ?? -1]?.name ?? ""}` : "No Rank"}</p>
            <div className="flex flex-wrap gap-3">
              {byTier[tier].map(entry => (
                <div key={entry.id} className="bg-card border border-border rounded-lg px-4 py-3 min-w-[120px] text-center">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-2"><span className="text-primary font-display font-black text-sm">{entry.callsign.charAt(0)}</span></div>
                  <p className="font-display font-bold uppercase tracking-widest text-xs text-foreground">{entry.callsign}</p>
                  {entry.rankId && <p className="text-xs text-primary mt-0.5">{rankById[entry.rankId]?.abbreviation ?? rankById[entry.rankId]?.name}</p>}
                  {entry.roleId && <p className="text-xs text-muted-foreground">{roleById[entry.roleId]?.name}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Readiness ────────────────────────────────────────────────────────────────
function ReadinessTab({ group }: any) {
  const [readiness, setReadiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<any>(`/api/stats/readiness/${group.id}`)
      .then(data => { setReadiness(data); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [group.id]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !readiness) return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
      <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-display text-sm uppercase tracking-widest">Readiness data unavailable</p>
      <p className="text-xs mt-2">Add roster members and log operations to generate readiness data.</p>
    </div>
  );

  const sc = readiness.status === "green" ? "text-green-400" : readiness.status === "amber" ? "text-yellow-400" : "text-red-400";
  const bc = readiness.status === "green" ? "bg-green-500" : readiness.status === "amber" ? "bg-yellow-500" : "bg-red-500";

  const TIER_META: Record<string, { label: string; colour: string; bg: string; border: string; badge: string; desc: string }> = {
    "SOF":         { label: "Special Operations Forces",               colour: "text-purple-400",    bg: "bg-purple-600/10",   border: "border-purple-500/40",   badge: "bg-purple-600/20 text-purple-300 border-purple-500/40",    desc: "The highest attainable designation. Elite multi-domain doctrine, near-perfect AAR discipline, and an exceptional operational record. This unit operates at the tip of the spear." },
    "SOC":         { label: "Special Operations Capable",               colour: "text-blue-400",       bg: "bg-blue-500/10",     border: "border-blue-400/40",     badge: "bg-blue-500/20 text-blue-300 border-blue-400/50",          desc: "Extensive op record, elite AAR discipline, and comprehensive multi-type training doctrine. Operates at special operations capable standard." },
    "STRATEGIC":   { label: "Strategically Capable",                   colour: "text-green-400",     bg: "bg-green-500/10",    border: "border-green-500/40",    badge: "bg-green-500/20 text-green-300 border-green-400/50",       desc: "Proven unit with strong operational output, solid reputation, and well-documented training resources across multiple doctrine types." },
    "OPERATIONAL": { label: "Operationally Capable",                   colour: "text-emerald-400",   bg: "bg-emerald-600/10",  border: "border-emerald-600/40",  badge: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40", desc: "Active unit with a consistent operational record and growing doctrine framework. Capable of executing standard mission types." },
    "TACTICAL":    { label: "Tactically Capable",                      colour: "text-yellow-400",    bg: "bg-yellow-400/10",   border: "border-yellow-400/40",   badge: "bg-yellow-400/20 text-yellow-300 border-yellow-400/50",    desc: "Building op history and operator experience. Some training doctrine in place. Unit is progressing toward operational readiness." },
    "LIMITED":     { label: "Limited Capability",                      colour: "text-amber-400",     bg: "bg-amber-500/10",    border: "border-amber-500/40",    badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",       desc: "Minimal operational record and insufficient training documentation to meet baseline capability standards." },
    "POOR":        { label: "Poor Capability",                         colour: "text-red-400",       bg: "bg-red-500/10",      border: "border-red-500/40",      badge: "bg-red-500/20 text-red-400 border-red-500/40",             desc: "No established operational record, no doctrine, and no verified activity. Unit has not demonstrated any measurable capability." },
  };

  const tier = readiness.op_capability_tier ?? "POOR";
  const tm = TIER_META[tier] ?? TIER_META["POOR"];

  // Score breakdown for transparency
  const sb = readiness.score_breakdown ?? {};
  const scoreBreakdown = [
    { label: "Manpower",            max: 20, earned: sb.manpower ?? 0,         note: `${readiness.verified_total ?? readiness.total} verified members` },
    { label: "Member Activity",     max: 15, earned: sb.activity ?? 0,         note: `${readiness.active_this_month}/${readiness.total} active (30d)` },
    { label: "Operations History",  max: 20, earned: sb.ops_history ?? 0,      note: `${readiness.valid_ops ?? readiness.total_ops ?? 0} verified ops` },
    { label: "Op Recency",          max: 10, earned: sb.op_recency ?? 0,       note: readiness.days_since_last_op != null ? `Last op ${readiness.days_since_last_op}d ago` : "No ops" },
    { label: "AAR Discipline",      max: 10, earned: sb.aar_discipline ?? 0,   note: `${readiness.completed_ops ?? 0} AARs for ${readiness.valid_ops ?? readiness.total_ops ?? 0} ops` },
    { label: "Training Doctrine",   max: 15, earned: sb.training_doctrine ?? 0,note: `Knowledge factor ${readiness.training?.knowledge_factor ?? 0}/100` },
    { label: "Discord Linked",      max: 5,  earned: sb.discord ?? 0,          note: readiness.has_discord ? "Linked" : "Not linked" },
    { label: "Page Maintenance",    max: 5,  earned: sb.page_maintenance ?? 0, note: readiness.days_since_page_update != null ? `Updated ${readiness.days_since_page_update}d ago` : "Never updated" },
    { label: "Reputation / Reviews",max: 5,  earned: sb.reputation ?? 0,       note: `${readiness.review_count} review${readiness.review_count !== 1 ? "s" : ""}, avg ${readiness.avg_rep_score || "—"}` },
  ];

  return (
    <div className="max-w-2xl space-y-5">

      {/* ── Readiness header ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display font-bold uppercase tracking-widest">Unit Readiness</h3>
          <div className="flex items-center gap-3">
            <span className={`font-display font-black text-xl uppercase ${sc}`}>{readiness.status.toUpperCase()}</span>
            <span className={`text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${tm.badge}`}>
              ⊕ {tier}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
            <span>Composite Readiness Score</span><span>{readiness.readiness_pct} / 100</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${bc}`} style={{ width: `${readiness.readiness_pct}%` }} />
          </div>
          <p className={`text-right text-xs font-display font-bold ${sc}`}>{readiness.readiness_pct}% COMPOSITE</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border text-center">
          {[
            { label: "Total", value: readiness.total, col: "" },
            { label: "Active 7d", value: readiness.active_this_week, col: "text-green-400" },
            { label: "Active 30d", value: readiness.active_this_month, col: "text-blue-400" },
            { label: "Ops Logged", value: readiness.total_ops ?? 0, col: "text-primary" },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-xl font-display font-bold ${s.col || "text-foreground"}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Readiness Flags ───────────────────────────────────────────────── */}
      {readiness.flags && readiness.flags.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Readiness Flags</p>
          {readiness.flags.map((flag: any) => (
            <div key={flag.code} className={`rounded-lg border px-4 py-3 flex gap-3 ${
              flag.severity === "red" ? "border-red-500/40 bg-red-500/5" : "border-yellow-500/30 bg-yellow-500/5"
            }`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${flag.severity === "red" ? "bg-red-500" : "bg-yellow-400"}`} />
              <div>
                <p className={`font-display font-bold uppercase tracking-widest text-xs ${flag.severity === "red" ? "text-red-400" : "text-yellow-400"}`}>
                  {flag.label}
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5 leading-relaxed">{flag.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Score Breakdown ───────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Score Breakdown — How Your {readiness.readiness_pct}pts Were Calculated</p>
        <div className="space-y-2">
          {scoreBreakdown.map(row => (
            <div key={row.label} className="flex items-center gap-3 text-xs">
              <span className="w-40 shrink-0 font-display font-bold uppercase tracking-widest text-muted-foreground text-[10px]">{row.label}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (row.earned / row.max) * 100)}%`,
                    background: row.earned === 0 ? '#ef4444' : row.earned >= row.max * 0.75 ? '#22c55e' : row.earned >= row.max * 0.4 ? '#eab308' : '#f97316' }} />
              </div>
              <span className="text-[10px] font-display shrink-0 w-14 text-right" style={{ color: row.earned === 0 ? '#ef4444' : row.earned >= row.max * 0.75 ? '#22c55e' : row.earned >= row.max * 0.4 ? '#eab308' : '#f97316' }}>{row.earned}/{row.max}</span>
              <span className="text-[10px] text-muted-foreground font-sans shrink-0 hidden sm:block">{row.note}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground font-sans pt-1 border-t border-border/50">
          Max score = 100pts. Green ≥75 · Amber 45–74 · Red &lt;45. Units below squad strength (9 members) are forced Red regardless of score.
        </p>
      </div>

      {/* ── Operational Capability Tier ───────────────────────────────────── */}
      <div className={`rounded-lg border p-5 space-y-3 ${tm.bg} ${tm.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Operational Capability Tier</p>
          <span className={`text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${tm.badge}`}>
            ⊕ {tier} — {tm.label}
          </span>
        </div>
        <p className={`text-sm font-sans leading-relaxed ${tm.colour}`}>{tm.desc}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            <span>Op Capability Score</span><span>{readiness.op_cap_score ?? 0} / 100</span>
          </div>
          <div className="h-2 bg-secondary/60 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${tm.badge.includes("blue") ? "bg-blue-500" : tm.badge.includes("yellow") ? "bg-yellow-400" : tm.badge.includes("slate") ? "bg-slate-400" : tm.badge.includes("orange") ? "bg-orange-500" : "bg-muted-foreground"}`}
              style={{ width: `${Math.min(100, readiness.op_cap_score ?? 0)}%` }} />
          </div>
        </div>
        {/* Tier ladder */}
        <div className="grid grid-cols-5 gap-1 pt-2 border-t border-border/40">
          {(["POOR","LIMITED","TACTICAL","OPERATIONAL","STRATEGIC","SOC","SOF"] as const).map(t => {
            const m = TIER_META[t];
            const active = t === tier;
            return (
              <div key={t} className={`rounded p-1.5 text-center transition-all ${active ? `${m.bg} ${m.border} border` : "opacity-30"}`}>
                <p className={`text-[9px] font-display font-bold uppercase tracking-widest ${active ? m.colour : "text-muted-foreground"}`}>{t}</p>
                <p className={`text-[8px] font-sans mt-0.5 ${active ? m.colour : "text-muted-foreground"} hidden sm:block`}>{m.label}</p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground font-sans">
          Tier is calculated from: ops logged (30pts) · troop experience (25pts) · roster size (15pts) · AAR culture (10pts) · training doctrine (20pts).
          <br/>Blue = Platinum (Tier I) · Gold (Tier II) · Silver (Tier III) · Bronze (Tier IV) · Forming.
        </p>
      </div>

      {/* ── Rep stats ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Rep Score</p>
          <p className="text-2xl font-display font-bold text-foreground">{readiness.avg_rep_score || "—"}</p>
          <p className="text-[10px] text-muted-foreground">{readiness.review_count} review{readiness.review_count !== 1 ? "s" : ""}</p>
        </div>
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Experience</p>
          <p className="text-2xl font-display font-bold text-foreground">{readiness.avg_experience > 0 ? `${readiness.avg_experience}/10` : "—"}</p>
          <p className="text-[10px] text-muted-foreground">from troop ratings</p>
        </div>
      </div>

      {/* ── Training Knowledge Assessment ─────────────────────────────────── */}
      {readiness.training && readiness.training.knowledge_grade !== 'none' && (
        <div className={`border rounded-lg p-5 space-y-2 ${
          readiness.training.knowledge_grade === 'expert'     ? 'border-blue-400/40 bg-blue-400/5' :
          readiness.training.knowledge_grade === 'proficient' ? 'border-yellow-500/40 bg-yellow-500/5' :
          readiness.training.knowledge_grade === 'developing' ? 'border-slate-400/40 bg-slate-400/5' :
          'border-orange-500/30 bg-orange-500/5'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-display font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Brain className="w-4 h-4" /> Training Knowledge
            </span>
            <span className={`text-xs font-display font-bold px-2 py-0.5 rounded border ${
              readiness.training.knowledge_grade === 'expert'     ? 'text-blue-300 border-blue-400/40' :
              readiness.training.knowledge_grade === 'proficient' ? 'text-yellow-400 border-yellow-500/40' :
              readiness.training.knowledge_grade === 'developing' ? 'text-slate-300 border-slate-400/40' :
              'text-orange-500 border-orange-600/40'
            }`}>{readiness.training.knowledge_label}</span>
          </div>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">{readiness.training.knowledge_detail}</p>
          <div className="flex gap-3 text-xs text-muted-foreground font-sans pt-1 border-t border-border/50">
            <span>{readiness.training.doc_count} docs · {readiness.training.total_pages} pages · Knowledge factor: {readiness.training.knowledge_factor}/100</span>
          </div>
        </div>
      )}
      {readiness.training && readiness.training.knowledge_grade === 'none' && (
        <div className="border border-dashed border-orange-500/30 bg-orange-500/5 rounded-lg p-4 text-xs text-orange-400 font-sans flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>No training documents filed. Upload SOPs, TTPs, and drills in the <strong>Training Docs</strong> tab to improve your capability tier score.</span>
        </div>
      )}

    </div>
  );
}

// ─── Restored Tabs ───
function ReputationTab({ group }: any) {
  const [roster, setRoster] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [repData, setRepData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isProUnit, setIsProUnit] = useState(false);
  const [form, setForm] = useState({ activity: 7, attitude: 7, experience: 5, discipline: 7, overall_vote: "commend", blacklisted: false, blacklist_reason: "", notes: "" });
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      apiFetch<any>(`/api/milsim-groups/${group.id}/full`),
      apiFetch<any>(`/getProStatus?group_id=${group.id}`).catch(() => ({ is_pro: false })),
    ]).then(([g, proStatus]) => {
      setRoster(g.roster ?? []);
      setIsProUnit(!!proStatus?.is_pro);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [group.id]);

  const loadRep = async (member: any) => {
    setSelected(member);
    if (repData[member.userId]) return;
    try {
      const data = await apiFetch<any>(`/api/reputation/${member.userId}`);
      setRepData(prev => ({ ...prev, [member.userId]: data }));
    } catch {}
  };

  const submitReview = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/reputation/${selected.userId}`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          group_id: group.id,
          group_name: group.name,
          blacklist_reason: form.blacklisted ? form.blacklist_reason : undefined,
        }),
      });
      // Refresh rep
      const updated = await apiFetch<any>(`/api/reputation/${selected.userId}`);
      setRepData(prev => ({ ...prev, [selected.userId]: updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Review submitted", description: `Service file for ${selected.callsign} updated.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const GRADE_COLORS: Record<string, string> = {
    ELITE: "#fbbf24", TRUSTED: "#4ade80", STANDARD: "#60a5fa",
    CAUTION: "#fb923c", "HIGH RISK": "#f87171", BLACKLISTED: "#ef4444", UNRATED: "#6b7280",
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h3 className="font-display font-bold text-lg uppercase tracking-widest">Member Service Files</h3>
        <p className="text-sm text-muted-foreground font-sans mt-1">
          As a unit commander, you can rate your members' performance. These scores are <strong>public</strong> and visible to all commanders across the registry — they help filter out unit hoppers and inactive operators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member list */}
        <div className="space-y-2">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Roster ({roster.length})</p>
          {roster.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
              <p className="text-sm font-display uppercase tracking-widest">No roster members</p>
            </div>
          ) : (
            roster.map((m: any) => {
              const rep = repData[m.userId]?.score ?? null;
              const isSelected = selected?.id === m.id;
              return (
                <button key={m.id} onClick={() => loadRep(m)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 bg-card"
                  }`}>
                  <div>
                    <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{m.callsign}</p>
                    {m.rankName && <p className="text-xs text-muted-foreground">{m.rankName}</p>}
                  </div>
                  {rep ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black" style={{ color: GRADE_COLORS[rep.grade] ?? "#6b7280" }}>{rep.overall}</span>
                      <span className="text-[9px] font-bold uppercase" style={{ color: GRADE_COLORS[rep.grade] ?? "#6b7280" }}>{rep.grade}</span>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Unrated</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Rating panel */}
        <div>
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg text-muted-foreground text-sm text-center px-6">
              <Star className="w-8 h-8 mb-3 opacity-30" />
              <p className="font-display font-bold uppercase tracking-widest">Select a member to view or submit their service assessment</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-black uppercase tracking-widest text-lg">{selected.callsign}</p>
                  {repData[selected.userId]?.score && (
                    <p className="text-xs font-bold uppercase" style={{ color: GRADE_COLORS[repData[selected.userId].score.grade] }}>
                      {repData[selected.userId].score.grade} · {repData[selected.userId].score.overall}/100
                    </p>
                  )}
                </div>
                {repData[selected.userId]?.score?.blacklisted && (
                  <div className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-1 rounded">
                    ⚠ BLACKLISTED
                  </div>
                )}
              </div>

              {/* Existing reviews summary — Pro: full detail | Free: summary only */}
              {repData[selected.userId] && (() => {
                const rd = repData[selected.userId];
                const isPro = isProUnit;
                const reviewCount = rd.reviews?.length ?? 0;
                const commends = rd.score?.commends ?? 0;
                const flags = rd.score?.flags ?? 0;
                return isPro ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-sans">
                      {reviewCount} review(s) on record — {commends} commend(s), {flags} flag(s)
                    </div>
                    {rd.reviews && rd.reviews.length > 0 && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {rd.reviews.map((rev: any, i: number) => (
                          <div key={i} className="text-[10px] bg-secondary/40 border border-border rounded px-2.5 py-1.5">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-display font-bold uppercase tracking-widest text-foreground">{rev.group_name ?? "Unknown Unit"}</span>
                              <span className={`font-bold uppercase ${rev.overall_vote === "commend" ? "text-green-400" : rev.overall_vote === "flag" ? "text-red-400" : "text-muted-foreground"}`}>
                                {rev.overall_vote === "commend" ? "✓ Commend" : rev.overall_vote === "flag" ? "⚑ Flag" : "— Neutral"}
                              </span>
                            </div>
                            <div className="flex gap-3 text-muted-foreground">
                              <span>Activity: {rev.activity}/10</span>
                              <span>Attitude: {rev.attitude}/10</span>
                              <span>Experience: {rev.experience}/10</span>
                              <span>Discipline: {rev.discipline}/10</span>
                            </div>
                            {rev.notes && <p className="mt-0.5 text-muted-foreground italic">"{rev.notes}"</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {rd.reviews && rd.reviews.length > 0 && (
                      <button
                        onClick={() => {
                          const rows = [["Unit","Vote","Activity","Attitude","Experience","Discipline","Notes"]];
                          rd.reviews.forEach((rev: any) => rows.push([rev.group_name ?? "", rev.overall_vote, rev.activity, rev.attitude, rev.experience, rev.discipline, rev.notes ?? ""]));
                          const csv = rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
                          const blob = new Blob([csv], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url; a.download = `${selected.callsign ?? "operator"}-reputation.csv`; a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-[10px] font-display font-bold uppercase tracking-widest text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded transition-all flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Export CSV
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-sans">
                      {reviewCount} review(s) on record — {commends} commend(s), {flags} flag(s)
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-yellow-400 border border-yellow-500/30 bg-yellow-500/5 rounded px-2.5 py-1.5">
                      <Crown className="w-3 h-3 shrink-0" />
                      <span className="font-sans">Full review history + export available with <a href="/commander-pro" className="underline font-bold">Commander Pro</a></span>
                    </div>
                  </div>
                );
              })()}

              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Your Assessment</p>

                {/* Score sliders */}
                {[
                  { key: "activity", label: "Activity", hint: "How active are they in ops and events?" },
                  { key: "attitude", label: "Attitude", hint: "Conduct, teamwork, professionalism." },
                  { key: "experience", label: "Experience", hint: "Tactical knowledge and skill level." },
                  { key: "discipline", label: "Discipline", hint: "Follows orders, SOP compliance." },
                ].map(({ key, label, hint }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-display font-bold uppercase tracking-widest">{label}</label>
                        <p className="text-[9px] text-muted-foreground">{hint}</p>
                      </div>
                      <span className="text-sm font-bold font-mono text-foreground w-6 text-right">
                        {(form as any)[key]}
                      </span>
                    </div>
                    <input type="range" min={1} max={10} value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-[8px] text-muted-foreground"><span>1</span><span>10</span></div>
                  </div>
                ))}

                {/* Overall vote */}
                <div>
                  <label className="text-xs font-display font-bold uppercase tracking-widest mb-2 block">Overall Vote</label>
                  <div className="flex gap-2">
                    {[
                      { v: "commend", label: "✓ Commend", cls: "text-green-400 border-green-500/40 bg-green-500/10" },
                      { v: "neutral", label: "— Neutral", cls: "text-slate-400 border-border bg-secondary" },
                      { v: "flag",    label: "⚑ Flag",    cls: "text-red-400 border-red-500/40 bg-red-500/10" },
                    ].map(({ v, label, cls }) => (
                      <button key={v} type="button" onClick={() => setForm(f => ({ ...f, overall_vote: v }))}
                        className={`flex-1 py-2 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                          form.overall_vote === v ? cls : "border-border text-muted-foreground"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-display font-bold uppercase tracking-widest mb-1 block">Notes (optional)</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional context or observations..."
                    className="mf-input resize-none text-xs" />
                </div>

                {/* Blacklist toggle */}
                <div className="border border-red-500/20 rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.blacklisted} onChange={e => setForm(f => ({ ...f, blacklisted: e.target.checked }))}
                      className="accent-red-500" />
                    <span className="text-xs font-display font-bold uppercase tracking-widest text-red-400">Blacklist this operator</span>
                  </label>
                  {form.blacklisted && (
                    <input value={form.blacklist_reason} onChange={e => setForm(f => ({ ...f, blacklist_reason: e.target.value }))}
                      placeholder="Reason for blacklist (visible publicly)..."
                      className="mf-input text-xs" />
                  )}
                </div>

                <button onClick={submitReview} disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm py-2.5 rounded clip-angled-sm transition-all disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "✓ Saved" : <><Star className="w-4 h-4" /> Submit Assessment</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Training Docs Tab ────────────────────────────────────────────────────────
const DOC_TYPES = ["SOP", "TTP", "Field Manual", "Drill", "Reference", "Rules of Engagement", "WARNO", "OPORD", "FRAGO", "Other"] as const;

function TrainingDocsTab({ group, showMsg }: any) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isProUnit, setIsProUnit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [assessment, setAssessment] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", description: "", doc_type: "SOP" as typeof DOC_TYPES[number],
    last_reviewed_at: new Date().toISOString().split("T")[0],
  });

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const [data, proStatus] = await Promise.all([
        apiFetch<any[]>(`/api/training-docs/${group.id}`),
        apiFetch<any>(`/getProStatus?group_id=${group.id}`).catch(() => ({ is_pro: false })),
      ]);
      setDocs(data ?? []);
      setIsProUnit(!!proStatus?.is_pro);
    } catch { setDocs([]); } finally { setLoading(false); }
  }, [group.id]);

  const loadAssessment = useCallback(async () => {
    try {
      const r = await apiFetch<any>(`/api/stats/readiness/${group.id}`);
      if (r?.training) setAssessment(r.training);
    } catch {}
  }, [group.id]);

  useEffect(() => { loadDocs(); loadAssessment(); }, [loadDocs, loadAssessment]);

  const uploadDoc = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !form.title.trim()) {
      showMsg(false, "Title and file are required."); return;
    }
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain", "text/markdown"];
    if (!allowed.includes(file.type)) {
      showMsg(false, "Only PDF, DOCX, DOC, TXT, or MD files are supported."); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showMsg(false, "File must be under 20MB."); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("group_id", group.id);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("doc_type", form.doc_type);
      fd.append("last_reviewed_at", form.last_reviewed_at ? new Date(form.last_reviewed_at).toISOString() : new Date().toISOString());
      fd.append("uploaded_by", user?.id ?? "");
      fd.append("uploaded_by_username", (user as any)?.username ?? "");
      const result = await apiFetch<any>("/api/training-docs/upload", { method: "POST", body: fd, isFormData: true });
      if (result?.id) {
        setDocs(prev => [result, ...prev]);
        setForm({ title: "", description: "", doc_type: "SOP", last_reviewed_at: new Date().toISOString().split("T")[0] });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowForm(false);
        showMsg(true, "Training document uploaded.");
        loadAssessment();
      } else if (result?.pro_required) {
        showMsg(false, "You've reached the 5-document limit for free units. Upgrade to Commander Pro for unlimited uploads.");
      } else { showMsg(false, "Upload failed — try again."); }
    } catch (e: any) {
      if (e?.pro_required || e?.message?.includes("Commander Pro")) {
        showMsg(false, "You've reached the 5-document limit. Upgrade to Commander Pro for unlimited uploads.");
      } else {
        showMsg(false, e.message ?? "Upload failed.");
      }
    } finally { setUploading(false); }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm("Remove this training document?")) return;
    try {
      await apiFetch(`/api/training-docs/${group.id}/${id}`, { method: "DELETE" });
      setDocs(prev => prev.filter(d => d.id !== id));
      showMsg(true, "Document removed.");
      loadAssessment();
    } catch { showMsg(false, "Failed to remove document."); }
  };

  const markReviewed = async (doc: any) => {
    try {
      const updated = await apiFetch<any>(`/api/training-docs/${group.id}/${doc.id}`, {
        method: "PATCH", body: JSON.stringify({ last_reviewed_at: new Date().toISOString() }),
      });
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, ...updated } : d));
      showMsg(true, "Marked as reviewed.");
      loadAssessment();
    } catch { showMsg(false, "Failed to update."); }
  };

  const gradeColor: Record<string, string> = {
    expert:     "text-slate-200 border-slate-300/60 bg-slate-200/10",
    proficient: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
    developing: "text-blue-300 border-blue-300/40 bg-blue-300/10",
    minimal:    "text-orange-500 border-orange-600/40 bg-orange-500/10",
    none:       "text-muted-foreground border-border bg-secondary/40",
  };
  const gradeIcon: Record<string, string> = {
    expert: "⬡", proficient: "★", developing: "◆", minimal: "▲", none: "●",
  };

  const nowMs = Date.now();
  const isStale = (doc: any) => {
    const ref = doc.last_reviewed_at ?? doc.updated_date ?? doc.created_date;
    if (!ref) return true;
    return (nowMs - new Date(ref).getTime()) > 180 * 86_400_000;
  };

  const docTypeColor: Record<string, string> = {
    "SOP":                  "text-green-400 border-green-500/30 bg-green-500/10",
    "TTP":                  "text-blue-400 border-blue-500/30 bg-blue-500/10",
    "Field Manual":         "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    "Drill":                "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    "WARNO":                "text-orange-400 border-orange-500/30 bg-orange-500/10",
    "OPORD":                "text-orange-400 border-orange-500/30 bg-orange-500/10",
    "FRAGO":                "text-orange-300 border-orange-400/30 bg-orange-400/10",
    "Reference": "text-purple-400 border-purple-500/30 bg-purple-500/10",
    "Rules of Engagement": "text-red-400 border-red-500/30 bg-red-500/10",
    "Other": "text-muted-foreground border-border bg-secondary/40",
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Assessment Banner */}
      {assessment && (
        <div className={`border rounded-lg p-5 space-y-2 ${gradeColor[assessment.knowledge_grade] ?? gradeColor.none}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <Brain className="w-5 h-5 shrink-0" />
            <span className="font-display font-black uppercase tracking-widest text-sm">
              {gradeIcon[assessment.knowledge_grade]} {assessment.knowledge_label}
            </span>
            <span className="ml-auto font-display font-bold text-xs opacity-70">
              Knowledge Factor: {assessment.knowledge_factor}/100
            </span>
          </div>
          <p className="text-xs font-sans leading-relaxed opacity-85">{assessment.knowledge_detail}</p>
          <div className="flex flex-wrap gap-3 pt-1 text-xs font-sans opacity-70">
            <span>{assessment.doc_count} document{assessment.doc_count !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{assessment.total_pages} page{assessment.total_pages !== 1 ? "s" : ""} total</span>
            <span>·</span>
            <span>Avg depth: {assessment.avg_depth_score}/100</span>
            {assessment.outdated_count > 0 && <><span>·</span><span className="text-orange-400">{assessment.outdated_count} outdated</span></>}
          </div>
          {/* Coverage badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: "SOPs", has: assessment.has_sop },
              { label: "TTPs", has: assessment.has_ttp },
              { label: "Field Manuals", has: assessment.has_fm },
              { label: "Drills", has: assessment.has_drill },
            ].map(b => (
              <span key={b.label} className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${b.has ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border text-muted-foreground bg-secondary/30 opacity-50"}`}>
                {b.has ? "✓" : "✗"} {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold uppercase tracking-widest">Training Documents</h3>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Upload SOPs, TTPs, drills, and references. Depth and recency directly influence your unit's capability tier.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs rounded clip-angled-sm transition-all">
          <Plus className="w-3.5 h-3.5" /> Upload Doc
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/30 rounded-lg p-5 space-y-4">
          <h4 className="font-display font-bold uppercase tracking-widest text-sm text-primary">New Training Document</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Document Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Section Attack Procedure SOP" className="mf-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Document Type</label>
              <select value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value as any }))} className="mf-input w-full">
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Effective / Reviewed Date</label>
              <input type="date" value={form.last_reviewed_at} onChange={e => setForm(f => ({ ...f, last_reviewed_at: e.target.value }))} className="mf-input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Description (optional)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Brief summary of what this document covers..." className="mf-input w-full resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">File * (PDF, DOCX, DOC, TXT, MD — max 20MB)</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-xs rounded transition-all">
                  <Upload className="w-3.5 h-3.5" /> Choose File
                </button>
                <span className="text-xs text-muted-foreground font-sans" id="file-label">No file selected</span>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { const lbl = document.getElementById('file-label'); if (lbl) lbl.textContent = f.name; } }} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border hover:border-destructive/50 text-muted-foreground hover:text-destructive font-display font-bold uppercase tracking-wider text-xs rounded transition-all">
              Cancel
            </button>
            {!isProUnit && docs.length >= 5 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-xs font-sans text-yellow-400 mb-2">
                <span className="text-lg">⚠️</span>
                <span>
                  <strong className="font-display font-bold uppercase">Doc limit reached (5/5).</strong>{" "}
                  Free units can store up to 5 training documents.{" "}
                  <a href="/commander-pro" className="underline font-bold hover:text-yellow-300">Upgrade to Commander Pro</a> for unlimited uploads.
                </span>
              </div>
            )}
            <button onClick={uploadDoc} disabled={uploading || (!isProUnit && docs.length >= 5)}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs rounded clip-angled-sm transition-all disabled:opacity-50">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Docs List */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-border rounded-lg text-muted-foreground">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-display text-sm uppercase tracking-widest">No Training Documents</p>
          <p className="text-xs mt-2 font-sans">Upload your SOPs, TTPs, and drill references to build your knowledge baseline.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => {
            const stale = isStale(doc);
            return (
              <div key={doc.id} className={`bg-card border rounded-lg p-4 flex items-start gap-4 transition-colors ${stale ? "border-orange-500/30" : "border-border"}`}>
                <div className="shrink-0 mt-0.5">
                  <FileCheck className={`w-5 h-5 ${stale ? "text-orange-400" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-display font-bold text-sm">{doc.title}</span>
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${docTypeColor[doc.doc_type] ?? docTypeColor.Other}`}>
                      {doc.doc_type}
                    </span>
                    {doc.quality_flag === 'amber' && (
                      <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-yellow-500/40 text-yellow-400 bg-yellow-500/10" title={doc.ai_summary ?? 'Thin content — review recommended'}>
                        <AlertTriangle className="w-2.5 h-2.5" /> Thin Content
                      </span>
                    )}
                    {doc.quality_flag === 'red' && (
                      <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-red-500/40 text-red-400 bg-red-500/10" title={doc.ai_summary ?? 'Suspected low-quality or invalid content'}>
                        <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                      </span>
                    )}
                    {stale && (
                      <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-orange-500/40 text-orange-400 bg-orange-500/10">
                        <AlertTriangle className="w-2.5 h-2.5" /> Outdated
                      </span>
                    )}
                  </div>
                  {(doc.quality_flag === 'amber' || doc.quality_flag === 'red') && doc.ai_summary && (
                    <p className="text-[10px] font-sans mt-1 mb-1 italic text-muted-foreground opacity-70">⚠ {doc.ai_summary}</p>
                  )}
                  {doc.description && <p className="text-xs text-muted-foreground font-sans mb-2 line-clamp-2">{doc.description}</p>}
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground font-sans">
                    {doc.page_count && <span>{doc.page_count} pages</span>}
                    {doc.file_name && <span>{doc.file_name}</span>}
                    {doc.file_size_bytes && <span>{(doc.file_size_bytes / 1024).toFixed(0)} KB</span>}
                    {doc.depth_score && <span>Depth: {doc.depth_score}/100</span>}
                    {doc.ai_score != null && <span>AI Score: {doc.ai_score}/100</span>}
                    <span>Reviewed: {doc.last_reviewed_at ? format(new Date(doc.last_reviewed_at), "dd MMM yyyy") : "—"}</span>
                    <span>By: {doc.uploaded_by_username ?? "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="View document">
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  {stale && (
                    <button onClick={() => markReviewed(doc)}
                      className="p-1.5 text-muted-foreground hover:text-green-400 transition-colors" title="Mark as reviewed today">
                      <FileCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteDoc(doc.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOA MANAGER TAB
// ─────────────────────────────────────────────────────────────────────────────
const LOA_REASONS = [
  "Personal", "Medical", "Work / Career", "Family", "Travel",
  "Education", "Mental Health", "Technical Issues", "Military Service", "Other"
] as const;

function LOATab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success"|"error") => void }) {
  const { user } = useAuth();
  const [loas, setLoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [extTarget, setExtTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    roster_id: "", callsign: "", reason_category: "Personal" as typeof LOA_REASONS[number],
    reason_detail: "", start_date: new Date().toISOString().split("T")[0],
    end_date: "", notes: ""
  });
  const [extForm, setExtForm] = useState({ extension_requested_until: "", extension_reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/loa?path=list&group_id=${group.id}`);
      setLoas(data.loas ?? []);
    } catch { setLoas([]); }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const isCommander = group.roster?.some((r: any) =>
    r.user_id === user?.id && (r.role === "commander" || r.notes?.includes("commander") || group.owner_id === user?.id)
  ) || group.owner_id === user?.id;

  const rosterOptions = group.roster ?? [];

  const grantLOA = async () => {
    if (!form.roster_id || !form.end_date) { showMsg("Select member and end date", "error"); return; }
    setSaving(true);
    try {
      await apiFetch("/loa?path=grant", { method: "POST", body: JSON.stringify({
        group_id: group.id, ...form,
        granted_by: user?.id, granted_by_username: user?.username
      }) });
      showMsg("LOA granted ✓", "success");
      setShowForm(false);
      setForm({ roster_id: "", callsign: "", reason_category: "Personal", reason_detail: "", start_date: new Date().toISOString().split("T")[0], end_date: "", notes: "" });
      load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this LOA?")) return;
    try {
      await apiFetch("/loa?path=revoke", { method: "POST", body: JSON.stringify({ loa_id: id }) });
      showMsg("LOA revoked", "success"); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const approveExt = async (loa: any, approve: boolean) => {
    try {
      await apiFetch("/loa?path=review-extension", { method: "POST", body: JSON.stringify({
        loa_id: loa.id, approve, reviewed_by: user?.username
      }) });
      showMsg(approve ? "Extension approved ✓" : "Extension denied", "success"); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const requestExt = async () => {
    if (!extForm.extension_requested_until || !extForm.extension_reason) { showMsg("Fill all fields", "error"); return; }
    try {
      await apiFetch("/loa?path=request-extension", { method: "POST", body: JSON.stringify({
        loa_id: extTarget.id, ...extForm
      }) });
      showMsg("Extension request submitted", "success"); setExtTarget(null); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const statusColor: Record<string, string> = {
    Active: "text-green-400 border-green-500/30 bg-green-500/10",
    Expired: "text-muted-foreground border-border bg-secondary/30",
    Revoked: "text-red-400 border-red-500/30 bg-red-500/10",
    "Extension Requested": "text-amber-400 border-amber-500/30 bg-amber-500/10",
  };

  const myLOA = loas.find(l => l.user_id === user?.id && l.status === "Active");

  // Smart LOA Alerts — find LOAs expiring within 48 hours
  const now = new Date();
  const expiringSoon = loas.filter(l => {
    if (l.status !== "Active") return false;
    const end = new Date(l.end_date);
    const diffHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 48;
  });
  const overdueActive = loas.filter(l => {
    if (l.status !== "Active") return false;
    return new Date(l.end_date) < now;
  });

  return (
    <div className="space-y-6">
      {/* Smart LOA Alerts */}
      {(expiringSoon.length > 0 || overdueActive.length > 0) && (
        <div className="space-y-2">
          {overdueActive.map(l => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/40 bg-red-500/10">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-bold uppercase tracking-wider text-red-400">LOA Overdue — {l.callsign}</p>
                <p className="text-[10px] font-sans text-muted-foreground">Ended {new Date(l.end_date).toLocaleDateString("en-GB")} · Status not yet updated. Run calendar sync or revoke manually.</p>
              </div>
            </div>
          ))}
          {expiringSoon.map(l => {
            const hoursLeft = Math.round((new Date(l.end_date).getTime() - now.getTime()) / (1000 * 60 * 60));
            return (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-500/40 bg-amber-500/10">
                <Bell className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-display font-bold uppercase tracking-wider text-amber-400">LOA Expiring Soon — {l.callsign}</p>
                  <p className="text-[10px] font-sans text-muted-foreground">Expires in ~{hoursLeft}h on {new Date(l.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {l.reason_category}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg uppercase tracking-widest">Leave of Absence Manager</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Active LOAs freeze reputation decay and activity tracking for the duration.</p>
        </div>
        {isCommander && (
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
            <PlaneTakeoff className="w-3.5 h-3.5" /> Grant LOA
          </button>
        )}
      </div>

      {/* Grant Form */}
      {showForm && isCommander && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary">New LOA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MField label="Member">
              <select value={form.roster_id} onChange={e => {
                const r = rosterOptions.find((x: any) => x.id === e.target.value);
                setForm(f => ({ ...f, roster_id: e.target.value, callsign: r?.callsign ?? "" }));
              }} className="mf-input w-full">
                <option value="">— Select member —</option>
                {rosterOptions.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.callsign}</option>
                ))}
              </select>
            </MField>
            <MField label="Reason Category">
              <select value={form.reason_category} onChange={e => setForm(f => ({ ...f, reason_category: e.target.value as any }))} className="mf-input w-full">
                {LOA_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </MField>
            <MField label="Start Date">
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="mf-input w-full" />
            </MField>
            <MField label="End Date">
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="mf-input w-full" />
            </MField>
            <MField label="Details (optional)">
              <input type="text" value={form.reason_detail} onChange={e => setForm(f => ({ ...f, reason_detail: e.target.value }))} placeholder="Brief context..." className="mf-input w-full" />
            </MField>
            <MField label="Commander Notes (internal)">
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." className="mf-input w-full" />
            </MField>
          </div>
          <div className="flex gap-2">
            <button onClick={grantLOA} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Confirm LOA
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-border text-muted-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-secondary transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Extension request modal for member */}
      {extTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest">Request LOA Extension</h3>
            <p className="text-xs text-muted-foreground font-sans">Current end: <span className="text-foreground font-bold">{extTarget.end_date}</span></p>
            <MField label="New End Date">
              <input type="date" value={extForm.extension_requested_until} onChange={e => setExtForm(f => ({ ...f, extension_requested_until: e.target.value }))} className="mf-input w-full" />
            </MField>
            <MField label="Reason for Extension">
              <textarea value={extForm.extension_reason} onChange={e => setExtForm(f => ({ ...f, extension_reason: e.target.value }))} rows={3} placeholder="Explain why you need more time..." className="mf-input w-full resize-none" />
            </MField>
            <div className="flex gap-2">
              <button onClick={requestExt} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">
                <RefreshCw className="w-3.5 h-3.5" /> Submit Request
              </button>
              <button onClick={() => setExtTarget(null)} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* My active LOA banner */}
      {myLOA && (
        <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-display font-bold text-sm text-blue-400 uppercase tracking-widest">You are currently on LOA</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">Until {myLOA.end_date} · {myLOA.reason_category} · Granted by {myLOA.granted_by_username}</p>
          </div>
          {myLOA.extension_status !== "Pending" && (
            <button onClick={() => { setExtTarget(myLOA); setExtForm({ extension_requested_until: "", extension_reason: "" }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-500/40 text-blue-400 rounded font-display text-xs uppercase tracking-widest hover:bg-blue-500/20 transition-colors">
              <RefreshCw className="w-3 h-3" /> Request Extension
            </button>
          )}
          {myLOA.extension_status === "Pending" && (
            <span className="text-xs font-display font-bold text-amber-400 uppercase tracking-widest border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded">Extension Pending</span>
          )}
        </div>
      )}

      {/* LOA list */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-sans"><Loader2 className="w-4 h-4 animate-spin" /> Loading LOAs...</div>
      ) : loas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-sans text-sm border border-dashed border-border rounded-lg">
          <PlaneTakeoff className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No active or historical LOAs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loas.map(loa => {
            const isPending = loa.extension_status === "Pending";
            const daysLeft = Math.ceil((new Date(loa.end_date).getTime() - Date.now()) / 86400000);
            return (
              <div key={loa.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-sm">{loa.callsign}</span>
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${statusColor[loa.status] ?? "text-muted-foreground border-border"}`}>{loa.status}</span>
                    <span className="text-xs text-muted-foreground font-sans">{loa.reason_category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loa.status === "Active" && (
                      <span className={`text-xs font-sans ${daysLeft <= 3 ? "text-red-400" : "text-muted-foreground"}`}>
                        {daysLeft > 0 ? `${daysLeft}d remaining` : "Expires today"}
                      </span>
                    )}
                    {isPending && isCommander && (
                      <>
                        <button onClick={() => approveExt(loa, true)} className="flex items-center gap-1 px-2 py-1 text-xs font-display font-bold uppercase bg-green-500/10 border border-green-500/30 text-green-400 rounded hover:bg-green-500/20 transition-colors">
                          <Check className="w-3 h-3" /> Approve Ext.
                        </button>
                        <button onClick={() => approveExt(loa, false)} className="flex items-center gap-1 px-2 py-1 text-xs font-display font-bold uppercase bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors">
                          <X className="w-3 h-3" /> Deny
                        </button>
                      </>
                    )}
                    {isCommander && loa.status === "Active" && (
                      <button onClick={() => revoke(loa.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Revoke LOA">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {loa.start_date} → {loa.end_date}</span>
                  <span>Granted by <span className="text-foreground">{loa.granted_by_username}</span></span>
                  {loa.reason_detail && <span>"{loa.reason_detail}"</span>}
                </div>
                {isPending && (
                  <div className="text-xs font-sans bg-amber-500/10 border border-amber-500/20 rounded p-2 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span><span className="text-amber-400 font-bold">Extension requested</span> until {loa.extension_requested_until} — "{loa.extension_reason}"</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY CALENDAR TAB
// ─────────────────────────────────────────────────────────────────────────────
// ─── Activity Calendar ────────────────────────────────────────────────────────
const EVENT_TYPES = ["Op", "Training", "Meeting", "Social", "Admin", "Other"] as const;

const EV_STYLE: Record<string, string> = {
  Op:       "bg-red-500/15 border-red-500/40 text-red-300",
  Training: "bg-yellow-500/15 border-yellow-500/40 text-yellow-300",
  Meeting:  "bg-purple-500/15 border-purple-500/40 text-purple-300",
  Social:   "bg-green-500/15 border-green-500/40 text-green-300",
  Admin:    "bg-secondary border-border text-muted-foreground",
  Other:    "bg-secondary border-border text-muted-foreground",
  LOA:      "bg-blue-500/10 border-blue-500/30 text-blue-400",
  AAR:      "bg-green-500/10 border-green-500/30 text-green-400",
  Campaign: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
};

function ActivityCalendarTab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success"|"error") => void }) {
  const { user } = useAuth();
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [events, setEvents]   = useState<any[]>([]);
  const [loas, setLoas]       = useState<any[]>([]);
  const [aars, setAars]       = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProCal, setIsProCal] = useState<boolean | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", event_type: "Op" as typeof EVENT_TYPES[number],
    scheduled_at: "", end_date: "", description: "", game: "", status: "Planned"
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Pro check
      const proRes = await fetch(`${PRO_STATUS_URL_MANAGE}?group_id=${group.id}`);
      const proData = await proRes.json();
      setIsProCal(proData.is_pro);
      if (!proData.is_pro) { setLoading(false); return; }

      const [opsData, loaData, aarData, campRes] = await Promise.all([
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
        apiFetch(`/loa?path=list&group_id=${group.id}`),
        apiFetch(`/milsimAars?path=list&group_id=${group.id}`),
        fetch(`${CAMPAIGNS_URL}?path=list&group_id=${group.id}`).then(r => r.json()).catch(() => []),
      ]);
      setEvents(opsData.events ?? []);
      setLoas(loaData.loas ?? []);
      setAars(aarData.aars ?? []);
      setCampaigns(Array.isArray(campRes) ? campRes : []);
    } catch { setEvents([]); setLoas([]); setAars([]); setCampaigns([]); }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  // ── Pro gate ──────────────────────────────────────────────────────────────
  if (isProCal === null) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!isProCal) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-6">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center">
        <Crown className="w-8 h-8 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-display font-black text-2xl uppercase tracking-wider text-foreground mb-2">Commander Pro Required</h3>
        <p className="text-muted-foreground font-sans leading-relaxed">
          The Activity Calendar is a Pro feature. Upgrade to unlock full campaign-linked scheduling, LOA tracking, AAR timelines, and monthly readiness views.
        </p>
      </div>
      <a href="/commander-pro"
        className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-sm px-8 py-3 rounded transition-all shadow-[0_0_20px_hsla(48,96%,53%,0.3)]">
        <Crown className="w-4 h-4" /> Upgrade to Pro
      </a>
    </div>
  );

  const save = async () => {
    if (!form.title || !form.scheduled_at) { showMsg("Title and date required", "error"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await apiFetch("/activityCalendar?path=update", { method: "POST", body: JSON.stringify({ id: editTarget.id, ...form }) });
        showMsg("Event updated", "success");
      } else {
        await apiFetch("/activityCalendar?path=create", { method: "POST", body: JSON.stringify({ group_id: group.id, created_by: user?.username, ...form }) });
        showMsg("Event scheduled", "success");
      }
      setShowForm(false); setEditTarget(null); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await apiFetch("/activityCalendar?path=delete", { method: "POST", body: JSON.stringify({ id }) });
    showMsg("Deleted", "success"); load();
  };

  const openEdit = (ev: any) => {
    setEditTarget(ev);
    setForm({ title: ev.title ?? ev.name ?? "", event_type: ev.event_type ?? "Op", scheduled_at: ev.scheduled_at ? ev.scheduled_at.slice(0,16) : "", end_date: ev.end_date ?? "", description: ev.description ?? "", game: ev.game ?? "", status: ev.status ?? "Planned" });
    setShowForm(true);
    setSelectedDay(null);
  };

  const firstDay    = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // ── helpers ──────────────────────────────────────────────────────────────────
  const dayDate = (day: number) => new Date(viewYear, viewMonth, day);

  const opsForDay = (day: number) => events.filter(e => {
    if (!e.scheduled_at) return false;
    const d = new Date(e.scheduled_at);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
  });

  const loasForDay = (day: number) => {
    const date = dayDate(day);
    return loas.filter(l => {
      if (!l.start_date || !l.end_date) return false;
      const start = new Date(l.start_date); const end = new Date(l.end_date);
      // include all statuses so even pending LOAs show
      return date >= start && date <= end;
    });
  };

  // AARs land on the op's scheduled_at date OR their own created_date
  const aarsForDay = (day: number) => aars.filter(a => {
    // try to match to a linked op's date first
    if (a.op_id) {
      const linkedOp = events.find(e => e.id === a.op_id);
      if (linkedOp?.scheduled_at) {
        const d = new Date(linkedOp.scheduled_at);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
      }
    }
    // fallback: use created_date
    const d = new Date(a.created_date ?? a.created_at ?? "");
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
  });

  const campaignsForDay = (day: number) => {
    const date = dayDate(day);
    return campaigns.filter(camp => {
      if (!camp.start_date || !camp.end_date) return false;
      const start = new Date(camp.start_date);
      const end = new Date(camp.end_date);
      return date >= start && date <= end && camp.status !== "Archived";
    });
  };

  const allItemsForDay = (day: number) => [
    ...opsForDay(day).map(e => ({ kind: e.event_type ?? "Op", label: e.title ?? e.name, raw: e })),
    ...loasForDay(day).map(l => ({ kind: "LOA", label: `LOA: ${l.callsign}`, raw: l })),
    ...aarsForDay(day).map(a => ({ kind: "AAR", label: `AAR: ${a.title ?? a.op_name}`, raw: a })),
    ...campaignsForDay(day).map(camp => ({ kind: "Campaign", label: `Campaign: ${camp.name}`, raw: camp })),
  ];

  const upcomingOps = events
    .filter(e => new Date(e.scheduled_at) >= now)
    .sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 8);

  // ── day detail panel ─────────────────────────────────────────────────────────
  const renderDayDetail = () => {
    if (selectedDay === null) return null;
    const items = allItemsForDay(selectedDay);
    const dayOps = opsForDay(selectedDay);
    const dayLoas = loasForDay(selectedDay);
    const dayAars = aarsForDay(selectedDay);
    const dayCamps = campaignsForDay(selectedDay);
    return (
      <div className="border border-border rounded-lg bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest">
            {selectedDay} {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button onClick={() => setSelectedDay(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {items.length === 0 && <p className="text-xs text-muted-foreground font-sans">Nothing logged for this day.</p>}
        {dayOps.length > 0 && (
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Operations / Events</p>
            <div className="space-y-2">
              {dayOps.map(ev => {
                const aarCount = aars.filter(a => a.op_id === ev.id).length;
                return (
                  <div key={ev.id} className={`rounded-lg border p-3 ${EV_STYLE[ev.event_type] ?? EV_STYLE.Other}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-bold text-sm">{ev.title ?? ev.name}</p>
                        {ev.game && <p className="text-[10px] font-sans opacity-70 mt-0.5">{ev.game}</p>}
                        {ev.description && <p className="text-xs font-sans mt-1 opacity-80">{ev.description}</p>}
                        {aarCount > 0 && <p className="text-[10px] font-display font-bold uppercase tracking-widest text-green-400 mt-1">✓ {aarCount} AAR{aarCount > 1 ? "s" : ""} filed</p>}
                        {aarCount === 0 && ev.status === "Completed" && <p className="text-[10px] font-display font-bold uppercase tracking-widest text-amber-400 mt-1">⚠ No AAR filed</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(ev)} className="p-1 opacity-60 hover:opacity-100 transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(ev.id)} className="p-1 opacity-60 hover:opacity-100 text-red-400 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                        ev.status === "Active" ? "border-red-500/40 text-red-400" :
                        ev.status === "Completed" ? "border-border text-muted-foreground" :
                        ev.status === "Confirmed" ? "border-green-500/40 text-green-400" :
                        "border-amber-500/40 text-amber-400"}`}>{ev.status}</span>
                      {ev.scheduled_at && <span className="text-[9px] font-sans opacity-60">{new Date(ev.scheduled_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {dayAars.length > 0 && (
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-green-400 mb-2">After Action Reports</p>
            <div className="space-y-1.5">
              {dayAars.map(a => (
                <div key={a.id} className="rounded border border-green-500/20 bg-green-500/5 p-2.5">
                  <p className="font-display font-bold text-xs text-green-300">{a.title ?? a.op_name}</p>
                  {a.outcome && <p className="text-[10px] font-sans text-muted-foreground mt-0.5">{a.outcome}</p>}
                  {a.lessons_learned && <p className="text-[10px] font-sans text-muted-foreground mt-0.5 line-clamp-2">Lessons: {a.lessons_learned}</p>}
                  <p className="text-[9px] text-muted-foreground font-sans mt-1">by {a.author_username ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {dayLoas.length > 0 && (
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-blue-400 mb-2">Leave of Absence</p>
            <div className="space-y-1.5">
              {dayLoas.map(l => (
                <div key={l.id} className="rounded border border-blue-500/20 bg-blue-500/5 p-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-xs text-blue-300">{l.callsign}</p>
                    <p className="text-[10px] font-sans text-muted-foreground">{l.reason_category}{l.reason_detail ? ` — ${l.reason_detail}` : ""}</p>
                  </div>
                  <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                    l.status === "Active" ? "border-green-500/40 text-green-400" :
                    l.status === "Extension Requested" ? "border-amber-500/40 text-amber-400" :
                    "border-border text-muted-foreground"}`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {(() => {
          const dayCamps = selectedDay !== null ? campaignsForDay(selectedDay) : [];
          if (dayCamps.length === 0) return null;
          return (
            <div>
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-yellow-400 mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Active Campaigns</p>
              <div className="space-y-1.5">
                {dayCamps.map(camp => (
                  <div key={camp.id} className="rounded border border-yellow-500/20 bg-yellow-500/5 p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display font-bold text-xs text-yellow-300">{camp.name}</p>
                      <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                        camp.status === "Active" ? "border-green-500/40 text-green-400" :
                        camp.status === "Planning" ? "border-yellow-500/40 text-yellow-400" :
                        camp.status === "Completed" ? "border-border text-muted-foreground" :
                        "border-border text-muted-foreground"
                      }`}>{camp.status}</span>
                    </div>
                    {camp.objective && <p className="text-[10px] font-sans text-muted-foreground line-clamp-2">{camp.objective}</p>}
                    {camp.tags && camp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {camp.tags.map((t: string) => <span key={t} className="text-[8px] font-display uppercase tracking-widest px-1 py-0.5 bg-secondary border border-border rounded">{t}</span>)}
                      </div>
                    )}
                    {camp.start_date && camp.end_date && (
                      <p className="text-[9px] font-sans text-muted-foreground opacity-70">
                        {new Date(camp.start_date).toLocaleDateString("en-GB")} – {new Date(camp.end_date).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-lg uppercase tracking-widest">Activity Calendar</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Full ops timeline — ops, training, LOAs, and AARs on their correct dates. Click any day to review.</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditTarget(null); setSelectedDay(null); setForm({ title:"", event_type:"Op", scheduled_at:"", end_date:"", description:"", game:"", status:"Planned" }); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Schedule Event
        </button>
      </div>

      {showForm && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary">{editTarget ? "Edit Event" : "New Event"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MField label="Title"><input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Sunday Op — Grid 742" className="mf-input w-full" /></MField>
            <MField label="Type"><select value={form.event_type} onChange={e => setForm(f=>({...f,event_type:e.target.value as any}))} className="mf-input w-full">{EVENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></MField>
            <MField label="Date / Time"><input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f=>({...f,scheduled_at:e.target.value}))} className="mf-input w-full" /></MField>
            <MField label="End Date (optional)"><input type="date" value={form.end_date} onChange={e => setForm(f=>({...f,end_date:e.target.value}))} className="mf-input w-full" /></MField>
            <MField label="Game"><input value={form.game} onChange={e => setForm(f=>({...f,game:e.target.value}))} placeholder="e.g. Arma 3" className="mf-input w-full" /></MField>
            <MField label="Status"><select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} className="mf-input w-full">{["Planned","Confirmed","Active","Completed","Cancelled"].map(s=><option key={s} value={s}>{s}</option>)}</select></MField>
            <div className="md:col-span-2"><MField label="Description"><textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={2} className="mf-input w-full resize-none" /></MField></div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">{saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Save className="w-3.5 h-3.5"/>} {editTarget?"Save Changes":"Schedule"}</button>
            <button onClick={() => { setShowForm(false); setEditTarget(null); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-sans"><Loader2 className="w-4 h-4 animate-spin" /> Loading calendar...</div>
      ) : (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center gap-4 justify-between">
            <button onClick={() => { const d=new Date(viewYear,viewMonth-1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(null); }} className="p-1.5 border border-border rounded hover:bg-secondary transition-colors"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <span className="font-display font-bold text-sm uppercase tracking-widest">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button onClick={() => { const d=new Date(viewYear,viewMonth+1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(null); }} className="p-1.5 border border-border rounded hover:bg-secondary transition-colors"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[9px] font-display font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400/60" />Op</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-400/60" />Training</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-400/60" />AAR</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-300/60 border border-blue-400/40" />LOA</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-400/60" />Campaign</span>
            <span className="flex items-center gap-1 text-muted-foreground">Click any day for full review</span>
          </div>

          {/* Calendar grid */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border">
              {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: startOffset }).map((_,i) => <div key={`pad-${i}`} className="border-b border-r border-border/40 min-h-[72px] bg-secondary/20" />)}
              {Array.from({ length: daysInMonth }).map((_,i) => {
                const day = i + 1;
                const items = allItemsForDay(day);
                const isToday = viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate();
                const isSelected = selectedDay === day;
                const hasMissedAAR = opsForDay(day).some(e => e.status === "Completed" && !aars.find(a => a.op_id === e.id));
                return (
                  <div key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`border-b border-r border-border/40 min-h-[72px] p-1.5 cursor-pointer transition-colors
                      ${isToday ? "bg-primary/5" : ""}
                      ${isSelected ? "ring-1 ring-inset ring-primary/60 bg-primary/10" : "hover:bg-secondary/20"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-display font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</span>
                      {hasMissedAAR && <span title="Completed op with no AAR" className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </div>
                    <div className="space-y-0.5">
                      {items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className={`text-[8px] font-display font-bold uppercase tracking-wide px-1 py-0.5 rounded border truncate ${EV_STYLE[item.kind] ?? EV_STYLE.Other}`}>
                          {item.label}
                        </div>
                      ))}
                      {items.length > 3 && <div className="text-[8px] text-muted-foreground font-sans pl-0.5">+{items.length - 3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day detail panel */}
          {renderDayDetail()}

          {/* Upcoming */}
          {upcomingOps.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">Upcoming</h3>
              {upcomingOps.map(ev => (
                <div key={ev.id} className="flex items-center justify-between gap-4 border border-border rounded-lg px-4 py-3 hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex-shrink-0 ${EV_STYLE[ev.event_type] ?? EV_STYLE.Other}`}>{ev.event_type}</span>
                    <span className="font-display font-bold text-sm truncate">{ev.title ?? ev.name}</span>
                    {ev.game && <span className="text-xs text-muted-foreground font-sans hidden md:block">{ev.game}</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground font-sans">{new Date(ev.scheduled_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>
                    <button onClick={() => openEdit(ev)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(ev.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Analytics (Pro) ──────────────────────────────────────────────────────────
const ANALYTICS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/groupAnalytics";
const PRO_STATUS_URL_MANAGE = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/getProStatus";

function MiniBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-display font-bold text-muted-foreground w-6 text-right">{value}</span>
    </div>
  );
}

function SparkLine({ data, color = "#22d3ee" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = 40, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v / max) * (h - pad * 2));
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
        const y = h - pad - ((v / max) * (h - pad * 2));
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

function StatCard({ label, value, sub, trend, sparkData, color }: { label: string; value: string | number; sub?: string; trend?: string; sparkData?: number[]; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-2">
      <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className={`font-display font-black text-3xl ${color || "text-foreground"}`}>{value}</p>
        {sparkData && <SparkLine data={sparkData} color={color === "text-yellow-400" ? "#facc15" : color === "text-green-400" ? "#4ade80" : "#22d3ee"} />}
      </div>
      {sub && <p className="text-xs font-sans text-muted-foreground">{sub}</p>}
      {trend && <p className="text-xs font-sans text-primary">{trend}</p>}
    </div>
  );
}

function AnalyticsTab({ group }: any) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    // Check pro first
    fetch(`${PRO_STATUS_URL_MANAGE}?group_id=${group.id}`)
      .then(r => r.json())
      .then(s => {
        setIsPro(s.is_pro);
        if (s.is_pro) {
          return fetch(`${ANALYTICS_URL}?group_id=${group.id}`)
            .then(r => r.json())
            .then(setData)
            .catch(() => {});
        }
      })
      .catch(() => setIsPro(false))
      .finally(() => setLoading(false));
  }, [group.id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-sans">Loading analytics...</p>
    </div>
  );

  // Pro gate
  if (!isPro) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-6">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center">
        <Crown className="w-8 h-8 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-display font-black text-2xl uppercase tracking-wider text-foreground mb-2">Commander Pro Required</h3>
        <p className="text-muted-foreground font-sans leading-relaxed">
          Analytics is a Pro feature. Upgrade your unit to unlock full attendance tracking, ops frequency charts, roster growth, duty status breakdown, and more.
        </p>
      </div>
      <a href="/commander-pro"
        className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-sm px-8 py-3 rounded transition-all shadow-[0_0_20px_hsla(48,96%,53%,0.3)]"
      >
        <Crown className="w-4 h-4" /> Upgrade to Pro — £10/mo
      </a>
      <p className="text-xs text-muted-foreground font-sans">Cancel anytime. Instant activation.</p>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <AlertCircle className="w-8 h-8 text-destructive" />
      <p className="text-muted-foreground font-sans">Failed to load analytics data.</p>
    </div>
  );

  const { summary, charts, top_operators, top_awards } = data;

  // Format month labels
  const monthLabels = Object.keys(charts.ops_per_month).map(k => {
    const [y, m] = k.split("-");
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("default", { month: "short" });
  });
  const opsData = Object.values(charts.ops_per_month) as number[];
  const attendData = Object.values(charts.attendance_per_month) as number[];
  const joinData = Object.values(charts.join_per_month) as number[];

  // Outcome colors
  const outcomeColor: Record<string, string> = { victory: "bg-green-500", defeat: "bg-red-500", draw: "bg-yellow-500", incomplete: "bg-secondary" };
  const totalOutcomes = Object.values(charts.aar_outcomes).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <h2 className="font-display font-bold uppercase tracking-wider text-foreground">Unit Analytics</h2>
          <p className="text-xs font-sans text-muted-foreground">Live data — all time unless noted</p>
        </div>
        <span className="ml-auto text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
          <Crown className="w-3 h-3" /> Pro
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Roster" value={summary.active_roster} sub={`${summary.total_roster} total enrolled`} sparkData={joinData} color="text-foreground" />
        <StatCard label="Ops Completed" value={summary.completed_ops} sub={`${summary.scheduled_ops} upcoming`} sparkData={opsData} color="text-primary" />
        <StatCard label="Avg Attendance" value={summary.avg_attendance} sub="per op (from AARs)" color="text-yellow-400" />
        <StatCard label="Op Win Rate" value={`${summary.op_win_rate}%`} sub={`${summary.total_aars} AARs filed`} color={summary.op_win_rate >= 60 ? "text-green-400" : summary.op_win_rate >= 40 ? "text-yellow-400" : "text-red-400"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Awards" value={summary.total_awards} color="text-yellow-400" />
        <StatCard label="Active LOAs" value={summary.active_loas} color={summary.active_loas > 3 ? "text-yellow-400" : "text-muted-foreground"} />
        <StatCard label="Briefings Filed" value={summary.total_aars} color="text-foreground" />
        <StatCard label="Scheduled Ops" value={summary.scheduled_ops} color="text-primary" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Ops per month */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Ops Completed — Last 6 Months</p>
          <div className="flex items-end gap-2 h-24">
            {opsData.map((v, i) => {
              const maxV = Math.max(...opsData, 1);
              const pct = (v / maxV) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-display font-bold">{v}</span>
                  <div className="w-full bg-primary/80 rounded-t transition-all" style={{ height: `${Math.max(pct * 0.7, v > 0 ? 4 : 2)}px` }} />
                  <span className="text-[9px] text-muted-foreground">{monthLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roster growth */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">New Recruits — Last 6 Months</p>
          <div className="flex items-end gap-2 h-24">
            {joinData.map((v, i) => {
              const maxV = Math.max(...joinData, 1);
              const pct = (v / maxV) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-display font-bold">{v}</span>
                  <div className="w-full bg-green-500/70 rounded-t transition-all" style={{ height: `${Math.max(pct * 0.7, v > 0 ? 4 : 2)}px` }} />
                  <span className="text-[9px] text-muted-foreground">{monthLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Roster status */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Roster by Status</p>
          <div className="space-y-2.5">
            {Object.entries(charts.roster_by_status).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-xs font-sans mb-1">
                  <span className="text-foreground capitalize">{status}</span>
                  <span className="text-muted-foreground">{count as number}</span>
                </div>
                <MiniBar value={count as number} max={summary.total_roster} color="bg-primary" />
              </div>
            ))}
          </div>
        </div>

        {/* AAR outcomes */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Op Outcomes</p>
          {totalOutcomes === 0 ? (
            <p className="text-sm text-muted-foreground font-sans py-4 text-center">No AARs filed yet</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(charts.aar_outcomes).map(([outcome, count]) => (
                count as number > 0 ? (
                  <div key={outcome}>
                    <div className="flex justify-between text-xs font-sans mb-1">
                      <span className="text-foreground capitalize">{outcome}</span>
                      <span className="text-muted-foreground">{count as number} ({Math.round(((count as number) / totalOutcomes) * 100)}%)</span>
                    </div>
                    <MiniBar value={count as number} max={totalOutcomes} color={outcomeColor[outcome] || "bg-secondary"} />
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>

        {/* Top operators */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-yellow-400" /> Top Operators
          </p>
          {top_operators.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans py-4 text-center">No op data yet</p>
          ) : (
            <div className="space-y-2">
              {top_operators.map((op: any, i: number) => (
                <div key={op.callsign} className="flex items-center gap-3">
                  <span className={`text-xs font-display font-black w-4 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-500" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-sans text-foreground truncate">{op.callsign}</span>
                  <span className="text-xs font-display font-bold text-muted-foreground">{op.ops_count} ops</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top awards */}
      {top_awards.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Most Issued Awards</p>
          <div className="flex flex-wrap gap-3">
            {top_awards.map((a: any) => (
              <div key={a.name} className="flex items-center gap-2 bg-secondary/50 border border-border rounded px-3 py-2">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-sm font-sans text-foreground">{a.name}</span>
                <span className="text-xs font-display font-bold text-muted-foreground">×{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Campaigns (Pro) ──────────────────────────────────────────────────────────
const CAMPAIGNS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/campaigns";

const OUTCOME_OPTIONS = ["Victory", "Defeat", "Draw", "Ongoing", "Abandoned"];
const STATUS_OPTIONS = ["active", "completed", "archived"];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  archived: "bg-secondary text-muted-foreground border-border",
};

const OUTCOME_COLORS: Record<string, string> = {
  Victory: "text-green-400",
  Defeat: "text-red-400",
  Draw: "text-yellow-400",
  Ongoing: "text-primary",
  Abandoned: "text-muted-foreground",
};

function CampaignCard({ campaign, onEdit, onDelete }: { campaign: any; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const winColor = campaign.win_rate !== null
    ? campaign.win_rate >= 60 ? "text-green-400" : campaign.win_rate >= 40 ? "text-yellow-400" : "text-red-400"
    : "text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
      {/* Banner */}
      {campaign.banner_url && (
        <div className="h-24 w-full overflow-hidden">
          <img src={campaign.banner_url} alt={campaign.name} className="w-full h-full object-cover opacity-70" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-display font-black uppercase tracking-wider text-foreground text-base truncate">{campaign.name}</h3>
              <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_COLORS[campaign.status] || STATUS_COLORS.active}`}>
                {campaign.status}
              </span>
              {campaign.outcome && (
                <span className={`text-[10px] font-display font-bold uppercase tracking-widest ${OUTCOME_COLORS[campaign.outcome] || ""}`}>
                  {campaign.outcome}
                </span>
              )}
            </div>
            {campaign.objective && (
              <p className="text-xs text-muted-foreground font-sans line-clamp-1">{campaign.objective}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 py-3 border-y border-border mb-3">
          <div className="text-center">
            <p className="font-display font-black text-lg text-foreground">{campaign.ops_count}</p>
            <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Ops</p>
          </div>
          <div className="text-center">
            <p className="font-display font-black text-lg text-foreground">{campaign.aars_count}</p>
            <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">AARs</p>
          </div>
          <div className="text-center">
            <p className="font-display font-black text-lg text-foreground">{campaign.avg_attendance || "—"}</p>
            <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Avg Att.</p>
          </div>
          <div className="text-center">
            <p className={`font-display font-black text-lg ${winColor}`}>{campaign.win_rate !== null ? `${campaign.win_rate}%` : "—"}</p>
            <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs font-sans text-muted-foreground mb-3">
          {campaign.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(campaign.start_date).toLocaleDateString()}</span>}
          {campaign.end_date && <span>→ {new Date(campaign.end_date).toLocaleDateString()}</span>}
          {campaign.tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {campaign.tags.map((t: string) => (
                <span key={t} className="bg-secondary px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Expandable ops list */}
        {campaign.ops?.length > 0 && (
          <div>
            <button onClick={() => setExpanded(!expanded)} className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {campaign.ops_count} Linked Op{campaign.ops_count !== 1 ? "s" : ""}
            </button>
            {expanded && (
              <div className="mt-2 space-y-1">
                {campaign.ops.map((op: any) => (
                  <div key={op.id} className="flex items-center gap-2 text-xs font-sans text-muted-foreground py-1 border-b border-border/50 last:border-0">
                    <Target className="w-3 h-3 text-primary shrink-0" />
                    <span className="flex-1 truncate text-foreground">{op.name}</span>
                    <span className="capitalize text-muted-foreground">{op.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outcome note */}
        {campaign.outcome_note && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-sans text-muted-foreground italic">"{campaign.outcome_note}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignModal({ group, campaign, availableOps, onSave, onClose }: {
  group: any; campaign: any | null; availableOps: any[]; onSave: (data: any) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: campaign?.name || "",
    description: campaign?.description || "",
    objective: campaign?.objective || "",
    banner_url: campaign?.banner_url || "",
    status: campaign?.status || "active",
    start_date: campaign?.start_date || "",
    end_date: campaign?.end_date || "",
    outcome: campaign?.outcome || "",
    outcome_note: campaign?.outcome_note || "",
    tags: campaign?.tags?.join(", ") || "",
    op_ids: campaign?.op_ids || [],
  });
  const [saving, setSaving] = useState(false);

  const toggleOp = (opId: string) => {
    setForm(f => ({
      ...f,
      op_ids: f.op_ids.includes(opId) ? f.op_ids.filter((id: string) => id !== opId) : [...f.op_ids, opId],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      group_id: group.id,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-display font-black uppercase tracking-wider text-foreground">
            {campaign ? "Edit Campaign" : "New Campaign"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Campaign Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="mf-input w-full" placeholder="Operation Thunderstorm" />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Objective</label>
            <input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
              className="mf-input w-full" placeholder="Secure the northern corridor..." />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="mf-input w-full min-h-[80px] resize-y" placeholder="Full campaign brief..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="mf-input w-full">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Outcome</label>
              <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                className="mf-input w-full">
                <option value="">— Not set —</option>
                {OUTCOME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="mf-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="mf-input w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Outcome Note</label>
            <input value={form.outcome_note} onChange={e => setForm(f => ({ ...f, outcome_note: e.target.value }))}
              className="mf-input w-full" placeholder="A decisive victory achieved through..." />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Banner Image URL</label>
            <input value={form.banner_url} onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))}
              className="mf-input w-full" placeholder="https://..." />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Tags (comma separated)</label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="mf-input w-full" placeholder="arma3, combined-arms, summer-2025" />
          </div>

          {/* Link ops */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">
              <Link2 className="w-3 h-3 inline mr-1" /> Link Ops ({form.op_ids.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {availableOps.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground font-sans text-center">No ops found — create some in the Live Ops tab first</p>
              ) : availableOps.map((op: any) => (
                <label key={op.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 cursor-pointer">
                  <input type="checkbox" checked={form.op_ids.includes(op.id)} onChange={() => toggleOp(op.id)}
                    className="rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-foreground truncate">{op.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{op.status} · {op.event_type || op.game || ""}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2 border border-border rounded text-sm font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.name.trim()}
            className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-wider text-sm rounded transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {campaign ? "Save Changes" : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignsTab({ group }: any) {
  const { toast } = useToast();
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [availableOps, setAvailableOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; campaign: any | null }>({ open: false, campaign: null });

  const load = async () => {
    setLoading(true);
    try {
      // Check pro
      const proRes = await fetch(`${PRO_STATUS_URL_MANAGE}?group_id=${group.id}`);
      const proData = await proRes.json();
      setIsPro(proData.is_pro);
      if (!proData.is_pro) { setLoading(false); return; }

      // Load campaigns + ops in parallel
      const [campRes, opsRes] = await Promise.all([
        fetch(`${CAMPAIGNS_URL}?path=list&group_id=${group.id}`),
        fetch(`${CAMPAIGNS_URL}?path=ops&group_id=${group.id}`),
      ]);
      if (campRes.ok) setCampaigns(await campRes.json());
      if (opsRes.ok) setAvailableOps(await opsRes.json());
    } catch { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [group.id]);

  const handleSave = async (data: any) => {
    try {
      const isEdit = !!modal.campaign;
      const res = await fetch(
        isEdit
          ? `${CAMPAIGNS_URL}?path=update&id=${modal.campaign.id}`
          : `${CAMPAIGNS_URL}?path=create`,
        { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast({ title: isEdit ? "Campaign updated" : "Campaign created" });
      setModal({ open: false, campaign: null });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (campaign: any) => {
    if (!confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`${CAMPAIGNS_URL}?path=delete&id=${campaign.id}`, { method: "DELETE" });
      toast({ title: "Campaign deleted" });
      load();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isPro) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-6">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center">
        <Crown className="w-8 h-8 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-display font-black text-2xl uppercase tracking-wider text-foreground mb-2">Commander Pro Required</h3>
        <p className="text-muted-foreground font-sans leading-relaxed">
          Campaigns let you group ops into named series with full progression tracking, win rates, attendance analytics, outcome notes and banners. Upgrade to unlock.
        </p>
      </div>
      <a href="/commander-pro"
        className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-sm px-8 py-3 rounded transition-all shadow-[0_0_20px_hsla(48,96%,53%,0.3)]"
      >
        <Crown className="w-4 h-4" /> Upgrade to Pro — £10/mo
      </a>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-display font-bold uppercase tracking-wider text-foreground">Campaigns</h2>
            <p className="text-xs font-sans text-muted-foreground">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} · link ops into series and track progression</p>
          </div>
          <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
            <Crown className="w-3 h-3" /> Pro
          </span>
        </div>
        <button onClick={() => setModal({ open: true, campaign: null })}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-black font-display font-black uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Summary stats */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Campaigns", value: campaigns.length },
            { label: "Active", value: campaigns.filter(c => c.status === "active").length, color: "text-green-400" },
            { label: "Total Ops Linked", value: campaigns.reduce((a, c) => a + c.ops_count, 0), color: "text-primary" },
            { label: "Avg Win Rate", value: (() => { const wrs = campaigns.filter(c => c.win_rate !== null); return wrs.length ? `${Math.round(wrs.reduce((a, c) => a + c.win_rate, 0) / wrs.length)}%` : "—"; })(), color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
              <p className={`font-display font-black text-2xl ${s.color || "text-foreground"}`}>{s.value}</p>
              <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Campaign cards */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <Flag className="w-12 h-12 text-muted-foreground/30" />
          <div>
            <p className="font-display font-bold uppercase tracking-wider text-foreground mb-1">No Campaigns Yet</p>
            <p className="text-sm text-muted-foreground font-sans">Group your ops into named campaigns. Track win rates, attendance, and progression across op series.</p>
          </div>
          <button onClick={() => setModal({ open: true, campaign: null })}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-black font-display font-black uppercase tracking-wider text-sm px-6 py-2.5 rounded transition-all">
            <Plus className="w-4 h-4" /> Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c}
              onEdit={() => setModal({ open: true, campaign: c })}
              onDelete={() => handleDelete(c)} />
          ))}
        </div>
      )}

      {modal.open && (
        <CampaignModal
          group={group}
          campaign={modal.campaign}
          availableOps={availableOps}
          onSave={handleSave}
          onClose={() => setModal({ open: false, campaign: null })}
        />
      )}
    </div>
  );
}

// ─── Recruit Pipeline (Pro) ───────────────────────────────────────────────────
const PIPELINE_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/milsimApplications";

const PIPELINE_COLUMNS = [
  { id: "pending", label: "Applied", color: "border-yellow-500/40 bg-yellow-500/5", dot: "bg-yellow-400" },
  { id: "reviewing", label: "Reviewing", color: "border-blue-500/40 bg-blue-500/5", dot: "bg-blue-400" },
  { id: "interview", label: "Interview", color: "border-purple-500/40 bg-purple-500/5", dot: "bg-purple-400" },
  { id: "approved", label: "Accepted", color: "border-green-500/40 bg-green-500/5", dot: "bg-green-400" },
  { id: "rejected", label: "Rejected", color: "border-red-500/40 bg-red-500/5", dot: "bg-red-400" },
];

function RecruitPipelineTab({ group, showMsg }: any) {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [moving, setMoving] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetch(`${PRO_STATUS_URL_MANAGE}?group_id=${group.id}`)
      .then(r => r.json())
      .then(s => {
        setIsPro(s.is_pro);
        if (s.is_pro) loadApps();
        else setLoading(false);
      })
      .catch(() => { setIsPro(false); setLoading(false); });
  }, [group.id]);

  const loadApps = () => {
    const token = localStorage.getItem("tag_auth_token") ?? "";
    fetch(`${PIPELINE_URL}?path=${encodeURIComponent(`/${group.id}/applications`)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setApps(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const moveApp = async (app: any, newStatus: string, note?: string) => {
    setMoving(true);
    const token = localStorage.getItem("tag_auth_token") ?? "";
    try {
      await fetch(`${PIPELINE_URL}?path=${encodeURIComponent(`/${group.id}/applications/${app.id}`)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reviewNote: note ?? reviewNote }),
      });
      const updated = { ...app, status: newStatus, review_note: note ?? reviewNote };
      setApps(prev => prev.map(a => a.id === app.id ? updated : a));
      if (selected?.id === app.id) setSelected(updated);
      showMsg(true, `${app.applicant_username} moved to ${PIPELINE_COLUMNS.find(c => c.id === newStatus)?.label ?? newStatus}`);
      setReviewNote("");
    } catch { showMsg(false, "Failed to update status"); }
    setMoving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isPro) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-6">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center">
        <Crown className="w-8 h-8 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-display font-black text-2xl uppercase tracking-wider text-foreground mb-2">Commander Pro Required</h3>
        <p className="text-muted-foreground font-sans leading-relaxed">
          The Recruitment Pipeline is a Pro feature. Track applicants from applied → reviewing → interview → accepted with full notes and history.
        </p>
      </div>
      <a href="/commander-pro"
        className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-sm px-8 py-3 rounded transition-all shadow-[0_0_20px_hsla(48,96%,53%,0.3)]">
        <Crown className="w-4 h-4" /> Upgrade to Pro — £10/mo
      </a>
    </div>
  );

  const byStatus = (status: string) => apps.filter(a => a.status === status);
  const total = apps.length;
  const pending = byStatus("pending").length;

  const filteredApps = apps.filter(a => {
    const matchSearch = !searchQuery || a.applicant_username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const conversionRate = total > 0 ? Math.round((byStatus("approved").length / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-display font-bold uppercase tracking-wider text-foreground">Recruitment Pipeline</h2>
            <p className="text-xs font-sans text-muted-foreground">{total} applicant{total !== 1 ? "s" : ""} · {conversionRate}% acceptance rate{pending > 0 ? ` · ${pending} awaiting review` : ""}</p>
          </div>
          <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
            <Crown className="w-3 h-3" /> Pro
          </span>
        </div>
        {pending > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded animate-pulse">
            <Bell className="w-3 h-3" /> {pending} new
          </span>
        )}
      </div>

      {/* Search + filter bar */}
      {total > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search applicants..."
            className="bg-secondary border border-border rounded px-3 py-1.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-48"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-secondary border border-border rounded px-3 py-1.5 text-sm font-sans text-foreground focus:outline-none focus:border-primary/50">
            <option value="all">All Stages</option>
            {PIPELINE_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label} ({byStatus(c.id).length})</option>)}
          </select>
        </div>
      )}

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <UserCheck className="w-12 h-12 text-muted-foreground/30" />
          <div>
            <p className="font-display font-bold uppercase tracking-wider text-foreground mb-1">No Applications Yet</p>
            <p className="text-sm text-muted-foreground font-sans">Applicants will appear here when they apply to join your unit.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {PIPELINE_COLUMNS.map(col => {
            const colApps = filteredApps.filter(a => a.status === col.id);
            return (
              <div key={col.id} className={`rounded-lg border p-3 ${col.color} min-h-[200px]`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="font-display font-bold uppercase tracking-wider text-xs text-foreground">{col.label}</span>
                  <span className="ml-auto text-xs font-display font-bold text-muted-foreground">{byStatus(col.id).length}</span>
                </div>
                <div className="space-y-2">
                  {colApps.map(app => (
                    <button key={app.id} onClick={() => { setSelected(app); setReviewNote(app.review_note ?? ""); }}
                      className="w-full text-left bg-card border border-border rounded p-3 hover:border-primary/50 transition-all group">
                      <p className="font-display font-bold text-sm text-foreground">{app.applicant_username}</p>
                      <p className="text-[10px] font-sans text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {app.created_date ? new Date(app.created_date).toLocaleDateString("en-GB") : "—"}
                      </p>
                      {app.review_note && <p className="text-[10px] font-sans text-muted-foreground mt-1 truncate italic">"{app.review_note}"</p>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applicant detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-black text-xl uppercase tracking-wider text-foreground">{selected.applicant_username}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    PIPELINE_COLUMNS.find(c => c.id === selected.status)?.color ?? "border-border"
                  } ${PIPELINE_COLUMNS.find(c => c.id === selected.status)?.dot.replace("bg-","text-") ?? "text-muted-foreground"}`}>
                    {PIPELINE_COLUMNS.find(c => c.id === selected.status)?.label ?? selected.status}
                  </span>
                  <p className="text-xs font-sans text-muted-foreground">Applied {selected.created_date ? new Date(selected.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {/* Answers */}
            {selected.answers && (Array.isArray(selected.answers) ? selected.answers.length > 0 : Object.keys(selected.answers).length > 0) && (
              <div className="space-y-3">
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Application Answers</p>
                {Array.isArray(selected.answers)
                  ? selected.answers.map((item: any, i: number) => (
                    <div key={i} className="bg-secondary/30 rounded p-3 border border-border">
                      <p className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.question}</p>
                      <p className="text-sm font-sans text-foreground leading-relaxed">{item.answer || <span className="italic text-muted-foreground">No answer provided</span>}</p>
                    </div>
                  ))
                  : Object.entries(selected.answers).map(([q, a]: any) => (
                    <div key={q} className="bg-secondary/30 rounded p-3 border border-border">
                      <p className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1">{q}</p>
                      <p className="text-sm font-sans text-foreground leading-relaxed">{a}</p>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Review note */}
            <div className="space-y-2">
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Internal Review Note</p>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Add internal notes about this applicant (not visible to them)..."
                rows={3}
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            {/* Stage actions */}
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Move to Stage</p>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_COLUMNS.filter(c => c.id !== selected.status).map(col => (
                  <button key={col.id} disabled={moving} onClick={() => moveApp(selected, col.id)}
                    className={`text-xs font-display font-bold uppercase tracking-wider px-3 py-1.5 rounded border transition-all disabled:opacity-50 ${col.color} ${col.dot.replace("bg-","text-")}`}>
                    → {col.label}
                  </button>
                ))}
              </div>
              {reviewNote !== (selected.review_note ?? "") && (
                <button disabled={moving} onClick={() => moveApp(selected, selected.status, reviewNote)}
                  className="text-xs font-display font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 transition-all disabled:opacity-50">
                  Save Note Only
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Unit Legacy ──────────────────────────────────────────────────────────────
function UnitLegacyTab({ group }: any) {
  const [ops, setOps] = useState<any[]>([]);
  const [aars, setAars] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const token = localStorage.getItem("tag_auth_token") ?? "";

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch<any[]>(`/api/milsim-groups/${group.id}/ops`).catch(() => []),
      apiFetch<any[]>(`/api/milsim-groups/${group.id}/aars`).catch(() => []),
      fetch(`${CAMPAIGNS_URL}?path=list&group_id=${group.id}`, { headers }).then(r => r.json()).catch(() => []),
      apiFetch<any>(`/getProStatus?group_id=${group.id}`).catch(() => ({ is_pro: false })),
    ]).then(([o, a, c, proStatus]) => {
      setOps(Array.isArray(o) ? o : []);
      setAars(Array.isArray(a) ? a : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setIsPro(!!proStatus?.is_pro);
      setLoading(false);
    });
  }, [group.id]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isPro) return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <Archive className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="font-display font-black uppercase tracking-widest text-lg text-foreground">Unit Legacy</h3>
        <p className="text-sm font-sans text-muted-foreground mt-2">
          The full timeline of your unit's history — ops, campaigns, AARs, and ribbons — is a <strong className="text-foreground">Commander Pro</strong> feature.
        </p>
      </div>
      <a href="/commander-pro"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-primary/40 bg-primary/10 text-primary text-xs font-display font-bold uppercase tracking-widest hover:bg-primary/20 transition-all">
        <Zap className="w-3.5 h-3.5" />
        Upgrade to Commander Pro
      </a>
    </div>
  );

  type LegacyEntryType = "op" | "aar" | "campaign";
  type LegacyEntry = {
    date: string; type: LegacyEntryType; id: string;
    title: string; game?: string; eventType?: string; status?: string;
    outcome?: string; author?: string; participants?: number;
    campaignId?: string; opCount?: number;
  };

  const allEntries: LegacyEntry[] = [
    ...ops.filter(o => o.scheduled_at).map(o => ({
      date: o.scheduled_at, type: "op" as const, id: o.id,
      title: o.name, game: o.game, eventType: o.event_type, status: o.status,
      campaignId: (campaigns.find((c: any) => (c.op_ids || []).includes(o.id)) || {}).id,
    })),
    ...aars.filter(a => a.op_date || a.created_date).map(a => ({
      date: a.op_date || a.created_date, type: "aar" as const, id: a.id,
      title: a.title || a.op_name || "AAR",
      outcome: a.outcome, author: a.author_username,
      participants: Array.isArray(a.participants) ? a.participants.length : undefined,
    })),
    ...campaigns.filter(c => c.start_date).map(c => ({
      date: c.start_date, type: "campaign" as const, id: c.id,
      title: c.name, outcome: c.outcome, status: c.status,
      opCount: (c.op_ids || []).length,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const legacyTypeStyle: Record<LegacyEntryType, { dot: string; card: string; label: string; icon: typeof Archive }> = {
    op:       { dot: "bg-primary border-primary/60",        card: "border-primary/20 bg-primary/5",       label: "text-primary",    icon: Siren        },
    aar:      { dot: "bg-green-500 border-green-400/60",    card: "border-green-500/20 bg-green-500/5",   label: "text-green-400",  icon: ClipboardList },
    campaign: { dot: "bg-yellow-400 border-yellow-300/60",  card: "border-yellow-500/20 bg-yellow-500/5", label: "text-yellow-400", icon: Zap           },
  };

  const legacyByYear: Record<number, LegacyEntry[]> = {};
  allEntries.forEach(e => {
    const y = new Date(e.date).getFullYear();
    if (!legacyByYear[y]) legacyByYear[y] = [];
    legacyByYear[y].push(e);
  });
  const legacyYears = Object.keys(legacyByYear).map(Number).sort((a, b) => b - a);

  const firstOpDate = ops.length > 0 ? ops.reduce((e: string | null, o) => (!e || new Date(o.scheduled_at) < new Date(e)) ? o.scheduled_at : e, null) : null;
  const victories = campaigns.filter(c => c.outcome === "victory").length;
  const yearsActive = firstOpDate ? new Date().getFullYear() - new Date(firstOpDate).getFullYear() + 1 : 0;

  const legacyOutcomeBadge = (outcome?: string) => {
    if (!outcome) return null;
    const map: Record<string, string> = { victory: "bg-green-500/20 text-green-400 border-green-500/30", defeat: "bg-red-500/20 text-red-400 border-red-500/30", draw: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    return map[outcome] ? <span className={`text-[9px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${map[outcome]}`}>{outcome}</span> : null;
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-secondary border border-border rounded flex items-center justify-center">
          <Archive className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <h2 className="font-display font-bold uppercase tracking-wider text-foreground">Unit Legacy</h2>
          <p className="text-xs font-sans text-muted-foreground">The permanent record of {group.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Ops",    value: ops.length,         color: "text-primary"    },
          { label: "AARs Filed",   value: aars.length,        color: "text-green-400"  },
          { label: "Campaigns",    value: campaigns.length,   color: "text-yellow-400" },
          { label: "Victories",    value: victories,          color: "text-green-400"  },
          { label: "Years Active", value: yearsActive || "—", color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <p className={`font-display font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {campaigns.length > 0 && (
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Campaign Ribbons</p>
          <div className="flex flex-wrap gap-2">
            {campaigns.map((c: any) => {
              const outcome = c.outcome || "incomplete";
              const col = outcome === "victory" ? "from-green-600 to-green-800 border-green-500/40" :
                          outcome === "defeat" ? "from-red-700 to-red-900 border-red-500/40" :
                          outcome === "draw" ? "from-yellow-600 to-yellow-800 border-yellow-500/40" :
                          "from-zinc-700 to-zinc-900 border-zinc-500/40";
              return (
                <div key={c.id} className={`bg-gradient-to-b ${col} border rounded px-3 py-1.5 text-center min-w-[70px]`}>
                  <p className="text-[10px] font-display font-black uppercase tracking-wider text-white leading-tight">{c.name}</p>
                  <p className="text-[8px] font-sans text-white/60 mt-0.5">{outcome.toUpperCase()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Archive className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-sans">No ops, AARs, or campaigns logged yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {legacyYears.map(year => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="font-display font-black text-xs uppercase tracking-widest text-muted-foreground px-3 py-1 bg-secondary border border-border rounded">{year}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="relative pl-6 border-l-2 border-border space-y-3">
                {legacyByYear[year].map((e, i) => {
                  const s = legacyTypeStyle[e.type];
                  const Icon = s.icon;
                  const dateStr = new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                  return (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[29px] w-4 h-4 rounded-full border-2 ${s.dot} flex items-center justify-center`}>
                        <Icon className="w-2 h-2 text-background" />
                      </div>
                      <div className={`rounded-lg border p-3 ml-1 ${s.card}`}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[9px] font-display font-bold uppercase tracking-widest shrink-0 ${s.label}`}>
                              {e.type === "op" ? "OP" : e.type === "aar" ? "AAR" : "CAMPAIGN"}
                            </span>
                            <p className="font-display font-bold text-sm text-foreground truncate">{e.title}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {legacyOutcomeBadge(e.outcome)}
                            <span className="text-[10px] font-sans text-muted-foreground">{dateStr}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {e.game && <span className="text-[10px] font-sans text-muted-foreground">{e.game}</span>}
                          {e.eventType && <span className="text-[10px] font-sans text-muted-foreground">· {e.eventType}</span>}
                          {e.author && <span className="text-[10px] font-sans text-muted-foreground">By {e.author}</span>}
                          {e.participants !== undefined && <span className="text-[10px] font-sans text-muted-foreground">· {e.participants} participants</span>}
                          {e.opCount !== undefined && <span className="text-[10px] font-sans text-muted-foreground">· {e.opCount} ops</span>}
                          {e.campaignId && <span className="text-[9px] font-display uppercase tracking-wider text-yellow-400/70">· {(campaigns.find((c: any) => c.id === e.campaignId) || {}).name}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Developer / API & Webhooks Tab ──────────────────────────────────────────
const API_KEYS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/milsimApiKeys";

function DeveloperTab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success"|"error") => void }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("Default");
  const [freshKey, setFreshKey] = useState<{ raw_key: string; webhook_secret: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const token = localStorage.getItem("tag_auth_token") ?? "";

  const copy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    Promise.all([
      fetch(`${PRO_STATUS_URL_MANAGE}?group_id=${group.id}`).then(r => r.json()).catch(() => ({ is_pro: false })),
      fetch(`${API_KEYS_URL}?path=%2Fkeys&group_id=${group.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
    ]).then(([proStatus, keyList]) => {
      setIsPro(!!proStatus?.is_pro);
      setKeys(Array.isArray(keyList) ? keyList : []);
      setLoading(false);
    });
  }, [group.id]);

  const generateKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_KEYS_URL}?path=%2Fgenerate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: group.id, label: newKeyLabel || "Default" }),
      });
      const data = await res.json();
      if (data.error) { showMsg(data.error, "error"); setGenerating(false); return; }
      setFreshKey({ raw_key: data.raw_key, webhook_secret: data.webhook_secret });
      setKeys(prev => [...prev, { id: Date.now(), key_prefix: data.prefix, label: data.label, is_active: true, last_used_at: null, created_date: new Date().toISOString() }]);
      setNewKeyLabel("Default");
    } catch { showMsg("Failed to generate key", "error"); }
    setGenerating(false);
  };

  const revokeKey = async (keyId: string, label: string) => {
    if (!confirm(`Revoke key "${label}"? Any integrations using it will stop working immediately.`)) return;
    try {
      await fetch(`${API_KEYS_URL}?path=%2Frevoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ key_id: keyId }),
      });
      setKeys(prev => prev.map(k => k.id === keyId ? { ...k, is_active: false } : k));
      showMsg(`Key "${label}" revoked`, "success");
    } catch { showMsg("Failed to revoke key", "error"); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isPro) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-6">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center">
        <Crown className="w-8 h-8 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-display font-black text-2xl uppercase tracking-wider text-foreground mb-2">Commander Pro Required</h3>
        <p className="text-muted-foreground font-sans leading-relaxed">
          API access and webhook integration are Pro features. Connect your unit's Discord bot, sync rosters to external tools, or build custom dashboards.
        </p>
      </div>
      <a href="/commander-pro"
        className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-sm px-8 py-3 rounded transition-all shadow-[0_0_20px_hsla(48,96%,53%,0.3)]">
        <Crown className="w-4 h-4" /> Upgrade to Pro — £10/mo
      </a>
    </div>
  );

  const BASE_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions";

  const endpoints = [
    { method: "GET",  path: "/milsimGroups?path=%2F{group_id}%2Ffull",        label: "Get full group data (roster, roles, ranks)" },
    { method: "GET",  path: "/milsimGroups?path=%2F{group_id}%2Fops",         label: "List all ops for group" },
    { method: "GET",  path: "/milsimGroups?path=%2F{group_id}%2Faars",        label: "List all AARs" },
    { method: "POST", path: "/milsimApiKeys?path=%2Fverify",                  label: "Verify an API key" },
    { method: "GET",  path: "/milsimApplications?path=%2F{group_id}%2Fapplications", label: "List applications (pipeline)" },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <h2 className="font-display font-bold uppercase tracking-wider text-foreground">API & Webhooks</h2>
          <p className="text-xs font-sans text-muted-foreground">Connect external tools, Discord bots, and custom dashboards to your unit.</p>
        </div>
        <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
          <Crown className="w-3 h-3" /> Pro
        </span>
      </div>

      {/* Fresh key reveal — shown once after generation */}
      {freshKey && (
        <div className="border-2 border-yellow-500/60 bg-yellow-500/5 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold uppercase tracking-wider text-yellow-400">Save these now — they won't be shown again</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">Store them securely. Once you close this, neither value can be recovered.</p>
            </div>
          </div>
          <div className="space-y-3">
            {[{ label: "API Key", val: freshKey.raw_key, id: "apikey" }, { label: "Webhook Secret", val: freshKey.webhook_secret, id: "secret" }].map(item => (
              <div key={item.id}>
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/40 border border-border rounded px-3 py-2 text-xs font-mono text-green-400 truncate">{item.val}</code>
                  <button onClick={() => copy(item.val, item.id)}
                    className="shrink-0 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider border border-border rounded hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all">
                    {copied === item.id ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setFreshKey(null)} className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            I've saved these — dismiss
          </button>
        </div>
      )}

      {/* Active keys */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">API Keys ({keys.filter(k => k.is_active).length}/3 active)</p>
        </div>
        {keys.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-8 text-center">
            <GitBranch className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-display uppercase tracking-widest text-muted-foreground">No API keys yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${k.is_active ? "border-border bg-card" : "border-border/40 bg-secondary/20 opacity-50"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-foreground">{k.label}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${k.is_active ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-muted-foreground border-border"}`}>
                      {k.is_active ? "Active" : "Revoked"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <code className="text-[10px] font-mono text-muted-foreground">{k.key_prefix}</code>
                    {k.last_used_at && <span className="text-[10px] text-muted-foreground">Last used {new Date(k.last_used_at).toLocaleDateString("en-GB")}</span>}
                    {!k.last_used_at && <span className="text-[10px] text-muted-foreground">Never used</span>}
                    <span className="text-[10px] text-muted-foreground">Created {new Date(k.created_date).toLocaleDateString("en-GB")}</span>
                  </div>
                </div>
                {k.is_active && (
                  <button onClick={() => revokeKey(k.id, k.label)}
                    className="text-[10px] font-display font-bold uppercase tracking-wider text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1 rounded transition-all">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Generate new key */}
        {keys.filter(k => k.is_active).length < 3 && (
          <div className="flex items-center gap-2 pt-1">
            <input value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)}
              placeholder="Key label (e.g. Discord Bot)"
              className="bg-secondary border border-border rounded px-3 py-1.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 flex-1 max-w-xs"
            />
            <button onClick={generateKey} disabled={generating}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors disabled:opacity-50">
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Generate Key
            </button>
          </div>
        )}
      </div>

      {/* API Reference */}
      <div className="space-y-3">
        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">API Reference</p>
        <div className="bg-secondary/30 border border-border rounded-lg p-4 space-y-1.5">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Authentication</p>
          <code className="block text-xs font-mono text-green-400 bg-black/30 rounded px-3 py-2">Authorization: Bearer YOUR_API_KEY</code>
        </div>
        <div className="space-y-2">
          {endpoints.map((ep, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
              <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 mt-0.5 ${ep.method === "GET" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                {ep.method}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans text-muted-foreground">{ep.label}</p>
                <code className="text-[10px] font-mono text-foreground/70 truncate block">{BASE_URL}{ep.path}</code>
              </div>
              <button onClick={() => copy(`${BASE_URL}${ep.path}`, `ep${i}`)}
                className="text-[10px] text-muted-foreground hover:text-foreground shrink-0">
                {copied === `ep${i}` ? "✓" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Webhook Endpoints ─────────────────────────────────────────────── */}
      <WebhookEndpointsSection group={group} showMsg={showMsg} token={token} />
    </div>
  );
}

// ─── All supported events ────────────────────────────────────────────────────
const ALL_WEBHOOK_EVENTS = [
  { id: "application.submitted", label: "Application Submitted", cat: "Applications" },
  { id: "application.approved",  label: "Application Approved",  cat: "Applications" },
  { id: "application.rejected",  label: "Application Rejected",  cat: "Applications" },
  { id: "roster.member_joined",  label: "Member Joined Roster",  cat: "Roster" },
  { id: "roster.member_left",    label: "Member Left Roster",    cat: "Roster" },
  { id: "roster.rank_changed",   label: "Rank Changed",          cat: "Roster" },
  { id: "roster.status_changed", label: "Member Status Changed", cat: "Roster" },
  { id: "op.created",            label: "Op Created",            cat: "Ops" },
  { id: "op.status_changed",     label: "Op Status Changed",     cat: "Ops" },
  { id: "op.completed",          label: "Op Completed",          cat: "Ops" },
  { id: "aar.posted",            label: "AAR Posted",            cat: "AARs" },
  { id: "loa.submitted",         label: "LOA Submitted",         cat: "LOA" },
  { id: "loa.approved",          label: "LOA Approved",          cat: "LOA" },
  { id: "loa.expired",           label: "LOA Expired",           cat: "LOA" },
  { id: "award.granted",         label: "Award Granted",         cat: "Awards" },
  { id: "briefing.published",    label: "Briefing Published",    cat: "Briefings" },
];

const WEBHOOKS_BASE = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/webhooks";

function WebhookEndpointsSection({ group, showMsg, token }: { group: any; showMsg: (m: string, t?: "success"|"error") => void; token: string }) {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [freshSecret, setFreshSecret] = useState<{ id: string; secret: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const load = () => {
    fetch(`${WEBHOOKS_BASE}?path=%2Fendpoints&group_id=${group.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setEndpoints(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [group.id]);

  const addEndpoint = async () => {
    if (!newUrl.trim()) { showMsg("URL required", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${WEBHOOKS_BASE}?path=%2Fendpoints`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: group.id, label: newLabel || "My Endpoint", webhook_url: newUrl, events: newEvents }),
      });
      const data = await res.json();
      if (data.error) { showMsg(data.error, "error"); setSaving(false); return; }
      setFreshSecret({ id: data.id, secret: data.secret });
      setShowAdd(false);
      setNewUrl(""); setNewLabel(""); setNewEvents([]);
      load();
    } catch { showMsg("Failed to add endpoint", "error"); }
    setSaving(false);
  };

  const removeEndpoint = async (id: string, label: string) => {
    if (!confirm(`Remove webhook "${label}"?`)) return;
    await fetch(`${WEBHOOKS_BASE}?path=%2Fendpoints%2F${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setEndpoints(prev => prev.filter(e => e.id !== id));
    showMsg("Webhook removed", "success");
  };

  const testEndpoint = async (id: string) => {
    setTesting(id);
    try {
      const res = await fetch(`${WEBHOOKS_BASE}?path=%2Ftest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint_id: id }),
      });
      const data = await res.json();
      if (data.ok) showMsg(`Test ping delivered (HTTP ${data.status})`, "success");
      else showMsg(`Test failed: ${data.error || `HTTP ${data.status}`}`, "error");
      load();
    } catch { showMsg("Test request failed", "error"); }
    setTesting(null);
  };

  const toggleEvent = (ev: string) => {
    setNewEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  };

  const catGroups = ALL_WEBHOOK_EVENTS.reduce((acc, ev) => {
    (acc[ev.cat] = acc[ev.cat] || []).push(ev);
    return acc;
  }, {} as Record<string, typeof ALL_WEBHOOK_EVENTS>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">
          Webhook Endpoints ({endpoints.filter(e => e.is_active).length}/5)
        </p>
        {!showAdd && endpoints.filter(e => e.is_active).length < 5 && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded transition-all">
            <Plus className="w-3 h-3" /> Add Endpoint
          </button>
        )}
      </div>

      {/* Fresh secret reveal */}
      {freshSecret && (
        <div className="border-2 border-yellow-500/60 bg-yellow-500/5 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs font-display font-bold uppercase tracking-wider text-yellow-400">Save your signing secret — shown once only</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/40 border border-border rounded px-3 py-2 text-xs font-mono text-green-400 truncate">{freshSecret.secret}</code>
            <button onClick={() => copy(freshSecret.secret, "whsec")}
              className="shrink-0 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider border border-border rounded hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all">
              {copied === "whsec" ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <button onClick={() => setFreshSecret(null)} className="text-[10px] font-display uppercase tracking-wider text-muted-foreground hover:text-foreground">I've saved it — dismiss</button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-4">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-primary">New Webhook Endpoint</p>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-1">Label</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Discord Ops Bot"
                className="w-full bg-secondary border border-border rounded px-3 py-1.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-1">Endpoint URL *</label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://your-server.com/webhook"
                className="w-full bg-secondary border border-border rounded px-3 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>

            <div>
              <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                Events to subscribe ({newEvents.length === 0 ? "all events" : `${newEvents.length} selected`})
              </label>
              <div className="space-y-3">
                {Object.entries(catGroups).map(([cat, evs]) => (
                  <div key={cat}>
                    <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {evs.map(ev => (
                        <button key={ev.id} onClick={() => toggleEvent(ev.id)}
                          className={`text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-all ${newEvents.includes(ev.id) ? "border-primary/60 bg-primary/20 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-border/80"}`}>
                          {ev.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/60 mt-2">Leave none selected to receive all events.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={addEndpoint} disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Register Endpoint
            </button>
            <button onClick={() => { setShowAdd(false); setNewUrl(""); setNewLabel(""); setNewEvents([]); }}
              className="px-4 py-1.5 text-xs font-display uppercase tracking-widest text-muted-foreground border border-border rounded hover:text-foreground transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Endpoint list */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : endpoints.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-center">
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">No webhook endpoints yet</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Add one above to start receiving real-time events.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {endpoints.map(ep => {
            const failRate = ep.delivery_count > 0 ? Math.round((ep.failure_count / ep.delivery_count) * 100) : 0;
            const healthColor = failRate === 0 ? "text-green-400 border-green-500/30 bg-green-500/10"
              : failRate < 20 ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
              : "text-red-400 border-red-500/30 bg-red-500/10";
            return (
              <div key={ep.id} className="border border-border bg-card rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-foreground">{ep.label || "Endpoint"}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${ep.is_active ? healthColor : "text-muted-foreground border-border"}`}>
                        {ep.is_active ? (failRate === 0 ? "Healthy" : `${failRate}% fail`) : "Inactive"}
                      </span>
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground truncate block mt-0.5">{ep.url}</code>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => testEndpoint(ep.id)} disabled={testing === ep.id}
                      className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground border border-border px-2 py-1 rounded hover:text-foreground hover:border-border/80 transition-all disabled:opacity-50">
                      {testing === ep.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Test"}
                    </button>
                    <button onClick={() => removeEndpoint(ep.id, ep.label)}
                      className="text-[10px] font-display font-bold uppercase tracking-wider text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 px-2 py-1 rounded transition-all">
                      Remove
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span>{ep.delivery_count} deliveries</span>
                  <span>{ep.failure_count} failures</span>
                  {ep.last_triggered_at && <span>Last fired {new Date(ep.last_triggered_at).toLocaleDateString("en-GB")}</span>}
                  {ep.last_status_code && <span className={ep.last_status_code >= 200 && ep.last_status_code < 300 ? "text-green-400" : "text-red-400"}>HTTP {ep.last_status_code}</span>}
                </div>
                {ep.events && ep.events.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ep.events.map((ev: string) => (
                      <span key={ev} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">{ev}</span>
                    ))}
                  </div>
                )}
                {(!ep.events || ep.events.length === 0) && (
                  <p className="text-[9px] text-muted-foreground/60">Subscribed to all events</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Signing doc */}
      <div className="bg-secondary/30 border border-border rounded-lg p-4 space-y-2 text-xs font-sans text-muted-foreground leading-relaxed">
        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Webhook Payload Format</p>
        <pre className="text-[10px] font-mono text-foreground/70 bg-black/30 rounded p-3 overflow-x-auto">{`{
  "event": "op.created",
  "timestamp": "2026-03-25T22:00:00Z",
  "group_id": "abc123",
  "data": { ... event-specific fields ... }
}`}</pre>
        <p>Verify the <code className="text-foreground bg-black/30 px-1 rounded">X-TAG-Signature</code> header: compute <code className="text-foreground bg-black/30 px-1 rounded">HMAC-SHA256(body, signing_secret)</code> — compare to <code className="text-foreground bg-black/30 px-1 rounded">sha256=...</code>.</p>
      </div>
    </div>
  );
}
