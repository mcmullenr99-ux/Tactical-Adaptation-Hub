import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Disc, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function Join() {
  useSEO({ title: "Enlist", description: "Join TAG — Tactical Adaptation Group. Enlist today and become part of an elite tactical gaming community." });
  const handleJoinClick = () => {
    window.open("https://discord.gg/matmFhU4yg", "_blank");
  };

  return (
    <MainLayout>
      <div className="bg-secondary/50 border-b border-border py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider mb-4">Join TAG</h1>
            <div className="w-24 h-1 bg-accent mb-4" />
            <p className="text-xl text-muted-foreground max-w-2xl font-sans">
              Drop into Discord, say hello, and jump in at your own pace. Every game has its own crew and SOPs — we'll walk you through everything.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Join Flow */}
          <div className="lg:col-span-2 space-y-12">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card border border-border p-8 rounded-lg"
            >
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded bg-primary/20 text-primary text-sm">01</span>
                Good to Know
              </h2>
              <p className="font-sans text-muted-foreground mb-6">Just a few things that keep the vibe right for everyone:</p>
              <ul className="space-y-4 font-sans text-muted-foreground mb-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>We keep things mature and drama-free — respect goes both ways.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>A working mic is handy — comms are half the fun in tactical play.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>You don't need to know anything coming in — a willingness to learn is all it takes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Come and go as life allows — real life always takes priority here.</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-card border border-border p-8 rounded-lg"
            >
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded bg-primary/20 text-primary text-sm">02</span>
                Jump in on Discord
              </h2>
              <p className="font-sans text-muted-foreground mb-8">
                Our Discord is where everything happens — game nights, operation planning, game-specific channels, and just hanging out. Hit the button below, introduce yourself in #welcome, and we'll point you toward the right crew.
              </p>
              
              <button 
                onClick={handleJoinClick}
                className="w-full sm:w-auto flex items-center justify-center gap-3 font-display font-bold uppercase tracking-widest text-lg bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded clip-angled shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all active:scale-95"
              >
                <Disc className="w-6 h-6" /> Join the Discord
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-card border border-border p-8 rounded-lg"
            >
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded bg-primary/20 text-primary text-sm">03</span>
                Pick Your Game & Get Stuck In
              </h2>
              <p className="font-sans text-muted-foreground mb-4">
                Each game in TAG has its own channel, its own crew, and its own set of SOPs — Standard Operating Procedures that are battle-tested and proven to actually work in-game. Find the title you play, link up with that squad, and start running ops together.
              </p>
              <p className="font-sans text-muted-foreground">
                There's no formal onboarding process or evaluation — just show up, play, and pick things up naturally. Everyone started somewhere.
              </p>
            </motion.div>

          </div>

          {/* Sidebar / FAQ */}
          <div className="space-y-8">
            <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg clip-angled-sm">
              <div className="flex items-center gap-3 text-primary mb-4">
                <Info className="w-6 h-6" />
                <h3 className="font-display font-bold uppercase tracking-wider">Good Fit?</h3>
              </div>
              <p className="text-sm font-sans text-muted-foreground">
                If you enjoy games that reward teamwork and smart play over solo heroics, you'll fit right in. Whether you're a seasoned mil-sim veteran or totally new to tactical games, TAG has a place for you.
              </p>
            </div>

            <div className="bg-secondary/30 border border-border p-6 rounded-lg">
              <h3 className="font-display font-bold uppercase tracking-wider mb-6 border-b border-border pb-4">F.A.Q.</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" /> Do I need to own all games?
                  </h4>
                  <p className="text-sm font-sans text-muted-foreground pl-6">
                    Not at all. Own one, own them all — whatever you play is where you start. Each game has its own dedicated group.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" /> Do I have to play on a schedule?
                  </h4>
                  <p className="text-sm font-sans text-muted-foreground pl-6">
                    Nope. Jump in when you can. Life happens — we get it. There are no mandatory sessions or activity quotas.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" /> Do I need experience in tactical games?
                  </h4>
                  <p className="text-sm font-sans text-muted-foreground pl-6">
                    Zero experience needed. Our SOPs are built to be easy to pick up and proven to work — you'll be running coordinated ops before you know it.
                  </p>
                </div>

                <div>
                  <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" /> What timezones do you play in?
                  </h4>
                  <p className="text-sm font-sans text-muted-foreground pl-6">
                    We have members across NA and globally — ops happen throughout the day and night depending on the game and crew.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </MainLayout>
  );
}
