import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/apiFetch";
import { Crosshair, Shield, Users, Target, ArrowRight, BookOpen, Map, Award, BarChart2, Radio, Zap, Star, Globe, Play } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useSEO } from "@/hooks/useSEO";

const HOME_GAMES = [
  { name: "Arma 3",             genre: "Mil-Sim Sandbox",      desc: "The premier military simulation game. Massive scale combined arms operations requiring intense coordination.",                                               youtubeId: "M1YBZUxMX8g", steamAppId: 107410,  developer: "Bohemia Interactive" },
  { name: "Arma Reforger",      genre: "Modern Mil-Sim",       desc: "The bridge to Arma 4. Cold-war era combat with a rebuilt engine, updated mechanics, and dedicated modding tools.",                                          youtubeId: "8xr_aXNnHpU", steamAppId: 1874880, developer: "Bohemia Interactive" },
  { name: "Squad",              genre: "Large-Scale Tactical", desc: "50v50 combined arms warfare where communication and unit cohesion dictate the victor.",                                                                     youtubeId: "iDDiDALh9Do", steamAppId: 393380,  developer: "Offworld Industries" },
  { name: "Ready Or Not",       genre: "CQB Tactical",         desc: "Intense, claustrophobic SWAT scenarios requiring methodical room clearing and strict rules of engagement.",                                                  youtubeId: "BbxznEErPZQ", steamAppId: 1144200, developer: "VOID Interactive" },
  { name: "Escape From Tarkov", genre: "Hardcore Extraction",  desc: "High-stakes survival where tactical movement, sound discipline, and gear management are everything.",                                                       youtubeId: "Dd3MSNfRZ68", steamAppId: null,    developer: "Battlestate Games" },
  { name: "Ground Branch",      genre: "Tactical CQB",         desc: "Unforgiving close-quarters combat emphasising weapon manipulation and operator customisation.",                                                              youtubeId: "eVStChs5Uuc", steamAppId: 16900,   developer: "BlackFoot Studios" },
  { name: "DayZ",               genre: "Survival Sandbox",     desc: "Long-term survival operations requiring overland navigation, resource management, and ambush tactics.",                                                     youtubeId: "3gm2GNfI_WU", steamAppId: 221100,  developer: "Bohemia Interactive" },
  { name: "Grey Zone Warfare",  genre: "Tactical Extraction",  desc: "Persistent open-world warfare in jungle environments focusing on squad-based infiltration and exfiltration.",                                               youtubeId: "vHd8fSP-gik", steamAppId: 2479810, developer: "MADFINGER Games" },
  { name: "Body Cam",           genre: "Ultra-Realism FPS",    desc: "Hyper-realistic combat shot through bodycam lens — disorienting firefights and split-second target identification.",                                        youtubeId: "32-pJwpYjD0", steamAppId: 2530350, developer: "Reissad Studio" },
  { name: "Operator",           genre: "Tactical Military",    desc: "Tier 1 special operations across global theatres. Clandestine missions, realistic ballistics, and team-coordinated assaults.",                             youtubeId: "f_hfe80mVXo", steamAppId: 2166730, developer: "Pdesignation" },
  { name: "Exfil",              genre: "Extraction Shooter",   desc: "Tactical 8v8v8v8 extraction — secure objectives and get out under coordinated enemy pressure.",                                                             youtubeId: "RCVUg1mrkEo", steamAppId: 860020,  developer: "Exfil Games" },
  { name: "Hell Let Loose",     genre: "WW2 Tactical",         desc: "100-player WW2 warfare on authentic battlefields demanding unit cohesion and combined arms tactics.",                                                       youtubeId: "yqp1sMnOazg", steamAppId: 686810,  developer: "Black Matter" },
];

