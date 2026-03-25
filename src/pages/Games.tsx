import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Play, Crosshair, Users, ChevronLeft, Shield, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { apiFetch } from "@/lib/apiFetch";
import { Link } from "wouter";

interface GameData {
  name: string;
  genre: string;
  desc: string;
  youtubeId: string;
  steamAppId: number | null;
  developer: string;
}

const GAMES_DATA: GameData[] = [
  { name: "Arma 3",            genre: "Mil-Sim Sandbox",       desc: "The premier military simulation game. Massive scale combined arms operations requiring intense coordination.", youtubeId: "M1YBZUxMX8g", steamAppId: 107410,  developer: "Bohemia Interactive" },
  { name: "Arma Reforger",     genre: "Modern Mil-Sim",        desc: "The bridge to Arma 4. Cold-war era combat with a rebuilt engine, updated mechanics, and dedicated modding tools.", youtubeId: "8xr_aXNnHpU", steamAppId: 1874880, developer: "Bohemia Interactive" },
  { name: "Squad",             genre: "Large-Scale Tactical",  desc: "50v50 combined arms warfare where communication and unit cohesion dictate the victor.", youtubeId: "iDDiDALh9Do", steamAppId: 393380,  developer: "Offworld Industries" },
  { name: "Ready Or Not",      genre: "CQB Tactical",          desc: "Intense, claustrophobic SWAT scenarios requiring methodical room clearing and strict rules of engagement.", youtubeId: "BbxznEErPZQ", steamAppId: 1144200, developer: "VOID Interactive" },
  { name: "Escape From Tarkov",genre: "Hardcore Extraction",   desc: "High-stakes survival where tactical movement, sound discipline, and gear management are everything.", youtubeId: "Dd3MSNfRZ68", steamAppId: null,    developer: "Battlestate Games" },
  { name: "Ground Branch",     genre: "Tactical CQB",          desc: "Unforgiving close-quarters combat emphasizing weapon manipulation and operator customisation.", youtubeId: "eVStChs5Uuc", steamAppId: 16900,   developer: "BlackFoot Studios" },
  { name: "DayZ",              genre: "Survival Sandbox",      desc: "Long-term survival operations requiring overland navigation, resource management, and ambush tactics.", youtubeId: "3gm2GNfI_WU", steamAppId: 221100,  developer: "Bohemia Interactive" },
  { name: "Grey Zone Warfare", genre: "Tactical Extraction",   desc: "Persistent open-world warfare in jungle environments focusing on squad-based infiltration and exfiltration.", youtubeId: "vHd8fSP-gik", steamAppId: 2479810, developer: "MADFINGER Games" },
  { name: "Body Cam",          genre: "Ultra-Realism FPS",     desc: "Hyper-realistic combat shot through bodycam lens — disorienting firefights and split-second target identification.", youtubeId: "32-pJwpYjD0", steamAppId: 2530350, developer: "Reissad Studio" },
  { name: "Operator",          genre: "Tactical Military",     desc: "Tier 1 special operations across global theatres. Clandestine missions, realistic ballistics, and team-coordinated assaults.", youtubeId: "f_hfe80mVXo", steamAppId: 2166730, developer: "Pdesignation" },
  { name: "Exfil",             genre: "Extraction Shooter",    desc: "Tactical 8v8v8v8 extraction — secure objectives and get out under coordinated enemy pressure.", youtubeId: "RCVUg1mrkEo", steamAppId: 860020,  developer: "Exfil Games" },
  { name: "Hell Let Loose",    genre: "WW2 Tactical",          desc: "100-player WW2 warfare on authentic battlefields demanding unit cohesion and combined arms tactics.", youtubeId: "yqp1sMnOazg", steamAppId: 686810,  developer: "Black Matter" },
];

// Normalise game name for loose matching with registry entries
function normGame(g: string) { return g.toLowerCase().replace(/[^a-z0-9]/g, ""); }

