import { motion } from "framer-motion";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  UserPlus, Shield, Network, BarChart2, Target,
  CheckCircle2, ArrowRight, Disc, BookOpen, Star
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { TAG_DISCORD_URL } from '@/lib/constants';

const PLATFORM_FEATURES = [
  {
    icon: <Target className="w-5 h-5 text-primary" />,
    title: "Op Planning Suite",
    desc: "WARNO, ORBAT, AO maps, op briefings, intel packages, phase tracking."
  },
  {
    icon: <UserPlus className="w-5 h-5 text-primary" />,
    title: "Recruitment Pipeline",
    desc: "Application forms, custom questions, automated scheduling, selection criteria."
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-primary" />,
    title: "Performance Tools",
    desc: "AAR system, promotion engines, role fitness reviews, member scoring."
  },
  {
    icon: <Network className="w-5 h-5 text-primary" />,
    title: "Inter-Unit Networking",
    desc: "Joint ops challenges, combat records, group reviews, and a public registry."
  },
  {
    icon: <BookOpen className="w-5 h-5 text-primary" />,
    title: "Training & Doctrine",
    desc: "SOP uploads, training review logs, qualification grants, and doctrine libraries."
  },
  {
    icon: <Shield className="w-5 h-5 text-primary" />,
    title: "Full HQ Portal",
    desc: "Roster management, ranks, awards, LOA tracking, duty rosters, and more."
  },
];

const WHO_IS_IT_FOR = [
  "Milsim group commanders who want to run their unit with real structure",
  "Units tired of managing everything across Discord, spreadsheets, and Google Docs",
  "New groups who need a solid foundation from day one",
  "Veterans looking for other serious units to network and run joint ops with",
  "Solo players wanting to find and join a properly organised group",
];

export default function Join() {
  useSEO({
    title: "Get Started",
    description: "Join the TAG platform — register your milsim group or create an account to access the full suite of planning, recruitment, and performance tools."
  });

  return (
    <MainLayout>

      {/* Hero */}
      <section className="relative bg-secondary/50 border-b border-border py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,currentColor 39px,currentColor 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,currentColor 39px,currentColor 40px)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <p className="text-primary font-display font-black uppercase tracking-widest text-sm mb-4">Get Started</p>
            <h1 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tight text-foreground leading-none mb-6">
              Your Unit.<br /><span className="text-primary">One Platform.</span><br />Full Potential.
            </h1>
            <p className="text-lg text-muted-foreground font-sans leading-relaxed max-w-2xl">
              TAG gives milsim groups every tool they need to plan operations, recruit members, manage performance, and build a reputation — all in one place.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Two Paths */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display font-black text-3xl uppercase tracking-tight text-foreground mb-2">How Do You Want to Start?</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Path 1 — Register Group */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-card border border-primary/40 p-8 rounded-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="w-12 h-12 rounded bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-black text-2xl uppercase tracking-tight text-foreground mb-3">I Run a Unit</h3>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-6">
                Register your milsim group and get full access to the HQ portal — op planning, roster management, recruitment pipelines, training tools, and everything in between.
              </p>
              <ul className="space-y-2 mb-8">
                {["Free to register", "Full HQ portal access", "Public listing in the registry", "Commander Pro upgrades available"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/milsim-register"
                className="w-full flex items-center justify-center gap-2 font-display font-black uppercase tracking-widest text-base bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 rounded clip-angled transition-all active:scale-95"
              >
                Register Your Group <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Path 2 — Create Account */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="bg-card border border-border p-8 rounded-lg"
            >
              <div className="w-12 h-12 rounded bg-secondary/60 border border-border flex items-center justify-center mb-5">
                <UserPlus className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-display font-black text-2xl uppercase tracking-tight text-foreground mb-3">I'm a Player</h3>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-6">
                Create a free account to browse the unit registry, apply to groups, access the forum, use the ops calendar, and build your operator profile.
              </p>
              <ul className="space-y-2 mb-8">
                {["Free account", "Browse & apply to groups", "Forum and community access", "Public operator profile"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <div className="space-y-3">
                <Link
                  href="/portal/register"
                  className="w-full flex items-center justify-center gap-2 font-display font-black uppercase tracking-widest text-base border border-primary text-primary hover:bg-primary/10 px-6 py-4 rounded clip-angled transition-all active:scale-95"
                >
                  Create Account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/portal/login"
                  className="w-full flex items-center justify-center gap-2 font-display font-bold uppercase tracking-widest text-sm text-muted-foreground hover:text-foreground px-6 py-3 rounded transition-all"
                >
                  Already have an account? Log in
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-secondary/20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-2">
              What's in the Platform
            </h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto">Everything your unit needs. Nothing you don't.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-4 bg-card border border-border p-5 rounded-lg hover:border-primary/40 transition-all"
              >
                <div className="w-9 h-9 flex-shrink-0 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-display font-black uppercase tracking-wider text-foreground text-sm mb-1">{f.title}</h4>
                  <p className="text-muted-foreground font-sans text-xs leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <h2 className="font-display font-black text-3xl uppercase tracking-tight text-foreground mb-2">Who It's Built For</h2>
            <div className="w-12 h-1 bg-primary" />
          </motion.div>
          <div className="space-y-4">
            {WHO_IS_IT_FOR.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 bg-secondary/30 border border-border p-5 rounded-lg"
              >
                <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground font-sans text-sm leading-relaxed">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Discord */}
      <section className="py-16 bg-[#5865F2]/5 border-t border-[#5865F2]/20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-foreground mb-3">Also on Discord</h2>
            <p className="text-muted-foreground font-sans mb-6 text-sm">
              Join the TAG Discord to connect with other unit commanders, get platform support, and stay up to date with new features.
            </p>
            <a
              href={TAG_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 font-display font-black uppercase tracking-widest text-base bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded clip-angled shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all active:scale-95"
            >
              <Disc className="w-5 h-5" /> Join the Discord
            </a>
          </motion.div>
        </div>
      </section>

    </MainLayout>
  );
}
