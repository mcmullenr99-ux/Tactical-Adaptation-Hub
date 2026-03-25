import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { useLocation } from "wouter";
import {
  Crown, Check, X, Zap, BarChart3, Shield, FileText, Map,
  Award, Users, Bot, Loader2, Star, Lock, ChevronRight, Rocket, Globe
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
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Attendance trends, duty status over time, member retention charts, op frequency — full insight into your unit's health." },
  { icon: Rocket, title: "Campaign System", desc: "Group ops into named campaigns with progression tracking, campaign banners, and archived history." },
  { icon: FileText, title: "Unlimited Training Docs", desc: "Upload without limits. AI-powered document scoring, quality flags, depth analysis, and auto-summaries for every doc." },
  { icon: Map, title: "Advanced ORBAT Export", desc: "Export print-ready classified PDF briefing packs with NATO symbology, echelons, and custom markings." },
  { icon: Award, title: "Award Certificate Generator", desc: "Auto-generate printable, shareable award certificates with your unit's branding for every commendation." },
  { icon: Globe, title: "Priority Registry Listing", desc: "Your unit appears at the top of the public Milsim Registry — first impression for every potential recruit." },
  { icon: Bot, title: "Discord Bot — Pro Features", desc: "Automated op announcements, AAR summaries posted to your channels, and role-sync on roster changes." },
  { icon: Shield, title: "Full Reputation Reports", desc: "Access complete operator reputation history and export reports — free users see summary only." },
  { icon: Star, title: "Duty Roster Scheduling", desc: "Advanced rotation planner with assignment scheduling, conflict detection, and member notifications." },
  { icon: Zap, title: "Webhook & API Access", desc: "Connect your unit's systems directly. Build custom integrations with full API access and webhook support." },
];

const FREE_LIMITS = [
  { label: "Training docs", free: "5 max", pro: "Unlimited" },
  { label: "Operator reputation", free: "Summary only", pro: "Full history + export" },
  { label: "Registry placement", free: "Standard listing", pro: "Priority featured" },
  { label: "Analytics", free: "None", pro: "Full dashboard" },
  { label: "Campaigns", free: "None", pro: "Unlimited campaigns" },
  { label: "ORBAT export", free: "Screen only", pro: "PDF export + classification" },
  { label: "Discord bot", free: "Basic scraping", pro: "Pro automation suite" },
  { label: "API access", free: "None", pro: "Full access + webhooks" },
];