function HomeGameCard({ game, index }: { game: typeof HOME_GAMES[0]; index: number }) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${game.youtubeId}/hqdefault.jpg`;
  const steamFallback = game.steamAppId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/capsule_616x353.jpg`
    : null;
  const bgImage = imgError && steamFallback ? steamFallback : thumbnailUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.1 }}
      className="bg-card border border-border rounded-lg overflow-hidden group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col"
    >
      <div className="relative h-52 overflow-hidden bg-black">
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${game.youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
            title={`${game.name} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={bgImage} alt={`${game.name} trailer`}
              className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              onError={() => setImgError(true)}
              onLoad={(e) => { if ((e.currentTarget as HTMLImageElement).naturalWidth < 300) setImgError(true); }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-background/90 backdrop-blur text-accent font-display text-xs font-bold px-3 py-1 uppercase tracking-widest border border-accent/20 rounded-sm">{game.genre}</span>
            </div>
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center z-10 group/play"
              aria-label={`Watch ${game.name} trailer`}
            >
              <div className="w-14 h-14 rounded-full bg-black/60 border-2 border-white/80 flex items-center justify-center backdrop-blur-sm group-hover/play:bg-primary group-hover/play:border-primary transition-all duration-200 scale-90 group-hover:scale-100">
                <Play className="w-5 h-5 text-white fill-white ml-1" />
              </div>
            </button>
            <div className="absolute bottom-3 left-3 z-10">
              <span className="text-white/60 font-display text-[10px] uppercase tracking-widest">{game.developer}</span>
            </div>
          </>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-2xl font-display font-bold uppercase tracking-wider mb-2 text-foreground">{game.name}</h3>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-4">{game.desc}</p>
        </div>
        <Link
          href={`/milsim?game=${encodeURIComponent(game.name)}`}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded font-display font-bold uppercase tracking-widest text-xs px-4 py-2.5 transition-all"
        >
          <Users className="w-3.5 h-3.5" /> View Registered Units
        </Link>
      </div>
    </motion.div>
  );
}


export default function Home() {
  useSEO({ title: "Home", description: "Tactical Adaptation Group — the milsim management platform for serious units. PJHQ command tools, op planning, roster management and more." });

  const [timestamp, setTimestamp] = useState("");
  const [unitCount, setUnitCount] = useState<string | number>("...");
  const [opsCount, setOpsCount] = useState<string | number>("...");

  useEffect(() => {
    // Live timestamp in military format
    function updateTimestamp() {
      const now = new Date();
      const day = String(now.getUTCDate()).padStart(2, "0");
      const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const month = months[now.getUTCMonth()];
      const year = now.getUTCFullYear();
      const hh = String(now.getUTCHours()).padStart(2, "0");
      const mm = String(now.getUTCMinutes()).padStart(2, "0");
      setTimestamp(`${day}${month}${year} // ${hh}${mm}Z`);
    }
    updateTimestamp();
    const interval = setInterval(updateTimestamp, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Pull live unit + ops counts
    apiFetch("/api/milsim-groups-b/stats/public")
      .then(r => r.json())
      .then(d => {
        if (d?.unit_count != null) setUnitCount(d.unit_count);
        if (d?.ops_count != null) setOpsCount(d.ops_count);
      })
      .catch(() => {
        setUnitCount("—");
        setOpsCount("—");
      });
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden bg-[#0d0d0d]">
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.05]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />
        <img
          src={`${import.meta.env.BASE_URL}images/tag-logo.png`}
          width={560}
          alt=""
          className="absolute z-0 pointer-events-none select-none hidden sm:block"
          style={{ right: '-80px', top: '50%', transform: 'translateY(-50%)', filter: 'invert(1)', opacity: 0.05, mixBlendMode: 'screen' }}
          draggable={false}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 -translate-x-1/2 -rotate-90 text-[10px] tracking-[0.5em] text-neutral-600 font-mono uppercase origin-center whitespace-nowrap z-10 hidden sm:block">
          Transmission
        </div>
        <div className="absolute top-24 left-8 sm:left-16 text-[#4ade80] opacity-60 font-mono text-xs sm:text-sm tracking-wider z-10">
          {timestamp}
        </div>
        <div className="relative z-10 ml-8 sm:ml-24 px-4 sm:px-0 max-w-2xl flex flex-col gap-4 sm:gap-6 mt-16">
          <motion.h1
            className="flex flex-col font-display font-black uppercase leading-[0.85] text-[clamp(3rem,8vw,6rem)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-white">Command.</span>
            <span className="relative inline-block w-fit">
              <span className="absolute top-0 left-0 text-white opacity-80" style={{ transform: 'translateX(2px)', textShadow: '2px 0 #ef4444' }}>Adapt.</span>
              <span className="absolute top-0 left-0 text-white opacity-80" style={{ transform: 'translateX(-2px)', textShadow: '-2px 0 #22d3ee' }}>Adapt.</span>
              <span className="relative text-white">Adapt.</span>
            </span>
            <span className="text-white">Dominate.</span>
          </motion.h1>
          <motion.div
            className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono text-neutral-400 tracking-widest border-l-2 border-neutral-700 pl-4 py-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <span>FREQ: 156.800 MHz</span>
            <span className="hidden sm:inline">//</span>
            <span className="hidden sm:inline">PLATFORM: ONLINE</span>
            <span className="hidden sm:inline">//</span>
            <span className="flex items-center gap-2">
              STATUS: TRANSMITTING <span className="text-[#4ade80] animate-pulse text-[8px]">●</span>
            </span>
          </motion.div>
          <motion.p
            className="text-neutral-300 text-base sm:text-lg leading-relaxed max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.8 }}
          >
            The milsim management platform built for serious units. PJHQ command tools, op planning, roster management, intel tracking — everything your unit needs in one place.<span className="inline-block animate-pulse ml-1 text-white">▌</span>
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-start gap-4 font-mono text-sm mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link
              href="/milsim/register"
              className="flex items-center gap-3 bg-white text-black px-8 py-4 uppercase tracking-widest font-bold hover:bg-neutral-200 transition-colors active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse flex-shrink-0" />
              Register Your Unit
            </Link>
            <Link
              href="/milsim-registry"
              className="px-8 py-4 uppercase tracking-widest font-bold text-white border-2 border-dashed border-neutral-600 hover:border-neutral-400 transition-colors active:scale-95"
            >
              Browse Registry
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-800/50 z-10 overflow-hidden">
          <div className="h-full w-1/3 bg-neutral-600/30 animate-pulse relative left-1/3" />
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 bg-secondary/50 relative border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded text-primary font-display font-bold uppercase tracking-widest text-xs mb-5">
              <Zap className="w-3 h-3" /> Platform Features
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-4">Everything Your Unit Needs</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop managing your unit across 5 different Discord channels and spreadsheets. TAG gives you a proper command infrastructure.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Radio className="w-8 h-8 text-primary" />,
                title: "PJHQ Command Structure",
                desc: "Full J-code command hierarchy — J1 through J8. HR, Intel, Ops, Logistics, Planning, Comms, Training and more. Proper military structure for your unit."
              },
              {
                icon: <Map className="w-8 h-8 text-primary" />,
                title: "Op Planning & AO Maps",
                desc: "Full op planning suite with WARNOs, briefings, AO maps, LACE reports, SITREPs and SALUTE. Plan and execute like professionals."
              },
              {
                icon: <Users className="w-8 h-8 text-primary" />,
                title: "Roster & Rank Management",
                desc: "Full roster with ranks, roles, specialisations, awards, ribbons, and qualifications. Promotion rules, conduct reports and LOA tracking built in."
              },
              {
                icon: <BookOpen className="w-8 h-8 text-primary" />,
                title: "Training & Doctrine",
                desc: "Upload SOPs, TTPs, field manuals and drill docs. AI-powered quality scoring. Training reviews and exercise tracking to keep standards high."
              },
              {
                icon: <Shield className="w-8 h-8 text-primary" />,
                title: "Intel & Campaign Tracking",
                desc: "J2 intelligence archive, threat profiles, campaign management and AAR tracking. Build a real operational history for your unit."
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-primary" />,
                title: "Analytics & Leaderboards",
                desc: "Member engagement scoring, op frequency tracking, unit health dashboard. Know exactly who is performing and who needs attention."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-card border border-border p-8 rounded-lg hover:border-primary/50 transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                <div className="mb-5 bg-secondary w-14 h-14 flex items-center justify-center rounded group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-display font-bold uppercase tracking-wider mb-3">{feature.title}</h3>
                <p className="text-muted-foreground font-sans leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Commander Pro */}
      <section className="py-24 border-t border-border bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 font-display font-bold uppercase tracking-widest text-xs mb-5">
                <Star className="w-3 h-3" /> Commander Pro
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-4">Unlock Advanced Command Tools</h2>
              <div className="w-24 h-1 bg-amber-500 mb-8" />
              <p className="text-muted-foreground font-sans leading-relaxed mb-8">
                Commander Pro unlocks the full platform — AI op debriefs, automated promotion engine, unit health scoring, featured registry placement, auto recruitment scheduling and more.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  "AI-powered op debriefs & training reviews",
                  "Automated promotion rule engine",
                  "Unit health & engagement dashboard",
                  "Featured placement in the registry",
                  "Auto recruitment scheduler",
                  "Joint Ops combat records & leaderboard"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-sans">
                    <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/commander-pro"
                className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-black font-display font-bold uppercase tracking-widest text-sm px-8 py-4 transition-all active:scale-95"
              >
                <Star className="w-4 h-4" /> View Commander Pro
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Active Units", value: unitCount, icon: <Globe className="w-5 h-5 text-primary" /> },
                { label: "Ops Logged", value: opsCount, icon: <Target className="w-5 h-5 text-primary" /> },
                { label: "Games Supported", value: "12+", icon: <Crosshair className="w-5 h-5 text-primary" /> },
                { label: "Pro Features", value: "25+", icon: <Award className="w-5 h-5 text-amber-400" /> }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-secondary border border-border rounded-lg p-6 flex flex-col gap-3"
                >
                  <div className="w-10 h-10 bg-background rounded flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-display font-black text-foreground">{stat.value}</div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Games */}
      <section className="py-24 relative overflow-hidden border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-2">Supported Operations</h2>
            <div className="w-24 h-1 bg-accent mb-4"></div>
            <p className="text-muted-foreground text-sm">Our active roster of tactical titles. Click any game to see all registered units.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {HOME_GAMES.map((game, i) => (
              <HomeGameCard key={i} game={game} index={i} />
            ))}
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
            Register your unit for free and get access to the full TAG platform. No spreadsheets. No Discord chaos. Just proper command infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/milsim/register"
              className="inline-block font-display font-bold uppercase tracking-widest text-lg bg-primary text-primary-foreground px-10 py-5 shadow-[0_0_20px_hsla(var(--primary),0.3)] hover:shadow-[0_0_30px_hsla(var(--primary),0.6)] hover:bg-primary/90 transition-all active:scale-95"
            >
              Register Your Unit — Free
            </Link>
            <Link
              href="/milsim-registry"
              className="inline-block font-display font-bold uppercase tracking-widest text-sm border-2 border-border text-foreground px-8 py-5 hover:border-primary/50 transition-all active:scale-95"
            >
              Browse Registry
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
