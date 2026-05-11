import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { useLocation } from "wouter";
import {
  Crown, Check, BarChart3, Shield, FileText, Map,
  Award, Users, Loader2, Star, Zap,
  Archive, AlertCircle, Eye, Calendar, Flag, Layers,
  PhoneCall, GitBranch, Radio, UserMinus, Activity,
  ChevronUp, Flame, Megaphone, Heart, Target,
  Brain, ClipboardList, TrendingUp, Package
} from "lucide-react";

const CHECKOUT_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/createProCheckout";
const PRO_STATUS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/getProStatus";

const FREE_FEATURES = [
  "Group registration & public profile",
  "Unlimited roster management",
  "Ranks, roles & ORBAT builder",
  "Applications system (pipeline & questions)",
  "Ops scheduling & RSVPs",
  "After Action Reports (AARs)",
  "WARNOs, LACE, SITREPs, MEDEVAC",
  "Briefings & orders",
  "LOA management",
  "Conduct Reports",
  "Op Intel documents",
  "Awards & Qualifications",
  "Training Docs (5 max)",
  "SOPs, ROE documentation",
  "Loadout Kits & Game Servers",
  "Service Files & Discharges",
  "Public registry listing",
  "Forum & community access",
];

// Grouped by PJHQ section for clarity
const PRO_GROUPS = [
  {
    section: "S2 Intelligence",
    icon: Eye,
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
    features: [
      { icon: Eye,          title: "S2 Intelligence Room",       desc: "Full situational awareness suite: S2 Dashboard, SALUTE Reports, Op Intel documents, and Threat Profile tracking for rival units." },
    ],
  },
  {
    section: "J3 Operations Room",
    icon: Flag,
    color: "text-orange-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
    features: [
      { icon: Calendar, title: "Ops Calendar",     desc: "Full interactive calendar view of all scheduled ops, training, and events. Drag, filter, and plan across your entire unit schedule." },
      { icon: Zap,      title: "Campaign System",  desc: "Group ops into named campaigns with progression tracking, campaign banners, and a fully archived history of every major operation." },
    ],
  },
  {
    section: "J5 Planning",
    icon: Layers,
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    features: [
      { icon: Layers,    title: "Op Planning Room",        desc: "7-phase structured operation planning (Planning → Consolidation) with fill-progress indicators, linked records, and team discussion." },
      { icon: PhoneCall, title: "Comms Plan Generator",    desc: "Auto-generate NATO-formatted comms plans with call signs, frequencies, and encryption codes. Export as classified PDF." },
    ],
  },
  {
    section: "J6 Comms & Info Systems",
    icon: GitBranch,
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
    features: [
      { icon: GitBranch, title: "API & Webhooks",           desc: "Full REST API access with key management, webhook endpoints, and event subscriptions. Build your own integrations against your unit's data." },
      { icon: Radio,     title: "Stream Integration",       desc: "Connect your Twitch or YouTube stream directly to your unit page. Go-live detection with live badge on your registry listing." },
    ],
  },
  {
    section: "J7 Dev & Training",
    icon: Brain,
    color: "text-green-400",
    border: "border-green-500/20",
    bg: "bg-green-500/5",
    features: [
      { icon: FileText,  title: "Unlimited Training Docs",  desc: "Upload without limits. AI-powered document scoring, quality flags, depth analysis, and auto-summaries generated for every doc." },
    ],
  },
  {
    section: "J8 Human Resources",
    icon: Users,
    color: "text-yellow-400",
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/5",
    features: [
      { icon: UserMinus,   title: "Inactivity Purge Assistant",  desc: "Weekly report of members with no activity in 30 days. One-click bulk status update to keep your roster clean and accurate." },
      { icon: Activity,    title: "Engagement Score System",     desc: "Auto-scored member engagement based on ops, AARs, training, and LOA discipline. Red/Amber/Green flagging for at-risk members." },
      { icon: ChevronUp,   title: "Automated Promotion Engine",  desc: "Define promotion rules (min ops, tenure, AAR requirement). System auto-flags eligible members so leadership never misses a promotion." },
      { icon: Flame,       title: "Accountability Tracker",      desc: "Role Fitness Reviews, Performance Improvement Orders, and role-lapsing system. Leadership accountability, automated." },
      { icon: AlertCircle, title: "Smart LOA Alerts",            desc: "Auto-flag when too many members are on LOA before an upcoming op. Never go undermanned again." },
    ],
  },
  {
    section: "J4 Logistics",
    icon: Package,
    color: "text-teal-400",
    border: "border-teal-500/20",
    bg: "bg-teal-500/5",
    features: [
      { icon: ClipboardList, title: "Duty Roster Scheduling", desc: "Advanced rotation planner with assignment scheduling, conflict detection, and automatic member notifications." },
    ],
  },
  {
    section: "Media & Recruitment",
    icon: Megaphone,
    color: "text-pink-400",
    border: "border-pink-500/20",
    bg: "bg-pink-500/5",
    features: [
      { icon: Megaphone,   title: "Auto Recruitment Scheduler",  desc: "Set it and forget it. Automated recurring recruitment posts with custom intervals, banners, Discord links, and game tags. Pro-only automation." },
      { icon: Star,        title: "Featured Registry Listing",   desc: "Your unit is pinned at the top of the registry with a TAG Verified checkmark — the first impression for every recruit browsing for a unit." },
      { icon: Archive,     title: "Unit Legacy & Era Timeline",  desc: "A permanent public record of every op, campaign, and AAR — a visual history your unit can be proud of." },
    ],
  },
  {
    section: "Analytics Hub",
    icon: BarChart3,
    color: "text-indigo-400",
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/5",
    features: [
      { icon: Heart,       title: "Unit Health Dashboard",       desc: "Composite health score across attendance, training, leadership, and morale indicators. Know your unit's true readiness state." },
      { icon: Target,      title: "Readiness Score",             desc: "Operational readiness rating built from active member ratio, recent ops tempo, LOA levels, and conduct metrics." },
      { icon: BarChart3,   title: "Unit Analytics",              desc: "Attendance trends, op frequency, member retention, duty status over time — the full data story of your unit's performance." },
      { icon: TrendingUp,  title: "Member Scores",               desc: "Ranked leaderboard of every member's engagement score. Identify your most committed operators and those falling behind." },
    ],
  },
];

