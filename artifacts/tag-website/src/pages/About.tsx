import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Shield, Target, Award, Users } from "lucide-react";

export default function About() {
  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-secondary/50 border-b border-border py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/tactical-texture.png)`, backgroundSize: 'cover' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider mb-4">Who We Are</h1>
            <div className="w-24 h-1 bg-primary mb-4" />
            <p className="text-xl text-muted-foreground max-w-2xl font-sans">
              The history, mission, and core values driving the Tactical Adaptation Group.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mission & History */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-display font-bold uppercase tracking-wider mb-6 text-primary">The TAG Mission</h2>
              <div className="space-y-6 text-muted-foreground font-sans text-lg leading-relaxed">
                <p>
                  TAG (Tactical Adaptation Group) was forged from a singular frustration: the chaos of public lobbies and the lack of coordinated, tactical gameplay in modern shooters. We aren't just another gaming clan; we are a dedicated unit.
                </p>
                <p>
                  Our mission is simple: To bring together mature gamers, teach them fundamental warfighting skills adapted for virtual environments, and build a cohesive community that dominates every server we enter.
                </p>
                <p>
                  We believe that tactics, communication, and discipline triumph over raw reflexes. By adopting real-world military doctrine to our supported games, we create an immersive, highly effective gaming experience.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              className="relative rounded-lg overflow-hidden border border-border p-2 bg-card"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
              {/* stock tactical strategy/map image */}
              <img 
                src="https://images.unsplash.com/photo-1584281722883-9b8e8f85f3ba?q=80&w=1000&auto=format&fit=crop" 
                alt="Tactical planning" 
                className="w-full h-auto rounded clip-angled-sm object-cover aspect-[4/3] opacity-80"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-4">Core Values</h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8 text-primary" />,
                title: "Discipline",
                desc: "We maintain comms discipline, respect chain of command during operations, and execute plans with precision."
              },
              {
                icon: <Target className="w-8 h-8 text-primary" />,
                title: "Adaptation",
                desc: "No plan survives first contact. We teach our members to read the battlefield and adapt strategies on the fly."
              },
              {
                icon: <Users className="w-8 h-8 text-primary" />,
                title: "Brotherhood",
                desc: "We leave no one behind. We foster a mature, respectful environment where members support each other."
              },
              {
                icon: <Award className="w-8 h-8 text-primary" />,
                title: "Excellence",
                desc: "We continuously train to improve our individual mechanics and team cohesion. Complacency gets you killed."
              }
            ].map((val, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-secondary/40 border border-border p-8 rounded clip-angled hover:bg-secondary hover:border-primary/50 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center mb-6 shadow-inner">
                  {val.icon}
                </div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider mb-3 text-foreground">{val.title}</h3>
                <p className="text-muted-foreground font-sans text-sm leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
