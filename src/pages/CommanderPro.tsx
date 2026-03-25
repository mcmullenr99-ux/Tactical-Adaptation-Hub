import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { useLocation } from "wouter";
import {
  Crown, Check, BarChart3, Shield, FileText, Map,
  Award, Users, Bot, Loader2, Star, ChevronRight, Rocket, Globe, Zap,
  Archive, AlertCircle
} from "lucide-react";

const CHECKOUT_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/createProCheckout";
const PRO_STATUS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/getProStatus";

const FREE_FEATURES = [
  "Group registration & public profile",
  "Unlimited roster management",
  "Ranks, roles & ORBAT builder",
  "Applications system",
  "Ops scheduling & RSVPs",
  "After Action Reports",
  "LOA management",
  "Briefings & orders",
  "Public registry listing",
  "Forum & community access",
];

const PRO_FEATURES = [
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Attendance trends, duty status over time, member retention, op frequency — full insight into your unit's health at a glance." },
  { icon: Rocket, title: "Campaign System + Ribbons", desc: "Group ops into named campaigns with progression tracking, campaign banners, ribbon rack display, and a full archived history." },
  { icon: FileText, title: "Unlimited Training Docs", desc: "Upload without limits. AI-powered document scoring, quality flags, depth analysis, and auto-summaries generated for every doc." },
  { icon: Map, title: "Visual ORBAT Builder + PDF Export", desc: "Build your unit's command structure visually with NATO APP-6 symbology and drag-and-drop hierarchy. Export print-ready classified PDF briefing packs." },
  { icon: Globe, title: "Priority Registry Listing + Verified Badge", desc: "Your unit is featured at the top of the registry with a TAG Verified checkmark — the first impression for every recruit browsing for a unit." },
  { icon: Bot, title: "Discord Bot — Pro Suite", desc: "Automated op announcements, AAR summaries posted to your channels, and role-sync on roster changes. Set it and forget it." },
  { icon: Shield, title: "Full Reputation Reports", desc: "Access complete operator reputation history with export support. Free users see summary only — Pro commanders see everything." },
  { icon: Star, title: "Duty Roster Scheduling", desc: "Advanced rotation planner with assignment scheduling, conflict detection, and member notifications built in." },
  { icon: Zap, title: "Recruit Pipeline Board", desc: "Kanban-style applicant tracker: Applied → Reviewing → Interview → Accepted. Full history and notes per applicant." },
  { icon: Archive, title: "Unit Legacy & Era Timeline", desc: "A permanent public record of every op, campaign, and AAR — a visual history your unit can be proud of." },
  { icon: AlertCircle, title: "Smart LOA Alerts", desc: "Auto-flag when too many members are on LOA before an upcoming op. Never go undermanned again." },
  { icon: Users, title: "Inactivity Purge Assistant", desc: "Weekly report of members with no activity in 30 days. One-click bulk status update to keep your roster clean." },
];

const COMPARISON = [
  { label: "Training docs", free: "5 max", pro: "Unlimited" },
  { label: "Operator reputation", free: "Summary only", pro: "Full history + export" },
  { label: "Registry placement", free: "Standard listing", pro: "Priority featured" },
  { label: "Analytics", free: "None", pro: "Full dashboard" },
  { label: "Campaigns", free: "None", pro: "Unlimited campaigns" },
  { label: "ORBAT builder", free: "None", pro: "Visual builder + PDF export" },
  { label: "Discord bot", free: "Basic", pro: "Full Pro automation suite" },
  { label: "API / Webhooks", free: "None", pro: "Full access" },
  { label: "Recruit pipeline", free: "None", pro: "Full Kanban board" },
  { label: "Unit legacy page", free: "None", pro: "Full timeline + ribbons" },
  { label: "Duty roster planner", free: "Basic", pro: "Advanced scheduling" },
];

