import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Crosshair, Map, Mic, Users, ShieldAlert, Footprints } from "lucide-react";

export default function Training() {
  return (
    <MainLayout>
      <div className="bg-secondary/50 border-b border-border py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider mb-4">Tactical Doctrine</h1>
            <div className="w-24 h-1 bg-primary mb-4" />
            <p className="text-xl text-muted-foreground max-w-2xl font-sans">
              We teach fundamental warfighting skills adapted to digital battlefields to ensure maximum combat effectiveness.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-20 bg-card border border-border p-8 md:p-12 rounded-lg clip-angled relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-primary mb-4">Our Training Philosophy</h2>
              <p className="text-lg text-muted-foreground font-sans leading-relaxed max-w-4xl">
                Mechanics alone don't win matches — positioning, awareness, and coordination do. Every SOP and technique TAG teaches has been field-tested and proven to actually work in the games we play. We don't guess; we refine. Each game has its own tailored doctrine built around how that title plays, so whether you're deep in an Arma mil-sim or pushing a compound in Ground Branch, the fundamentals translate.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold uppercase tracking-wider mb-10 text-center">Fundamental Skills</h2>

          <div className="space-y-8">
            {[
              {
                icon: <Footprints className="w-6 h-6" />,
                title: "Movement & Tactics",
                desc: "Learn to slice the pie, perform dynamic and stealth room entries, bound across open terrain, and use micro-terrain for cover and concealment. Understanding exposure angles is critical to survival."
              },
              {
                icon: <Mic className="w-6 h-6" />,
                title: "Communication Protocols",
                desc: "Clear the comms. We teach standard NATO-style radio discipline. SALUTE reports, concise callouts, bearing and distance estimation, and maintaining radio silence when necessary."
              },
              {
                icon: <Crosshair className="w-6 h-6" />,
                title: "Marksmanship & Fire Control",
                desc: "Rules of Engagement (RoE), trigger discipline, sector assignment, suppressing fire, and weapon manipulation under pressure. Know when to shoot, and more importantly, when not to."
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Team Coordination",
                desc: "Operating in fireteams. Formation movements (wedge, column, file), bounding overwatch, crossing danger areas, and establishing 360-degree security perimeters."
              },
              {
                icon: <Map className="w-6 h-6" />,
                title: "Map Reading & Navigation",
                desc: "Terrain association, compass navigation, reading topographical lines, plotting waypoints without GPS aids, and establishing rally points."
              },
              {
                icon: <ShieldAlert className="w-6 h-6" />,
                title: "Reaction to Contact",
                desc: "Immediate action drills. Returning fire, seeking cover, reporting contact, peeling back, and establishing base of fire vs maneuvering elements."
              }
            ].map((module, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col md:flex-row gap-6 items-start bg-secondary/30 p-6 md:p-8 border-l-4 border-primary rounded hover:bg-secondary/60 transition-colors"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-card border border-border rounded clip-angled-sm flex items-center justify-center text-primary shadow-inner">
                  {module.icon}
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold uppercase tracking-wider mb-2 text-foreground">{module.title}</h3>
                  <p className="text-muted-foreground font-sans leading-relaxed">{module.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>
    </MainLayout>
  );
}