export default function Games() {
  useSEO({ title: "Supported Games", description: "TAG supports a range of tactical games. Find all units by game." });
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);

  if (selectedGame) {
    return <GameSubpage game={selectedGame} onBack={() => setSelectedGame(null)} />;
  }

  return (
    <MainLayout>
      <div className="bg-secondary/50 border-b border-border py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider mb-4">Supported Operations</h1>
            <div className="w-24 h-1 bg-accent mb-4" />
            <p className="text-xl text-muted-foreground max-w-2xl font-sans">
              Our active roster of tactical titles. Click any game to see all registered units.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GAMES_DATA.map((game, i) => (
              <GameCard key={i} game={game} index={i} onSelect={() => setSelectedGame(game)} />
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

function GameCard({ game, index, onSelect }: { game: GameData; index: number; onSelect: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${game.youtubeId}/hqdefault.jpg`;
  const steamFallback = game.steamAppId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/capsule_616x353.jpg`
    : null;
  const bgImage = imgError && steamFallback ? steamFallback : thumbnailUrl;
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if ((e.currentTarget as HTMLImageElement).naturalWidth < 300) setImgError(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.1 }}
      className="bg-card border border-border rounded-lg overflow-hidden group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all clip-angled flex flex-col"
    >
      <div className="relative h-52 overflow-hidden bg-black">
        {playing ? (
          <iframe className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${game.youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
            title={`${game.name} trailer`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <>
            <img src={bgImage} alt={`${game.name} trailer`}
              className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              onError={() => setImgError(true)} onLoad={handleImgLoad} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-background/90 backdrop-blur text-accent font-display text-xs font-bold px-3 py-1 uppercase tracking-widest border border-accent/20 rounded-sm">{game.genre}</span>
            </div>
            <button onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center z-10 group/play" aria-label={`Watch ${game.name} trailer`}>
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
        <button onClick={onSelect}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded font-display font-bold uppercase tracking-widest text-xs px-4 py-2.5 transition-all">
          <Users className="w-3.5 h-3.5" /> View Registered Units
        </button>
      </div>
    </motion.div>
  );
}

function GameSubpage({ game, onBack }: { game: GameData; onBack: () => void }) {
  useSEO({ title: `${game.name} Units`, description: `All TAG-registered milsim units playing ${game.name}.` });
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any[]>("/api/milsim-groups")
      .then((all: any) => {
        const list = Array.isArray(all) ? all : (all?.groups ?? []);
        const norm = normGame(game.name);
        const filtered = list.filter((g: any) => {
          const games: string[] = Array.isArray(g.games) ? g.games : [];
          return games.some(gm => normGame(gm).includes(norm) || norm.includes(normGame(gm)));
        });
        setGroups(filtered);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [game.name]);

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-secondary/50 border-b border-border py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-display text-xs uppercase tracking-widest mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Games
          </button>
          <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-wider mb-2">{game.name}</h1>
          <div className="w-16 h-1 bg-accent mb-3" />
          <p className="text-muted-foreground font-sans">{game.desc}</p>
        </div>
      </div>

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : groups.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border rounded-lg">
              <Shield className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="font-display text-xl uppercase tracking-widest text-muted-foreground mb-2">No Units Registered</p>
              <p className="text-sm text-muted-foreground font-sans mb-6">Be the first to register a unit for {game.name}.</p>
              <Link href="/milsim/register">
                <a className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm px-6 py-3 rounded transition-all">
                  Register Your Unit
                </a>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground font-sans mb-6">{groups.length} unit{groups.length !== 1 ? "s" : ""} registered for {game.name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((g: any) => (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-all group flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center shrink-0 overflow-hidden border border-border">
                        {g.logoUrl || g.logo_url
                          ? <img src={g.logoUrl ?? g.logo_url} alt="" className="w-full h-full object-contain p-1" />
                          : <Shield className="w-5 h-5 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-foreground truncate">{g.name}</span>
                          {(g.is_verified || (g as any).isVerified) && (
                            <span className="text-[9px] text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">✓ Verified</span>
                          )}
                          {(g.is_pro || (g as any).isPro) && (
                            <span className="text-[9px] text-primary border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Pro</span>
                          )}
                        </div>
                        {(g.tagLine ?? g.tag_line) && (
                          <p className="text-xs text-primary font-display font-bold uppercase tracking-wider truncate mt-0.5">{g.tagLine ?? g.tag_line}</p>
                        )}
                      </div>
                    </div>
                    {(g.description) && (
                      <p className="text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">{g.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {(g.country) && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground font-display uppercase tracking-wider">{g.country}</span>}
                      {(g.branch) && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground font-display uppercase tracking-wider">{g.branch}</span>}
                    </div>
                    <Link href={`/milsim/${g.slug}`}>
                      <a className="flex items-center justify-center gap-2 w-full border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground rounded font-display font-bold uppercase tracking-widest text-[10px] px-3 py-2 transition-all">
                        View Unit <ExternalLink className="w-3 h-3" />
                      </a>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
