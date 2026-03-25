import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Play, Crosshair, User, UserCheck } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

interface GameData {
  name: string;
  genre: string;
  desc: string;
  youtubeId: string;
  steamAppId: number | null;
  developer: string;
  operator: string | null;
}

const GAMES_DATA: GameData[] = [
  {
    name: "Arma 3",
    genre: "Mil-Sim Sandbox",
    desc: "The premier military simulation game. Massive scale combined arms operations requiring intense coordination.",
    youtubeId: "M1YBZUxMX8g",
    steamAppId: 107410,
    developer: "Bohemia Interactive",
    operator: null,
  },
  {
    name: "Arma Reforger",
    genre: "Modern Mil-Sim",
    desc: "The bridge to Arma 4. Cold-war era combat with a rebuilt engine, updated mechanics, and dedicated modding tools.",
    youtubeId: "8xr_aXNnHpU",
    steamAppId: 1874880,
    developer: "Bohemia Interactive",
    operator: null,
  },
  {
    name: "Squad",
    genre: "Large-Scale Tactical FPS",
    desc: "50v50 combined arms warfare where communication and unit cohesion dictate the victor.",
    youtubeId: "iDDiDALh9Do",
    steamAppId: 393380,
    developer: "Offworld Industries",
    operator: null,
  },
  {
    name: "Ready Or Not",
    genre: "CQB Tactical Simulator",
    desc: "Intense, claustrophobic SWAT scenarios requiring methodical room clearing and strict rules of engagement.",
    youtubeId: "BbxznEErPZQ",
    steamAppId: 1144200,
    developer: "VOID Interactive",
    operator: null,
  },
  {
    name: "Escape From Tarkov",
    genre: "Hardcore Extraction",
    desc: "High-stakes survival where tactical movement, sound discipline, and gear management are everything.",
    youtubeId: "Dd3MSNfRZ68",
    steamAppId: null,
    developer: "Battlestate Games",
    operator: null,
  },
  {
    name: "Ground Branch",
    genre: "Tactical CQB",
    desc: "Unforgiving close-quarters combat emphasizing weapon manipulation, angular movement, and operator customisation.",
    youtubeId: "eVStChs5Uuc",
    steamAppId: 16900,
    developer: "BlackFoot Studios",
    operator: null,
  },
  {
    name: "DayZ",
    genre: "Survival Sandbox",
    desc: "Long-term survival operations requiring overland navigation, resource management, and ambush tactics.",
    youtubeId: "3gm2GNfI_WU",
    steamAppId: 221100,
    developer: "Bohemia Interactive",
    operator: null,
  },
  {
    name: "Grey Zone Warfare",
    genre: "Tactical Extraction",
    desc: "Persistent open-world warfare in jungle environments focusing on squad-based infiltration and exfiltration.",
    youtubeId: "vHd8fSP-gik",
    steamAppId: 2479810,
    developer: "MADFINGER Games",
    operator: null,
  },
  {
    name: "Body Cam",
    genre: "Ultra-Realism FPS",
    desc: "Hyper-realistic combat shot through bodycam lens — disorienting firefights and split-second target identification.",
    youtubeId: "32-pJwpYjD0",
    steamAppId: 2530350,
    developer: "Reissad Studio",
    operator: null,
  },
  {
    name: "Bellum",
    genre: "Tactical Combat",
    desc: "Next-generation tactical shooter built from the ground up for precision, teamwork, and realistic ballistics.",
    youtubeId: "MZQ6HWvK4qU",
    steamAppId: null,
    developer: "Bellum Studios",
    operator: null,
  },
  {
    name: "Operator",
    genre: "Tactical Military Shooter",
    desc: "Tier 1 special operations across global theatres. Clandestine missions, realistic ballistics, and team-coordinated assaults.",
    youtubeId: "f_hfe80mVXo",
    steamAppId: 2166730,
    developer: "Pdesignation",
    operator: null,
  },
  {
    name: "Exfil",
    genre: "Extraction Shooter",
    desc: "Tactical 8v8v8v8 extraction — secure objectives and get out under coordinated enemy pressure.",
    youtubeId: "RCVUg1mrkEo",
    steamAppId: 860020,
    developer: "Exfil Games",
    operator: null,
  },
];

export default function Games() {
  useSEO({ title: "Supported Games", description: "TAG supports a range of tactical games — Arma Reforger, Squad, Hell Let Loose, and more. Find your battlefield." });
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
              <GameCard key={i} game={game} index={i} />
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

function GameCard({ game, index }: { game: GameData; index: number }) {
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${game.youtubeId}/hqdefault.jpg`;
  const steamFallback = game.steamAppId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/capsule_616x353.jpg`
    : null;

  const bgImage = imgError && steamFallback ? steamFallback : thumbnailUrl;

  // YouTube serves a tiny 120x90 grey image when the thumbnail is unavailable.
  // Detect this by checking natural width on load and fall back to Steam CDN.
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if ((e.currentTarget as HTMLImageElement).naturalWidth < 300) {
      setImgError(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.1 }}
      className="bg-card border border-border rounded-lg overflow-hidden group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all clip-angled"
    >
      {/* Video / Thumbnail Area */}
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
            {/* Thumbnail */}
            <img
              src={bgImage}
              alt={`${game.name} cinematic trailer thumbnail`}
              className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              onError={() => setImgError(true)}
              onLoad={handleImgLoad}
            />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Genre badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-background/90 backdrop-blur text-accent font-display text-xs font-bold px-3 py-1 uppercase tracking-widest border border-accent/20 rounded-sm">
                {game.genre}
              </span>
            </div>

            {/* Play button */}
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center z-10 group/play"
              aria-label={`Watch ${game.name} trailer`}
            >
              <div className="w-14 h-14 rounded-full bg-black/60 border-2 border-white/80 flex items-center justify-center backdrop-blur-sm group-hover/play:bg-primary group-hover/play:border-primary transition-all duration-200 scale-90 group-hover:scale-100">
                <Play className="w-5 h-5 text-white fill-white ml-1" />
              </div>
            </button>

            {/* Developer tag at bottom */}
            <div className="absolute bottom-3 left-3 z-10">
              <span className="text-white/60 font-display text-[10px] uppercase tracking-widest">{game.developer}</span>
            </div>
          </>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6 relative">
        <div className="absolute -top-6 right-6 w-12 h-12 bg-card border border-border rounded flex items-center justify-center rotate-45 group-hover:rotate-90 group-hover:border-primary transition-all duration-300 z-20">
          <Crosshair className="w-5 h-5 text-primary -rotate-45 group-hover:-rotate-90 transition-all duration-300" />
        </div>

        <h3 className="text-2xl font-display font-bold uppercase tracking-wider mb-2 text-foreground">{game.name}</h3>
        <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-5">{game.desc}</p>

        {/* Game Operator */}
        <div className="flex items-center gap-2.5 pt-4 border-t border-border/60">
          {game.operator ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <div>
                <span className="font-display font-bold uppercase tracking-widest text-[10px] text-muted-foreground block leading-none mb-0.5">Game Op</span>
                <span className="font-display font-bold uppercase tracking-wider text-xs text-foreground">{game.operator}</span>
              </div>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <div>
                <span className="font-display font-bold uppercase tracking-widest text-[10px] text-muted-foreground block leading-none mb-0.5">Game Op</span>
                <span className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground/50">Seeking Operator</span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
