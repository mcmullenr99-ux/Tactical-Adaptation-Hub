import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Heart, Server, Shield, Crosshair, Users, ExternalLink } from "lucide-react";

const KOFI_URL = "https://ko-fi.com/tagtacticaladaptationgroup";

const SERVER_USES = [
  {
    icon: Crosshair,
    title: "Arma 3 & Reforger",
    description: "Dedicated mission servers for our weekly ops and training events.",
  },
  {
    icon: Shield,
    title: "Squad",
    description: "Private servers for organized competitive and casual squad play.",
  },
  {
    icon: Server,
    title: "DayZ & Other Games",
    description: "Community servers for survival and tactical games across the TAG library.",
  },
  {
    icon: Users,
    title: "Community Infrastructure",
    description: "Keeping the lights on — hosting, tools, and everything that keeps TAG running.",
  },
];

const TIERS = [
  { amount: 5, label: "Ammo Box", description: "Keeps the server stocked for a day." },
  { amount: 15, label: "Fire Support", description: "Covers a weekend of ops." },
  { amount: 30, label: "Forward Operating Base", description: "A month of server uptime." },
  { amount: 50, label: "Full Deployment", description: "Serious backing for serious ops." },
];

export default function Donate() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px),
              repeating-linear-gradient(90deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px)`,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded text-accent font-display font-bold uppercase tracking-widest text-xs mb-6">
              <Heart className="w-3 h-3" /> Support the Unit
            </div>

            <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tight text-foreground mb-6">
              Keep TAG<br />
              <span className="text-primary">In The Fight</span>
            </h1>

            <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Every dollar goes directly toward renting game servers so TAG can keep running
              organized operations, training events, and community gameplay. No salaries. No overhead.
              Just servers.
            </p>

            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-accent hover:bg-accent/90 text-accent-foreground font-display font-black uppercase tracking-widest text-base px-10 py-4 rounded clip-angled shadow-[0_0_30px_hsla(var(--accent),0.3)] hover:shadow-[0_0_40px_hsla(var(--accent),0.5)] transition-all active:scale-95"
            >
              <Heart className="w-5 h-5" />
              Donate via Ko-fi
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>

            <p className="mt-4 text-xs text-muted-foreground font-sans">
              Secure payments via Ko-fi · No account required · One-time or recurring
            </p>
          </motion.div>
        </div>
      </section>

      {/* Where Your Money Goes */}
      <section className="py-20 bg-secondary/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
              Where Your <span className="text-primary">Money Goes</span>
            </h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto">
              100% of donations are used to rent and maintain game servers for the TAG community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVER_USES.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-lg p-6 flex items-start gap-5 hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 shrink-0 bg-primary/10 border border-primary/30 rounded flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Tiers */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
              Pick Your <span className="text-primary">Loadout</span>
            </h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto">
              Every amount helps. Choose what works for you — or set your own on Ko-fi.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {TIERS.map((tier, i) => (
              <motion.a
                key={tier.amount}
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card border border-border hover:border-primary/60 rounded-lg p-6 text-center transition-all hover:bg-primary/5 cursor-pointer"
              >
                <div className="text-3xl font-display font-black text-primary mb-2 group-hover:scale-110 transition-transform">
                  ${tier.amount}
                </div>
                <div className="font-display font-bold uppercase tracking-wider text-foreground text-sm mb-2">
                  {tier.label}
                </div>
                <p className="text-muted-foreground font-sans text-xs leading-relaxed">
                  {tier.description}
                </p>
              </motion.a>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-primary/30 rounded-lg p-10 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
            <div className="relative z-10">
              <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-display font-black text-2xl uppercase tracking-tight text-foreground mb-3">
                Ready to Support the Unit?
              </h3>
              <p className="text-muted-foreground font-sans mb-8 max-w-lg mx-auto">
                No account needed on Ko-fi. Pay with card or PayPal in under a minute.
                Your support keeps TAG operational.
              </p>
              <a
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-accent hover:bg-accent/90 text-accent-foreground font-display font-black uppercase tracking-widest text-sm px-10 py-4 rounded clip-angled shadow-[0_0_20px_hsla(var(--accent),0.2)] hover:shadow-[0_0_30px_hsla(var(--accent),0.4)] transition-all active:scale-95"
              >
                <Heart className="w-5 h-5" />
                Donate on Ko-fi
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