const COMPARISON = [
  { label: "Training docs",         free: "5 max",          pro: "Unlimited + AI scoring" },
  { label: "Operator reputation",   free: "Summary only",   pro: "Full history + export" },
  { label: "Registry placement",    free: "Standard",       pro: "Priority featured + verified badge" },
  { label: "Analytics",             free: "None",           pro: "Full dashboard (4 modules)" },
  { label: "Campaigns",             free: "None",           pro: "Unlimited + timeline" },
  { label: "S2 Intelligence",       free: "None",           pro: "Full suite" },
  { label: "API / Webhooks",        free: "None",           pro: "Full access + key management" },
  { label: "Recruit pipeline",      free: "View only",      pro: "Full Kanban + auto scheduler" },
  { label: "Duty roster planner",   free: "None",           pro: "Advanced scheduling" },
  { label: "Unit legacy page",      free: "None",           pro: "Full timeline + ribbons" },
  { label: "HR automation",         free: "None",           pro: "Promotions, purge, engagement" },
  { label: "Ops Calendar",          free: "None",           pro: "Full calendar view" },
  { label: "Planning Room",         free: "None",           pro: "7-phase structured planning" },
  { label: "Comms Plan",            free: "None",           pro: "NATO format + PDF export" },
  { label: "Stream integration",    free: "None",           pro: "Live badge + auto detect" },
  { label: "Accountability tools",  free: "None",           pro: "PIOs, fitness reviews, role lapsing" },
];

const STATS = [
  { value: "25+", label: "Pro-only features" },
  { value: "£10", label: "Per month, per unit" },
  { value: "Cancel", label: "Anytime, no questions" },
  { value: "Instant", label: "Activation on payment" },
];

