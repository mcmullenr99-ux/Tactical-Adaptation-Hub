import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Heart, Server, Shield, Crosshair, Users, ExternalLink, CreditCard, Loader2 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

const KOFI_URL = "https://ko-fi.com/tagtacticaladaptationgroup";
const FUNCTION_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/createDonationSession";

const SERVER_USES = [
  { icon: Crosshair, title: "Arma 3 & Reforger", description: "Dedicated mission servers for our weekly ops and training events." },
  { icon: Shield, title: "Squad", description: "Private servers for organized competitive and casual squad play." },
  { icon: Server, title: "DayZ & Other Games", description: "Community servers for survival and tactical games across the TAG library." },
  { icon: Users, title: "Community Infrastructure", description: "Keeping the lights on — hosting, tools, and everything that keeps TAG running." },
];

const PRESET_AMOUNTS = [3, 5, 10, 20, 50];

export default function Donate() {
  useSEO({ title: "Support TAG", description: "Support TAG via card payment or Ko-fi. Your contributions fund servers, events, and keep the community running." });
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const effectiveAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleDonate = async () => {
    const amount = effectiveAmount;
    if (!amount || amount < 1) {
      toast({ title: "Invalid Amount", description: "Minimum donation is £1.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_gbp: amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Checkout Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded text-accent font-display font-bold uppercase tracking-widest text-xs mb-6">
              <Heart className="w-3 h-3" /> Support the Unit
            </div>
            <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tight text-foreground mb-6">
              Keep TAG<br /><span className="text-primary">In The Fight</span>
            </h1>
            <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Every contribution goes directly toward renting game servers so TAG can keep running
              organized operations, training events, and community gameplay. No salaries. No overhead. Just servers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={KOFI_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-accent hover:bg-accent/90 text-accent-foreground font-display font-black uppercase tracking-widest text-base px-10 py-4 rounded clip-angled shadow-[0_0_30px_hsla(var(--accent),0.3)] hover:shadow-[0_0_40px_hsla(var(--accent),0.5)] transition-all active:scale-95"
              >
                <Heart className="w-5 h-5" /> Donate via Ko-fi <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
              <a href="#stripe-donate"
                className="inline-flex items-center gap-3 bg-primary/10 hover:bg-primary/20 border border-primary/40 text-primary font-display font-black uppercase tracking-widest text-base px-10 py-4 rounded clip-angled transition-all active:scale-95"
              >
                <CreditCard className="w-5 h-5" /> Pay by Card
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-sans">
              Ko-fi · Stripe · Secure payments · No hidden fees
            </p>
          </motion.div>
        </div>
      </section>

      {/* Where Your Money Goes */}
      <section className="py-20 bg-secondary/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
              Where Your <span className="text-primary">Money Goes</span>
            </h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto">
              100% of contributions fund game servers and community infrastructure for TAG.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVER_USES.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-lg p-6 flex items-start gap-5 hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 shrink-0 bg-primary/10 border border-primary/30 rounded flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stripe Donate */}
      <section id="stripe-donate" className="py-20">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
              Donate by <span className="text-primary">Card</span>
            </h2>
            <p className="text-muted-foreground font-sans">Secure checkout via Stripe. Choose an amount or enter your own.</p>
          </motion.div>

          <div className="bg-card border border-border rounded-lg p-8">
            {/* Preset amounts */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                  className={`py-3 rounded font-display font-bold uppercase tracking-wider text-sm transition-all ${
                    selectedAmount === amt && !customAmount
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.4)]"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                  }`}
                >
                  £{amt}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">£</span>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Other amount"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <button
              onClick={handleDonate}
              disabled={loading || !effectiveAmount || effectiveAmount < 1}
              className="w-full inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black uppercase tracking-widest text-base px-8 py-4 rounded clip-angled shadow-[0_0_20px_hsla(var(--primary),0.3)] hover:shadow-[0_0_30px_hsla(var(--primary),0.5)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {loading ? "Redirecting..." : `Donate £${effectiveAmount || "—"}`}
            </button>

            <p className="text-center text-xs text-muted-foreground font-sans mt-4">
              Powered by Stripe · Encrypted · No account required
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-secondary/20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-black text-3xl uppercase tracking-tight text-foreground mb-4">
              Thank You for <span className="text-primary">Supporting TAG</span>
            </h2>
            <p className="text-muted-foreground font-sans mb-8">
              Every pound helps us keep the servers running and the community growing. From all of us at TAG — cheers.
            </p>
            <a href={KOFI_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-display font-bold uppercase tracking-wider text-sm transition-colors"
            >
              <Heart className="w-4 h-4" /> Also available on Ko-fi <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
