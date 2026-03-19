import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Crosshair } from "lucide-react";

const GAMES_DATA = [
  {
    name: "Arma 3",
    genre: "Mil-Sim Sandbox",
    desc: "The premier military simulation game. Massive scale combined arms operations requiring intense coordination.",
    img: "https://images.unsplash.com/photo-1579975096649-e773152b04cb?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Arma Reforger",
    genre: "Modern Mil-Sim",
    desc: "The bridge to Arma 4. Experiencing cold-war era combat with updated engine mechanics and communications.",
    img: "https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Squad",
    genre: "Large-Scale Tactical FPS",
    desc: "50v50 combined arms warfare where communication and unit cohesion dictate the victor.",
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Ready Or Not",
    genre: "CQB Tactical Simulator",
    desc: "Intense, claustrophobic SWAT scenarios requiring methodical room clearing and strict RoE.",
    img: "https://images.unsplash.com/photo-1623999908865-c75c8cb244e8?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Escape From Tarkov",
    genre: "Hardcore Extraction",
    desc: "High-stakes survival where tactical movement, sound discipline, and gear fear management are crucial.",
    img: "https://images.unsplash.com/photo-1605646194276-80410ff9c00b?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Ground Branch",
    genre: "Tactical CQB",
    desc: "Unforgiving close-quarters combat emphasizing weapon manipulation and angular movement.",
    img: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "DayZ",
    genre: "Survival Sandbox",
    desc: "Long-term survival operations requiring overland navigation, resource management, and ambush tactics.",
    img: "https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Grey Zone Warfare",
    genre: "Tactical Extraction",
    desc: "Persistent open-world warfare focusing on squad-based infiltration and exfiltration in jungle environments.",
    img: "https://images.unsplash.com/photo-1550236520-7050fce0e58f?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Body Cam",
    genre: "Ultra-Realism FPS",
    desc: "Hyper-realistic visual combat emphasizing disorienting firefights and split-second target identification.",
    img: "https://images.unsplash.com/photo-1510168925769-e70a6c6d2c49?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Bellum",
    genre: "Tactical Combat",
    desc: "Emerging tactical shooter requiring sharp reflexes and tight team geometry.",
    img: "https://images.unsplash.com/photo-1533036881729-eb38827eb248?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Exfil",
    genre: "Extraction Shooter",
    desc: "High-intensity operations securing objectives and extracting under heavy enemy pressure.",
    img: "https://images.unsplash.com/photo-1498673394965-85cb14905c89?q=80&w=800&auto=format&fit=crop"
  }
];

export default function Games() {
  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-secondary/50 border-b border-border py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider mb-4">Supported Operations</h1>
            <div className="w-24 h-1 bg-accent mb-4" />
            <p className="text-xl text-muted-foreground max-w-2xl font-sans">
              Our active roster of tactical titles. If it requires communication, strategy, and precision, we operate in it.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GAMES_DATA.map((game, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.1 }}
                className="bg-card border border-border rounded-lg overflow-hidden group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all clip-angled"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors z-10" />
                  <img 
                    src={game.img} 
                    alt={game.name} 
                    className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" 
                  />
                  <div className="absolute top-4 right-4 z-20">
                    <span className="bg-background/90 backdrop-blur text-accent font-display text-xs font-bold px-3 py-1 uppercase tracking-widest border border-accent/20 rounded-sm">
                      {game.genre}
                    </span>
                  </div>
                </div>
                <div className="p-6 relative">
                  <div className="absolute -top-6 right-6 w-12 h-12 bg-card border border-border rounded flex items-center justify-center rotate-45 group-hover:rotate-90 group-hover:border-primary transition-all duration-300 z-20">
                    <Crosshair className="w-5 h-5 text-primary -rotate-45 group-hover:-rotate-90 transition-all duration-300" />
                  </div>
                  <h3 className="text-2xl font-display font-bold uppercase tracking-wider mb-2 text-foreground">{game.name}</h3>
                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">{game.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
