import React, { useState, useEffect } from 'react';
import { Crosshair, Target, Activity, Zap, Shield, Navigation } from 'lucide-react';

export default function HudScan() {
  const [time, setTime] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(`${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[720px] max-w-[1280px] mx-auto overflow-hidden text-green-500 font-mono select-none flex flex-col" style={{ backgroundColor: '#050a07' }}>
      
      {/* Scanline Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 z-50 opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #00ff00 1px, #00ff00 2px)',
          backgroundSize: '100% 2px'
        }}
      />
      
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />

      {/* Corner Brackets */}
      <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-green-500/50 z-10" />
      <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-green-500/50 z-10" />
      <div className="absolute bottom-16 left-6 w-16 h-16 border-b-2 border-l-2 border-green-500/50 z-10" />
      <div className="absolute bottom-16 right-6 w-16 h-16 border-b-2 border-r-2 border-green-500/50 z-10" />

      {/* Top Bar / Telemetry */}
      <div className="absolute top-6 left-8 right-8 flex justify-between items-start z-20 text-xs">
        <div className="flex flex-col gap-1 opacity-70">
          <div className="flex items-center gap-2"><Activity size={12} className="text-green-400" /> SYS.ONLINE</div>
          <div>UPLINK: SECURE</div>
          <div>LATENCY: 14ms</div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="tracking-[0.2em] font-bold text-green-400">TACTICAL ADAPTATION GROUP</div>
          <div className="opacity-50">HUD_OS v4.2.1</div>
        </div>

        <div className="flex flex-col items-end gap-1 opacity-70">
          <div>{time}</div>
          <div>COORD: 34.0522° N, 118.2437° W</div>
          <div>MODE: COMBAT</div>
        </div>
      </div>

      {/* TOP SECRET Stamp */}
      <div className="absolute top-20 right-16 z-30 transform rotate-[15deg]">
        <div className="border-4 border-red-600/80 text-red-600/80 font-bold text-xl px-4 py-1 tracking-widest backdrop-blur-sm bg-red-900/10">
          TOP SECRET<br/>// NOFORN
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex items-center justify-between px-16 z-20 mt-12 mb-10">
        
        {/* Left Side: SITREP */}
        <div className="w-[30%] space-y-8">
          <div className="space-y-2 group">
            <div className="text-green-400/50 text-xs tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500/50 block group-hover:bg-green-400" />
              OBJECTIVE
            </div>
            <div className="text-sm leading-relaxed border-l border-green-500/30 pl-3 py-1">
              TRAIN. ADAPT. DOMINATE. Establish operational superiority through rigorous preparation.
            </div>
          </div>

          <div className="space-y-2 group">
            <div className="text-green-400/50 text-xs tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500/50 block group-hover:bg-green-400" />
              SITUATION
            </div>
            <div className="text-sm leading-relaxed border-l border-green-500/30 pl-3 py-1">
              Bringing together tactical gamers to master warfighting fundamentals, build brotherhood, and dominate the battlefield.
            </div>
          </div>

          <div className="space-y-2 group">
            <div className="text-green-400/50 text-xs tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500/50 block group-hover:bg-green-400" />
              UNIT DESIGNATION
            </div>
            <div className="text-sm leading-relaxed border-l border-green-500/30 pl-3 py-1 text-green-300 font-bold tracking-wider">
              TACTICAL ADAPTATION GROUP [TAG]
            </div>
          </div>
        </div>

        {/* Center: Reticle & Logo */}
        <div className="relative flex items-center justify-center w-[40%]">
          {/* Animated Reticle SVG */}
          <svg className="absolute w-[400px] h-[400px] opacity-40 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.2" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 20" />
            
            <line x1="50" y1="0" x2="50" y2="15" stroke="currentColor" strokeWidth="1" />
            <line x1="50" y1="85" x2="50" y2="100" stroke="currentColor" strokeWidth="1" />
            <line x1="0" y1="50" x2="15" y2="50" stroke="currentColor" strokeWidth="1" />
            <line x1="85" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1" />
            
            <path d="M 10,10 L 20,20 M 90,10 L 80,20 M 10,90 L 20,80 M 90,90 L 80,80" stroke="currentColor" strokeWidth="0.5" />
          </svg>
          
          <svg className="absolute w-[300px] h-[300px] opacity-30 animate-[spin_40s_linear_reverse_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#00ff00" strokeWidth="0.2" />
            <path d="M 5,50 A 45,45 0 0,1 95,50" fill="none" stroke="#00ff00" strokeWidth="1.5" strokeDasharray="5 15" />
          </svg>

          {/* Crosshair Center */}
          <div className="absolute w-[2px] h-[20px] bg-green-500/60" />
          <div className="absolute w-[20px] h-[2px] bg-green-500/60" />

          {/* TAG Logo */}
          <div className="z-10 relative flex items-center justify-center">
            <img 
              src="/__mockup/images/tag-logo.png" 
              width={200} 
              alt="TAG Logo" 
              className="drop-shadow-[0_0_15px_rgba(0,255,0,0.5)]"
              style={{ filter: 'invert(1)', mixBlendMode: 'screen' }} 
            />
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="w-[30%] flex flex-col items-end gap-6">
          <div className="text-right space-y-1 mb-8">
            <div className="text-green-400/60 text-xs">AWAITING INPUT...</div>
            <div className="animate-pulse">_</div>
          </div>

          <button className="group relative w-full max-w-[280px] bg-green-950/40 border border-green-500 hover:bg-green-500 hover:text-black transition-colors duration-200 py-3 px-6 flex items-center justify-between overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,255,0,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[bg-pan_2s_linear_infinite]" />
            <span className="relative z-10 font-bold tracking-widest flex items-center gap-2">
              <Zap size={16} className="group-hover:text-black text-green-400" />
              INITIATE ENLISTMENT
            </span>
            <span className="relative z-10 font-bold group-hover:text-black text-green-500 animate-pulse">|</span>
          </button>

          <button className="group w-full max-w-[280px] border border-green-800 hover:border-green-500 text-green-500/80 hover:text-green-400 transition-colors duration-200 py-3 px-6 flex items-center justify-between bg-black/40 backdrop-blur-sm">
            <span className="tracking-widest flex items-center gap-2 text-sm">
              <Navigation size={14} />
              ACCESS DOCTRINE
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">&gt;&gt;</span>
          </button>
          
          {/* Target lock visual */}
          <div className="mt-12 w-full max-w-[280px] border border-green-900/50 p-4 bg-green-950/10">
            <div className="flex justify-between text-[10px] text-green-500/50 mb-2">
              <span>TARGET LOCK</span>
              <span>100%</span>
            </div>
            <div className="w-full h-1 bg-green-950">
              <div className="h-full bg-green-500/70 w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Marquee Ticker Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-green-900/50 bg-green-950/20 flex items-center overflow-hidden z-20">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] text-green-500/60 text-xs tracking-widest flex gap-12">
          <span>SIGNAL ACQUIRED // TAG TACTICAL ADAPTATION GROUP // EST 2026 // COMMS ACTIVE //</span>
          <span>SIGNAL ACQUIRED // TAG TACTICAL ADAPTATION GROUP // EST 2026 // COMMS ACTIVE //</span>
          <span>SIGNAL ACQUIRED // TAG TACTICAL ADAPTATION GROUP // EST 2026 // COMMS ACTIVE //</span>
          <span>SIGNAL ACQUIRED // TAG TACTICAL ADAPTATION GROUP // EST 2026 // COMMS ACTIVE //</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes bg-pan {
          0% { background-position: 100% 0; }
          100% { background-position: -50% 0; }
        }
      `}} />
    </div>
  );
}
