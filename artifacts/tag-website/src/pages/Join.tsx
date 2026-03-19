import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Disc, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react";

export default function Join() {
  const handleJoinClick = () => {
    // In a real app, this would be an actual discord invite link
    window.open("https://discord.com", "_blank");
  };

  return (
    <MainLayout>
      <div className="bg-secondary/50 border-b border-border py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider mb-4">Enlistment</h1>
            <div className="w-24 h-1 bg-accent mb-4" />
            <p className="text-xl text-muted-foreground max-w-2xl font-sans">
              Begin your journey with the Tactical Adaptation Group. Read the requirements carefully before proceeding.
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
                Review Requirements
              </h2>
              <ul className="space-y-4 font-sans text-muted-foreground mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Must be 18 years of age or older. We maintain a mature environment.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Must possess a working, clear microphone with minimal background noise.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Willingness to learn, adapt, and follow chain-of-command during operations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Zero tolerance for toxicity, racism, or unnecessary drama.</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-card border border-border p-8 rounded-lg"
            >
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded bg-primary/20 text-primary text-sm">02</span>
                Join the Discord
              </h2>
              <p className="font-sans text-muted-foreground mb-8">
                Our Discord server is the central hub for all communications, operation planning, and training schedules. Connect your account and proceed to the #welcome channel.
              </p>
              
              <button 
                onClick={handleJoinClick}
                className="w-full sm:w-auto flex items-center justify-center gap-3 font-display font-bold uppercase tracking-widest text-lg bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded clip-angled shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all active:scale-95"
              >
                <Disc className="w-6 h-6" /> Connect Discord
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-card border border-border p-8 rounded-lg opacity-75"
            >
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center justify-center w-8 h-8 rounded bg-secondary text-muted-foreground text-sm">03</span>
                Basic Training & Evaluation
              </h2>
              <p className="font-sans text-muted-foreground">
                Once admitted, you will be tagged as a Recruit. You must attend one Basic Combat Training (BCT) session where your communication and ability to follow instructions will be evaluated before full deployment.
              </p>
            </motion.div>

          </div>

          {/* Sidebar / FAQ */}
          <div className="space-y-8">
            <div className="bg-accent/10 border border-accent/20 p-6 rounded-lg clip-angled-sm">
              <div className="flex items-center gap-3 text-accent mb-4">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-display font-bold uppercase tracking-wider">Notice</h3>
              </div>
              <p className="text-sm font-sans text-muted-foreground">
                TAG is not a casual drop-in group. We expect commitment to our playstyle during official operations. If you are just looking for casual matchmaking, this is not the unit for you.
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
                    No. You only need to own at least one of our primary supported games to participate in operations for that title.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" /> Are there activity requirements?
                  </h4>
                  <p className="text-sm font-sans text-muted-foreground pl-6">
                    Real life comes first. We ask for a minimum of 2 operations per month to maintain active status, but extended LOAs are always granted.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" /> What timezones do you operate in?
                  </h4>
                  <p className="text-sm font-sans text-muted-foreground pl-6">
                    Primary operations are scheduled in NA evening times (EST/CST), though we have active members globally.
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