export default function CommanderPro() {
  useSEO({ title: "Commander Pro — TAG", description: "Premium command tools for milsim unit commanders. Campaigns, analytics, API access, and more." });
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [proStatus, setProStatus] = useState<Record<string, boolean>>({});
  const [successShown, setSuccessShown] = useState(false);

  // Check for success param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" && !successShown) {
      setSuccessShown(true);
      toast({ title: "🎉 Commander Pro Activated!", description: "Your unit now has access to all Pro features. Welcome to the top tier." });
    }
  }, []);

  // Load user's groups
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetch(`https://agent-tag-lead-developer-cff87ae4.base44.app/functions/getUserGroups?user_id=${user.id}`, {
      headers: { "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(data => {
        const groups = data?.groups || [];
        setMyGroups(groups);
        if (groups.length === 1) setSelectedGroup(groups[0].id);
        // Check pro status for each
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
      navigate("/portal/login?returnTo=/commander-pro");
      return;
    }
    if (myGroups.length > 0 && !selectedGroup) {
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
          group_id: group?.id || "pending",
          group_name: group?.name || "My Unit",
          user_id: user!.id,
          username: user!.username || user!.full_name || "",
          email: user!.email,
          billing,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Failed to create checkout");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Checkout Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const monthlyPrice = 4.99;
  const annualPrice = 44.99;
  const annualMonthly = (annualPrice / 12).toFixed(2);
  const saving = Math.round(100 - (annualPrice / (monthlyPrice * 12)) * 100);

  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-background to-background" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px)`,
        }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 font-display font-bold uppercase tracking-widest text-xs mb-6">
              <Crown className="w-3 h-3" /> Commander Pro
            </div>
            <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tight text-foreground mb-6">
              Command Your Unit.<br /><span className="text-yellow-400">Like a Pro.</span>
            </h1>
            <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The full command suite for serious milsim unit commanders. Analytics, campaigns, AI-powered training docs, Discord automation, and more — built for units that mean business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded font-display font-bold uppercase tracking-widest text-sm transition-all ${billing === "monthly" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" : "text-muted-foreground hover:text-foreground"}`}
              >Monthly</button>
              <button
                onClick={() => setBilling("annual")}
                className={`px-5 py-2 rounded font-display font-bold uppercase tracking-widest text-sm transition-all relative ${billing === "annual" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" : "text-muted-foreground hover:text-foreground"}`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{saving}%</span>
              </button>
            </div>

            <div className="bg-card border-2 border-yellow-500/40 rounded-xl p-8 shadow-[0_0_40px_hsla(48,96%,53%,0.1)]">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span className="font-display font-black uppercase tracking-wider text-yellow-400">Commander Pro</span>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display font-black text-5xl text-foreground">
                  £{billing === "annual" ? annualMonthly : monthlyPrice}
                </span>
                <span className="text-muted-foreground font-sans mb-2">/ month</span>
              </div>
              {billing === "annual" && (
                <p className="text-sm text-muted-foreground font-sans mb-2">Billed annually at £{annualPrice}/yr · Save {saving}% vs monthly</p>
              )}
              <p className="text-xs text-muted-foreground font-sans mb-6">Per unit · Cancel anytime · Instant activation</p>

              {/* Group selector if user has groups */}
              {isAuthenticated && myGroups.length > 1 && (
                <div className="mb-4">
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Upgrade which unit?</label>
                  <select
                    value={selectedGroup}
                    onChange={e => setSelectedGroup(e.target.value)}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-foreground font-sans text-sm focus:outline-none focus:border-yellow-500/60"
                  >
                    <option value="">Select a unit...</option>
                    {myGroups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}{proStatus[g.id] ? " ✓ Already Pro" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-base px-8 py-4 rounded transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_20px_hsla(48,96%,53%,0.4)] hover:shadow-[0_0_30px_hsla(48,96%,53%,0.6)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                {loading ? "Redirecting..." : isAuthenticated ? "Upgrade to Pro" : "Get Started"}
              </button>

              {!isAuthenticated && (
                <p className="text-center text-xs text-muted-foreground font-sans mt-3">
                  You'll be asked to log in or create a TAG account first
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pro Features Grid */}
      <section className="py-20 bg-secondary/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
              What You <span className="text-yellow-400">Unlock</span>
            </h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto">
              Every Pro feature is purpose-built for serious milsim command — not bolted on as an afterthought.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRO_FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-yellow-500/20 rounded-lg p-6 flex items-start gap-5 hover:border-yellow-500/40 transition-colors"
              >
                <div className="w-12 h-12 shrink-0 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider text-foreground mb-1">{f.title}</h3>
                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
              Free vs <span className="text-yellow-400">Pro</span>
            </h2>
          </motion.div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-secondary/40 border-b border-border">
              <div className="p-4 font-display font-bold uppercase tracking-wider text-sm text-muted-foreground">Feature</div>
              <div className="p-4 font-display font-bold uppercase tracking-wider text-sm text-center text-muted-foreground">Free</div>
              <div className="p-4 font-display font-bold uppercase tracking-wider text-sm text-center text-yellow-400 flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" /> Pro
              </div>
            </div>
            {FREE_LIMITS.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                <div className="p-4 font-sans text-sm text-foreground">{row.label}</div>
                <div className="p-4 text-center font-sans text-sm text-muted-foreground">{row.free}</div>
                <div className="p-4 text-center font-sans text-sm text-yellow-400 font-medium">{row.pro}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-card border border-border rounded-xl p-6">
            <h3 className="font-display font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" /> Always Free — Core Command Tools
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FREE_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" /> {f}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-sans">
              Core command tools are always free — we don't paywall the essentials. Pro is for units that want to go further.
            </p>
          </div>
        </div>
      </section>

      {/* Why TAG */}
      <section className="py-20 bg-secondary/20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-6">
              More Than a <span className="text-primary">Management Tool</span>
            </h2>
            <p className="text-muted-foreground font-sans text-lg max-w-2xl mx-auto mb-10">
              TAG is a full tactical community — a public registry, cross-unit reputation system, veterans recognition, 
              active forum, and operator identity platform. Your Pro unit doesn't just get better tools. 
              It gets <span className="text-foreground font-medium">visibility</span> in front of every serious milsim player looking for a unit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { icon: Globe, title: "Public Visibility", desc: "Priority listing in the registry. Recruits find you first." },
                { icon: Users, title: "Cross-Unit Community", desc: "Your operators build reputation that follows them across units." },
                { icon: Shield, title: "Command Credibility", desc: "Verified, structured, professional — the mark of a serious unit." },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-lg p-6 text-left hover:border-primary/40 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/10 border border-primary/30 rounded flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold uppercase tracking-wider text-foreground mb-2 text-sm">{item.title}</h3>
                  <p className="text-muted-foreground font-sans text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-base px-10 py-4 rounded transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_20px_hsla(48,96%,53%,0.3)]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
              Upgrade Your Unit — £{billing === "annual" ? annualMonthly : monthlyPrice}/mo
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
