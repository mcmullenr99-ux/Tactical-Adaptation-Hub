import React from "react";
import { ArrowRight, BookOpen } from "lucide-react";

export default function SplitCommand() {
  return (
    <div className="flex w-full h-screen bg-black overflow-hidden min-h-[720px] min-w-[1280px]">
      {/* LEFT HALF */}
      <div 
        className="w-1/2 h-full relative"
        style={{
          backgroundImage: "url('/__mockup/images/tag-skull.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black pointer-events-none" />
        
        {/* Vertical text */}
        <div className="absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-white/30 text-xs tracking-[0.3em] font-bold uppercase whitespace-nowrap">EST 2026</span>
        </div>
      </div>

      {/* RIGHT HALF */}
      <div className="w-1/2 h-full bg-black relative flex flex-col justify-center px-24">
        {/* Logo top-right */}
        <img 
          src="/__mockup/images/tag-logo.png" 
          width={60} 
          alt="TAG Logo"
          className="absolute top-12 right-12"
          style={{ filter: 'invert(1)', mixBlendMode: 'screen' }} 
        />

        <div className="flex flex-col">
          {/* Headline */}
          <h1 className="text-7xl lg:text-8xl font-black uppercase leading-none tracking-tight flex flex-col mb-10">
            <span className="text-white">TRAIN.</span>
            <span className="text-[#EAB308]">ADAPT.</span>
            <span className="text-white">DOMINATE.</span>
          </h1>

          {/* Rule */}
          <hr className="border-t border-white/20 w-1/3 mb-8" />

          {/* Body */}
          <p className="text-white/50 text-sm md:text-base mb-12 max-w-[400px] leading-relaxed">
            Bringing together tactical gamers to master warfighting fundamentals, build brotherhood, and dominate the battlefield.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-4">
            <button className="flex items-center justify-between w-[280px] bg-[#EAB308] text-black px-6 py-4 font-bold tracking-widest text-xs uppercase hover:bg-yellow-400 transition-colors">
              <span>Join The Unit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-between w-[280px] border border-white/20 text-white px-6 py-4 font-bold tracking-widest text-xs uppercase hover:bg-white/5 transition-colors">
              <span>Read Doctrine</span>
              <BookOpen className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
