import { Link } from "wouter";
import { Shield, Disc, Twitter, Youtube, Coffee } from "lucide-react";
import { TAG_DISCORD_URL } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8 relative overflow-hidden">
      {/* Decorative texture background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/tactical-texture.png)`, backgroundSize: 'cover' }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/20 border border-primary/50 rounded clip-angled">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-bold text-2xl tracking-widest text-foreground">
                TAG
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md font-sans">
              The command platform for serious milsim units. Roster management, op planning, awards, intel, and more — built for units that take it seriously.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground tracking-wider mb-6">Nav</h4>
            <ul className="space-y-4 text-muted-foreground font-sans">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link href="/registry" className="hover:text-primary transition-colors">Unit Registry</Link></li>
              <li><Link href="/games" className="hover:text-primary transition-colors">Supported Games</Link></li>
              <li><Link href="/ops" className="hover:text-primary transition-colors">Ops Calendar</Link></li>
              <li><Link href="/register" className="hover:text-accent transition-colors">Register Your Unit</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground tracking-wider mb-6">Comms</h4>
            <div className="flex flex-wrap gap-3 mb-6">
              <a href={TAG_DISCORD_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-secondary text-muted-foreground hover:bg-[#5865F2] hover:text-white transition-all text-sm font-display font-bold uppercase tracking-wider" title="Join our Discord">
                <Disc className="w-4 h-4" /> Discord
              </a>
              <a href="https://ko-fi.com/tagtacticaladaptationgroup" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-secondary text-muted-foreground hover:bg-[#FF5E5B] hover:text-white transition-all text-sm font-display font-bold uppercase tracking-wider" title="Support us on Ko-fi">
                <Coffee className="w-4 h-4" /> Ko-fi
              </a>
            </div>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
          
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm font-sans">
            &copy; {new Date().getFullYear()} Tactical Adaptation Group. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground font-sans">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
