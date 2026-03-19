import { Link } from "wouter";
import { Shield, Disc, Twitter, Youtube, Github } from "lucide-react";

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
              Tactical Adaptation Group is a premier gaming community dedicated to mastering warfighting fundamentals, 
              building unbreakable brotherhood, and dominating the battlefield across the tactical gaming spectrum.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground tracking-wider mb-6">Nav</h4>
            <ul className="space-y-4 text-muted-foreground font-sans">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/games" className="hover:text-primary transition-colors">Supported Games</Link></li>
              <li><Link href="/training" className="hover:text-primary transition-colors">Training Doctrine</Link></li>
              <li><Link href="/join" className="hover:text-accent transition-colors">Enlistment</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground tracking-wider mb-6">Comms</h4>
            <div className="flex gap-4">
              <a href="https://discord.gg/matmFhU4yg" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:bg-[#5865F2] hover:text-white transition-all clip-angled-sm" title="Join our Discord">
                <Disc className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all clip-angled-sm">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all clip-angled-sm">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all clip-angled-sm">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm font-sans">
            &copy; {new Date().getFullYear()} Tactical Adaptation Group. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground font-sans">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
