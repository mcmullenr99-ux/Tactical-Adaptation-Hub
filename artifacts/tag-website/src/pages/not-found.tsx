import { Link } from "wouter";
import { ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/tactical-texture.png)`, backgroundSize: 'cover' }}
      />
      
      <div className="text-center relative z-10 px-4">
        <ShieldAlert className="w-24 h-24 text-destructive mx-auto mb-6 opacity-80" />
        <h1 className="font-display text-8xl font-bold tracking-widest text-destructive mb-4">404</h1>
        <h2 className="font-display text-2xl font-bold tracking-widest uppercase mb-6">Target Not Found</h2>
        <p className="font-sans text-muted-foreground max-w-md mx-auto mb-10">
          The coordinates you entered are invalid or the objective has been moved. 
          Return to base immediately.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center font-display font-bold uppercase tracking-widest text-sm bg-secondary text-foreground border border-border px-8 py-4 rounded clip-angled hover:border-primary hover:text-primary transition-all"
        >
          Return to HQ
        </Link>
      </div>
    </div>
  );
}