export default function CommanderPro() {
  useSEO({ title: "Commander Pro — TAG", description: "Premium command tools for serious milsim unit commanders. Analytics, campaigns, API access and more. From £10/month." });
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [proStatus, setProStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({ title: "🎉 Commander Pro Activated!", description: "Your unit now has access to all Pro features. Welcome to the top tier." });
    }
    if (params.get("cancelled") === "true") {
      toast({ title: "No worries", description: "Your subscription wasn't started. Come back whenever you're ready.", variant: "default" });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setGroupsLoading(true);
    apiFetch<any>("/milsimGroups?path=mine/own")
      .then(data => {
        const group = data && data.id ? data : null;
        const groups = group ? [group] : [];
        setMyGroups(groups);
        if (groups.length === 1) setSelectedGroup(groups[0].id);
        groups.forEach((g: any) => {
          fetch(`${PRO_STATUS_URL}?group_id=${g.id}`)
            .then(r => r.json())
            .then(s => setProStatus(prev => ({ ...prev, [g.id]: s.is_pro })));
        });
      })
      .catch(() => {})
      .finally(() => setGroupsLoading(false));
  }, [isAuthenticated, user]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) { navigate("/portal/login"); return; }
    if (myGroups.length > 1 && !selectedGroup) {
      toast({ title: "Select a unit", description: "Choose which unit to upgrade.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const group = myGroups.find(g => g.id === selectedGroup) || myGroups[0];
      if (!group?.id) {
        toast({ title: "No Unit Found", description: "Register a MilSim unit before upgrading.", variant: "destructive" });
        setLoading(false);
        window.location.href = "/milsim/register";
        return;
      }
      const res = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: group.id, group_name: group.name || "My Unit", user_id: user!.id, username: (user as any).username || user!.full_name || "", email: user!.email, billing }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const monthlyPrice = 10;
  const annualPrice = 99;
  const annualMonthly = (annualPrice / 12).toFixed(2);
  const saving = Math.round(100 - (annualPrice / (monthlyPrice * 12)) * 100);

  const totalPro = PRO_GROUPS.reduce((acc, g) => acc + g.features.length, 0);

  return (
    <MainLayout>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-background to-background" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 40px,hsl(var(--border)) 40px,hsl(var(--border)) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,hsl(var(--border)) 40px,hsl(var(--border)) 41px)`,
        }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded font-display font-bold uppercase tracking-widest text-xs text-yellow-400 mb-8">
              <Crown className="w-3.5 h-3.5" /> Commander Pro
            </div>
            <h1 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tight leading-none text-foreground mb-6">
              More Platform.<br />
              <span className="text-yellow-400">Less Price.</span>
            </h1>
            <p className="font-sans text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
              Everything a serious milsim commander needs — {totalPro}+ Pro-only features across intelligence, planning, HR, analytics, and more — for <span className="text-foreground font-semibold">£10 a month</span>.
            </p>
            <p className="font-sans text-sm text-muted-foreground mb-10">Less than a takeaway. More than the competition.</p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
              {STATS.map((s, i) => (
                <div key={i} className="bg-card/60 border border-border/60 rounded-lg p-4">
                  <div className="font-display font-black text-2xl text-yellow-400">{s.value}</div>
                  <div className="text-xs text-muted-foreground font-sans mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {(["monthly", "annual"] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`px-5 py-2.5 rounded border font-display font-bold uppercase tracking-widest text-xs transition-all ${
                    billing === b ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}>
                  {b === "monthly" ? `Monthly — £${monthlyPrice}/mo` : `Annual — £${annualMonthly}/mo`}
                  {b === "annual" && <span className="ml-1.5 text-green-400">save {saving}%</span>}
                </button>
              ))}
            </div>

            {/* Group selector */}
            {isAuthenticated && myGroups.length > 1 && (
              <div className="mb-6 flex justify-center">
                <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
                  className="bg-card border border-border rounded px-4 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-yellow-500/50">
                  <option value="">Select unit to upgrade…</option>
                  {myGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}{proStatus[g.id] ? " ✓ Pro" : ""}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Already Pro message */}
            {isAuthenticated && myGroups.length > 0 && myGroups.every(g => proStatus[g.id]) && (
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm font-display font-bold uppercase tracking-widest">
                <Check className="w-4 h-4" /> Your unit is already on Commander Pro
              </div>
            )}

            <button onClick={handleSubscribe} disabled={loading || groupsLoading}
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-display font-black uppercase tracking-widest text-sm px-10 py-4 rounded transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              {loading ? "Redirecting…" : `Upgrade to Pro — £${billing === "monthly" ? monthlyPrice : annualPrice}/${billing === "monthly" ? "mo" : "yr"}`}
            </button>
            <p className="text-xs text-muted-foreground mt-3 font-sans">Secure checkout via Stripe · Cancel anytime · Instant activation</p>
          </motion.div>
        </div>
      </section>

      {/* ── PRO FEATURES BY SECTION ── */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight mb-3">What You Get</h2>
            <p className="text-muted-foreground font-sans">Every Pro-gated feature, by section. No vague promises.</p>
          </div>

          <div className="space-y-10">
            {PRO_GROUPS.map((group, gi) => {
              const SectionIcon = group.icon;
              return (
                <motion.div key={gi} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: gi * 0.05 }}>
                  {/* Section header */}
                  <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${group.border}`}>
                    <SectionIcon className={`w-4 h-4 ${group.color}`} />
                    <span className={`font-display font-black uppercase tracking-widest text-xs ${group.color}`}>{group.section}</span>
                    <span className="ml-auto text-[10px] font-display uppercase tracking-widest text-muted-foreground">{group.features.length} feature{group.features.length > 1 ? "s" : ""}</span>
                  </div>

                  {/* Feature cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.features.map((f, fi) => {
                      const FIcon = f.icon;
                      return (
                        <div key={fi} className={`rounded-lg border ${group.border} ${group.bg} p-4 space-y-2`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded flex items-center justify-center ${group.bg} border ${group.border}`}>
                              <FIcon className={`w-3.5 h-3.5 ${group.color}`} />
                            </div>
                            <span className="font-display font-black uppercase tracking-wider text-xs text-foreground">{f.title}</span>
                          </div>
                          <p className="text-xs font-sans text-muted-foreground leading-relaxed">{f.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FREE vs PRO COMPARISON ── */}
      <section className="py-24 border-t border-border/40 bg-card/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight mb-3">Free vs Pro</h2>
            <p className="text-muted-foreground font-sans">Side by side. No tricks.</p>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-secondary/50 border-b border-border">
              <div className="px-4 py-3 font-display font-bold uppercase tracking-widest text-xs text-muted-foreground">Feature</div>
              <div className="px-4 py-3 font-display font-bold uppercase tracking-widest text-xs text-muted-foreground text-center border-l border-border">Free</div>
              <div className="px-4 py-3 font-display font-bold uppercase tracking-widest text-xs text-yellow-400 text-center border-l border-border flex items-center justify-center gap-1.5">
                <Crown className="w-3 h-3" /> Pro
              </div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 border-b border-border/40 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                <div className="px-4 py-3 text-xs font-sans text-foreground">{row.label}</div>
                <div className="px-4 py-3 text-xs font-sans text-muted-foreground text-center border-l border-border/40">{row.free}</div>
                <div className="px-4 py-3 text-xs font-sans text-yellow-400 font-semibold text-center border-l border-border/40 flex items-center justify-center gap-1">
                  <Check className="w-3 h-3 shrink-0" />{row.pro}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE FEATURES ── */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight mb-3">Already Free</h2>
            <p className="text-muted-foreground font-sans">These are included in every TAG unit, no subscription needed.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FREE_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-card/40 border border-border/40 rounded-lg px-4 py-3">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-sm font-sans text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-24 border-t border-border/40 bg-yellow-500/5">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-6" />
          <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight mb-4">Ready to Upgrade?</h2>
          <p className="text-muted-foreground font-sans mb-8">One payment. {totalPro}+ features unlocked. Your unit running at full capacity.</p>
          <button onClick={handleSubscribe} disabled={loading || groupsLoading}
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-display font-black uppercase tracking-widest text-sm px-10 py-4 rounded transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            {loading ? "Redirecting…" : `Upgrade Now — £${billing === "monthly" ? monthlyPrice : annualPrice}/${billing === "monthly" ? "mo" : "yr"}`}
          </button>
          <p className="text-xs text-muted-foreground mt-3 font-sans">Secure checkout via Stripe · Cancel anytime</p>
        </div>
      </section>

    </MainLayout>
  );
}