const STATS = [
  { value: "12+", label: "Pro-only features" },
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
    // Try to load groups owned by this user via milsim groups filter
    fetch(`https://agent-tag-lead-developer-cff87ae4.base44.app/functions/milsimGroups?path=my-groups&user_id=${user.id}`)
      .then(r => r.json())
      .then(data => {
        const groups = Array.isArray(data) ? data : (data?.groups || []);
        setMyGroups(groups);
        if (groups.length === 1) setSelectedGroup(groups[0].id);
        groups.forEach((g: any) => {
          fetch(`${PRO_STATUS_URL}?group_id=${g.id}`)
            .then(r => r.json())
            .then(s => setProStatus(prev => ({ ...prev, [g.id]: s.is_pro })));
        });
      })
      .catch(() => {});
  }, [isAuthenticated, user]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate("/portal/login");
      return;
    }
    if (myGroups.length > 1 && !selectedGroup) {
      toast({ title: "Select a unit", description: "Choose which unit to upgrade.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const group = myGroups.find(g => g.id === selectedGroup) || myGroups[0];
      const res = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: group?.id || user!.id,
          group_name: group?.name || "My Unit",
          user_id: user!.id,
          username: (user as any).username || user!.full_name || "",
          email: user!.email,
          billing,
        }),
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
              Everything a serious milsim commander needs — analytics, campaigns, AI training docs, Discord automation, API access — for <span className="text-foreground font-semibold">£10 a month</span>.
            </p>
            <p className="font-sans text-sm text-muted-foreground mb-10">
              Less than a takeaway. More than the competition.
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
              {STATS.map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
                  <div className="font-display font-black text-xl text-yellow-400">{s.value}</div>
                  <div className="font-sans text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={handleSubscribe} disabled={loading}
                className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-base px-10 py-4 rounded transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_30px_hsla(48,96%,53%,0.4)] hover:shadow-[0_0_40px_hsla(48,96%,53%,0.6)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                {loading ? "One moment..." : "Upgrade Now — £10/mo"}
              </button>
              <a href="#compare" className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                See what's included <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING CARD ── */}
      <section className="py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <button onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded font-display font-bold uppercase tracking-widest text-sm transition-all border ${billing === "monthly" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/40" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >Monthly</button>
              <button onClick={() => setBilling("annual")}
                className={`px-5 py-2 rounded font-display font-bold uppercase tracking-widest text-sm transition-all border relative ${billing === "annual" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/40" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Annual
                <span className="absolute -top-2.5 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">-{saving}%</span>
              </button>
            </div>

            <div className="bg-card border-2 border-yellow-500/50 rounded-xl p-8 shadow-[0_0_60px_hsla(48,96%,53%,0.08)]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="font-display font-black uppercase tracking-wider text-yellow-400 text-sm">Commander Pro</span>
                </div>
                <span className="text-xs font-sans text-muted-foreground bg-secondary px-2 py-1 rounded">Per unit</span>
              </div>

              <div className="flex items-end gap-2 mb-1">
                <span className="font-display font-black text-6xl text-foreground">
                  £{billing === "annual" ? annualMonthly : monthlyPrice}
                </span>
                <span className="text-muted-foreground font-sans mb-3">/ month</span>
              </div>

              {billing === "annual" ? (
                <p className="text-sm text-green-400 font-sans mb-1 font-medium">Billed annually at £{annualPrice} — you save £{(monthlyPrice * 12 - annualPrice).toFixed(0)}</p>
              ) : (
                <p className="text-sm text-muted-foreground font-sans mb-1">Switch to annual and save £{(monthlyPrice * 12 - annualPrice).toFixed(0)}/yr</p>
              )}
              <p className="text-xs text-muted-foreground font-sans mb-6">Cancel anytime · Instant activation · No hidden fees</p>

              {isAuthenticated && myGroups.length > 1 && (
                <div className="mb-5">
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Upgrade which unit?</label>
                  <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-foreground font-sans text-sm focus:outline-none focus:border-yellow-500/60"
                  >
                    <option value="">Select a unit...</option>
                    {myGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}{proStatus[g.id] ? " ✓ Already Pro" : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              <button onClick={handleSubscribe} disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-base px-8 py-4 rounded transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_20px_hsla(48,96%,53%,0.4)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                {loading ? "Redirecting to checkout..." : isAuthenticated ? "Upgrade to Pro" : "Get Started — Create Account"}
              </button>

              {!isAuthenticated && (
                <p className="text-center text-xs text-muted-foreground font-sans mt-3">Free TAG account required. Takes 60 seconds.</p>
              )}

              <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-2">
                {["Analytics dashboard", "Campaign system", "Recruit pipeline", "Discord Pro bot", "ORBAT PDF export", "Priority listing + Verified badge", "Unit legacy page", "Smart LOA alerts"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                    <Check className="w-3 h-3 text-yellow-400 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRO FEATURES ── */}
      <section id="compare" className="py-20 bg-secondary/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-foreground mb-4">
              What You <span className="text-yellow-400">Unlock</span>
            </h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto">
              Every Pro feature is purpose-built for serious milsim command. Not token upsells — actual tools that change how you run your unit.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PRO_FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="bg-card border border-yellow-500/15 hover:border-yellow-500/35 rounded-lg p-6 flex items-start gap-5 transition-colors"
              >
                <div className="w-12 h-12 shrink-0 bg-yellow-500/10 border border-yellow-500/25 rounded flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider text-foreground mb-1.5 text-sm">{f.title}</h3>
                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display font-black text-4xl uppercase tracking-tight text-foreground mb-3">Free vs <span className="text-yellow-400">Pro</span></h2>
            <p className="text-muted-foreground font-sans">Core command tools always stay free. Pro is for units that want to go further.</p>
          </motion.div>

          <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
            <div className="grid grid-cols-3 bg-secondary/50 border-b border-border text-xs font-display font-bold uppercase tracking-wider">
              <div className="p-4 text-muted-foreground">Feature</div>
              <div className="p-4 text-center text-muted-foreground">Free</div>
              <div className="p-4 text-center text-yellow-400 flex items-center justify-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Pro</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                <div className="p-4 font-sans text-sm text-foreground">{row.label}</div>
                <div className="p-4 text-center font-sans text-sm text-muted-foreground">{row.free}</div>
                <div className="p-4 text-center font-sans text-sm text-yellow-400 font-medium">{row.pro}</div>
              </div>
            ))}
          </div>

          {/* Always free box */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-display font-bold uppercase tracking-wider text-foreground mb-4 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" /> Always Free — No Paywall on Essentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FREE_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY TAG ── */}
      <section className="py-20 bg-secondary/20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-foreground mb-6">
              Not Just a Tool.<br /><span className="text-primary">A Community.</span>
            </h2>
            <p className="text-muted-foreground font-sans text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              TAG is a full tactical community — a public registry, cross-unit reputation system, veterans recognition, active forum, and operator identity platform. Your Pro unit doesn't just get better tools. It gets <span className="text-foreground font-semibold">visibility</span> in front of every serious milsim player looking for a unit to join.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
              {[
                { icon: Globe, title: "Public Visibility", desc: "Priority listing in the registry. Serious recruits find you first." },
                { icon: Users, title: "Cross-Unit Reputation", desc: "Operator reputation follows players across units — you see exactly who you're recruiting." },
                { icon: Shield, title: "Command Credibility", desc: "Verified, structured, professional — the mark of a unit that takes milsim seriously." },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border hover:border-primary/40 rounded-lg p-6 text-left transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/10 border border-primary/30 rounded flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold uppercase tracking-wider text-foreground mb-2 text-sm">{item.title}</h3>
                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <button onClick={handleSubscribe} disabled={loading}
              className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-base px-12 py-5 rounded transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_30px_hsla(48,96%,53%,0.35)] hover:shadow-[0_0_50px_hsla(48,96%,53%,0.5)]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
              {loading ? "One moment..." : `Upgrade Your Unit — £${billing === "annual" ? annualMonthly : monthlyPrice}/mo`}
              <ChevronRight className="w-5 h-5" />
            </button>

            <p className="mt-4 text-xs text-muted-foreground font-sans">Cancel anytime. No long-term commitment.</p>
          </motion.div>
        </div>
      </section>

    </MainLayout>
  );
}
