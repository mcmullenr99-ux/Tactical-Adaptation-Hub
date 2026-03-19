import { motion } from "framer-motion";
import { Link } from "wouter";
import { Crosshair, Shield, Users, Target, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Tactical map background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-primary font-display font-bold tracking-[0.3em] uppercase mb-4 text-sm sm:text-base">
              Tactical Adaptation Group
            </h2>
          </motion.div>
          
          <motion.h1 
            className="text-5xl sm:text-7xl md:text-8xl font-display font-bold tracking-tight uppercase mb-6 text-foreground text-glow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Train. <span className="text-primary">Adapt.</span> Dominate.
          </motion.h1>
          
          <motion.p 
            className="text-lg sm:text-xl text-muted-foreground font-sans max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Bringing together tactical gamers to master warfighting fundamentals, build brotherhood, and dominate the battlefield.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link 
              href="/join" 
              className="w-full sm:w-auto font-display font-bold uppercase tracking-widest text-lg bg-accent text-accent-foreground px-8 py-4 rounded clip-angled shadow-[0_0_20px_hsla(var(--accent),0.3)] hover:shadow-[0_0_30px_hsla(var(--accent),0.6)] hover:bg-yellow-400 transition-all active:scale-95"
            >
              Join The Unit
            </Link>
            <Link 
              href="/about" 
              className="w-full sm:w-auto font-display font-bold uppercase tracking-widest text-lg bg-secondary text-foreground border border-border px-8 py-4 rounded clip-angled hover:border-primary hover:text-primary transition-all active:scale-95"
            >
              Read Doctrine
            </Link>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="font-display uppercase text-xs tracking-widest text-primary">Scroll</span>
          <div className="w-[1px] h-8 bg-primary" />
        </motion.div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-secondary/50 relative border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-4">Why Join TAG?</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We aren't just another clan. We are a dedicated unit focused on tactical excellence, continuous improvement, and teamwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-10 h-10 text-primary" />,
                title: "Tactical Training",
                desc: "Learn real-world warfighting fundamentals adapted for gaming environments. CQB, map reading, and advanced movement."
              },
              {
                icon: <Users className="w-10 h-10 text-primary" />,
                title: "Unbreakable Brotherhood",
                desc: "Join a mature, respectful community where your teammates have your back, both in-game and out."
              },
              {
                icon: <Shield className="w-10 h-10 text-primary" />,
                title: "Skill Development",
                desc: "Elevate your gameplay. We focus on continuous improvement, communication protocols, and strategic execution."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-card border border-border p-8 rounded-lg hover:border-primary/50 transition-colors group relative overflow-hidden clip-angled"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                <div className="mb-6 bg-secondary w-16 h-16 flex items-center justify-center rounded clip-angled-sm group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider mb-3">{feature.title}</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background/95" />
          <img 
            src={`${import.meta.env.BASE_URL}images/tactical-texture.png`}
            alt="Texture" 
            className="w-full h-full object-cover opacity-10 mix-blend-overlay"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-4">Supported Operations</h2>
              <div className="w-24 h-1 bg-accent"></div>
            </div>
            <Link href="/games" className="group flex items-center gap-2 text-primary font-display font-bold uppercase tracking-wider hover:text-accent transition-colors">
              View All Games <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Arma 3",
                type: "Mil-Sim Sandbox",
                img: "https://images.unsplash.com/photo-1579975096649-e773152b04cb?q=80&w=800&auto=format&fit=crop" /* stock military vehicle/landscape */
              },
              {
                name: "Squad",
                type: "Large-Scale Tactical",
                img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop" /* stock soldiers team */
              },
              {
                name: "Escape From Tarkov",
                type: "Hardcore Extraction",
                img: "https://images.unsplash.com/photo-1605646194276-80410ff9c00b?q=80&w=800&auto=format&fit=crop" /* stock tactical gear/gun */
              }
            ].map((game, i) => (
              <Link key={i} href="/games">
                <div className="group relative h-80 rounded overflow-hidden border border-border hover:border-accent transition-all cursor-pointer">
                  <img src={game.img} alt={game.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <span className="text-xs font-display font-bold tracking-widest uppercase text-accent mb-2 block">
                      {game.type}
                    </span>
                    <h3 className="text-2xl font-display font-bold uppercase tracking-wider text-white flex items-center justify-between">
                      {game.name}
                      <Crosshair className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Community Photo Section */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
          <div className="relative">
            <img
              src={`${import.meta.env.BASE_URL}images/tag-community.jpg`}
              alt="TAG operators in the field"
              className="w-full h-full object-cover object-center min-h-[400px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background lg:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent lg:hidden" />
          </div>
          <div className="flex flex-col justify-center px-8 sm:px-12 py-20 bg-background">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-primary font-display font-bold tracking-[0.25em] uppercase text-sm mb-4 block">Brotherhood in the Field</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-4 leading-tight">
                Real Tactics.<br /><span className="text-primary">Real Brotherhood.</span>
              </h2>
              <div className="w-16 h-1 bg-accent mb-8" />
              <p className="text-muted-foreground font-sans leading-relaxed mb-6">
                TAG isn't about racking up kills — it's about executing with precision, communicating under pressure, and building the kind of trust that only comes from shared experience. Our members don't just play together. They train together.
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed mb-10">
                From Arma 3 mil-sim campaigns to high-stakes Tarkov raids, we bring warfighting fundamentals to every server we step into.
              </p>
              <a
                href="https://discord.gg/matmFhU4yg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 font-display font-bold uppercase tracking-widest text-sm bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded clip-angled shadow-[0_0_20px_rgba(88,101,242,0.25)] hover:shadow-[0_0_30px_rgba(88,101,242,0.45)] transition-all active:scale-95 w-fit"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.076.11 18.094.127 18.105a19.904 19.904 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Join Us on Discord
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-primary/20 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Shield className="w-16 h-16 text-primary mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-6">Ready to Deploy?</h2>
          <p className="text-xl text-muted-foreground font-sans mb-10 max-w-2xl mx-auto">
            Stop running with randoms. Join a community that values communication, tactics, and teamwork above all else.
          </p>
          <Link 
            href="/join" 
            className="inline-block font-display font-bold uppercase tracking-widest text-lg bg-primary text-primary-foreground px-10 py-5 rounded clip-angled shadow-[0_0_20px_hsla(var(--primary),0.3)] hover:shadow-[0_0_30px_hsla(var(--primary),0.6)] hover:bg-primary/90 transition-all active:scale-95"
          >
            Commence Enlistment
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
