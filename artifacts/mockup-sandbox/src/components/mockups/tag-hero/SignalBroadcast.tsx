import React from 'react';

export function SignalBroadcast() {
  return (
    <div className="relative w-full h-[720px] max-w-[1280px] bg-[#0d0d0d] text-white overflow-hidden font-sans mx-auto flex items-center">
      {/* Noise overlay */}
      <div 
        className="pointer-events-none absolute inset-0 z-50 opacity-[0.05]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* Ghost logo */}
      <img 
        src="/__mockup/images/tag-logo.png" 
        width={560} 
        alt="Ghost Logo"
        className="absolute z-0 pointer-events-none" 
        style={{
          right: '-80px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          filter: 'invert(1)', 
          opacity: 0.05, 
          mixBlendMode: 'screen'
        }} 
      />

      {/* Vertical TRANSMISSION text */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 -translate-x-1/2 -rotate-90 text-[10px] tracking-[0.5em] text-neutral-600 font-mono uppercase origin-center whitespace-nowrap z-10">
        Transmission
      </div>

      {/* Timestamp */}
      <div className="absolute top-8 left-16 text-[#4ade80] opacity-60 font-mono text-sm tracking-wider z-10">
        20MAR2026 // 0342Z
      </div>

      <div className="relative z-10 ml-24 max-w-2xl flex flex-col gap-6">
        {/* Headline */}
        <h1 className="flex flex-col text-7xl font-black uppercase tracking-tight leading-[0.85]">
          <span className="text-white">Train.</span>
          
          <span className="relative inline-block w-fit">
            <span className="absolute top-0 left-0 text-white opacity-80 mix-blend-screen" style={{ transform: 'translateX(2px)', textShadow: '2px 0 #ef4444' }}>Adapt.</span>
            <span className="absolute top-0 left-0 text-white opacity-80 mix-blend-screen" style={{ transform: 'translateX(-2px)', textShadow: '-2px 0 #22d3ee' }}>Adapt.</span>
            <span className="relative text-white">Adapt.</span>
          </span>

          <span className="text-white">Dominate.</span>
        </h1>

        {/* Frequency bar */}
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 tracking-widest border-l-2 border-neutral-700 pl-4 py-1 mt-2">
          <span>FREQ: 156.800 MHz</span>
          <span>//</span>
          <span>UNIT: TAG</span>
          <span>//</span>
          <span className="flex items-center gap-2">
            STATUS: TRANSMITTING <span className="text-[#4ade80] animate-pulse text-[8px]">●</span>
          </span>
        </div>

        {/* Body text */}
        <p className="text-neutral-300 text-lg leading-relaxed max-w-xl mt-4">
          Bringing together tactical gamers to master warfighting fundamentals, build brotherhood, and dominate the battlefield.
          <span className="inline-block animate-pulse ml-1 text-white">▌</span>
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-6 mt-8 font-mono text-sm">
          <button className="flex items-center gap-3 bg-white text-black px-8 py-4 uppercase tracking-widest font-bold hover:bg-neutral-200 transition-colors">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            Connect
          </button>
          <button className="px-8 py-4 uppercase tracking-widest font-bold text-white border-2 border-dashed border-neutral-600 hover:border-neutral-400 transition-colors">
            Stand By
          </button>
        </div>
      </div>

      {/* Sync bar */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-800/50 z-10 overflow-hidden">
        <div className="h-full w-1/3 bg-neutral-600/30 animate-pulse relative left-1/3"></div>
      </div>
    </div>
  );
}
