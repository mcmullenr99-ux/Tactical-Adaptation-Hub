import { motion } from "framer-motion";
import { Link } from "wouter";
import { Crosshair, Shield, Users, Target, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useSEO } from "@/hooks/useSEO";

export default function Home() {
  useSEO({ title: "Home", description: "Tactical Adaptation Group — a premier tactical gaming community dedicated to mastering warfighting fundamentals and building brotherhood." });
  return (
    <MainLayout>
      {/* Hero Section — Signal Broadcast */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden bg-[#0d0d0d]">
        {/* Noise grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.05]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />

        {/* Ghost logo watermark */}
        <img
          src={`${import.meta.env.BASE_URL}images/tag-logo.png`}
          width={560}
          alt=""
          className="absolute z-0 pointer-events-none select-none hidden sm:block"
          style={{ right: '-80px', top: '50%', transform: 'translateY(-50%)', filter: 'invert(1)', opacity: 0.05, mixBlendMode: 'screen' }}
          draggable={false}
        />

        {/* Vertical TRANSMISSION label */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 -translate-x-1/2 -rotate-90 text-[10px] tracking-[0.5em] text-neutral-600 font-mono uppercase origin-center whitespace-nowrap z-10 hidden sm:block">
          Transmission
        </div>

        {/* Military timestamp */}
        <div className="absolute top-24 left-8 sm:left-16 text-[#4ade80] opacity-60 font-mono text-xs sm:text-sm tracking-wider z-10">
          20MAR2026 // 0342Z
        </div>

        {/* Main content */}
        <div className="relative z-10 ml-8 sm:ml-24 px-4 sm:px-0 max-w-2xl flex flex-col gap-4 sm:gap-6 mt-16">
          {/* Glitch headline */}
          <motion.h1
            className="flex flex-col font-display font-black uppercase leading-[0.85] text-[clamp(3rem,8vw,6rem)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-white">Train.</span>
            <span className="relative inline-block w-fit">
              <span className="absolute top-0 left-0 text-white opacity-80" style={{ transform: 'translateX(2px)', textShadow: '2px 0 #ef4444' }}>Adapt.</span>
              <span className="absolute top-0 left-0 text-white opacity-80" style={{ transform: 'translateX(-2px)', textShadow: '-2px 0 #22d3ee' }}>Adapt.</span>
              <span className="relative text-white">Adapt.</span>
            </span>
            <span className="text-white">Dominate.</span>
          </motion.h1>

          {/* Frequency bar */}
          <motion.div
            className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono text-neutral-400 tracking-widest border-l-2 border-neutral-700 pl-4 py-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <span>FREQ: 156.800 MHz</span>
            <span className="hidden sm:inline">//</span>
            <span className="hidden sm:inline">UNIT: TAG</span>
            <span className="hidden sm:inline">//</span>
            <span className="flex items-center gap-2">
              STATUS: TRANSMITTING <span className="text-[#4ade80] animate-pulse text-[8px]">●</span>
            </span>
          </motion.div>

          {/* Body copy */}
          <motion.p
            className="text-neutral-300 text-base sm:text-lg leading-relaxed max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.8 }}
          >
            Bringing together tactical gamers to master warfighting fundamentals, build brotherhood, and dominate the battlefield.<span className="inline-block animate-pulse ml-1 text-white">▌</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-start gap-4 font-mono text-sm mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link
              href="/join"
              className="flex items-center gap-3 bg-white text-black px-8 py-4 uppercase tracking-widest font-bold hover:bg-neutral-200 transition-colors active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse flex-shrink-0" />
              Join The Unit
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 uppercase tracking-widest font-bold text-white border-2 border-dashed border-neutral-600 hover:border-neutral-400 transition-colors active:scale-95"
            >
              Read Doctrine
            </Link>
          </motion.div>
        </div>

        {/* Sync bar */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-800/50 z-10 overflow-hidden">
          <div className="h-full w-1/3 bg-neutral-600/30 animate-pulse relative left-1/3" />
        </div>
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
                img: "https://img.youtube.com/vi/M1YBZUxMX8g/hqdefault.jpg"
              },
              {
                name: "Squad",
                type: "Large-Scale Tactical",
                img: "https://img.youtube.com/vi/iDDiDALh9Do/hqdefault.jpg"
              },
              {
                name: "Escape From Tarkov",
                type: "Hardcore Extraction",
                img: "https://img.youtube.com/vi/Dd3MSNfRZ68/hqdefault.jpg"
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
