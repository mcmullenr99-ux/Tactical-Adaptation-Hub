import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { Shield, Globe, Star, Users, Plus, ExternalLink, Loader2 } from "lucide-react";

interface MilsimGroup {
  id: number;
  name: string;
  slug: string;
  tagLine: string | null;
  description: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string;
}

export default function MilsimRegistry() {
  const [groups, setGroups] = useState<MilsimGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<MilsimGroup[]>("/api/milsim-groups")
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = groups.filter((g) => g.status === "featured");
  const approved = groups.filter((g) => g.status === "approved");

  return (
    <MainLayout>
      {/* Header */}
      <div className="relative bg-secondary/50 border-b border-border py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded text-primary font-display font-bold uppercase tracking-widest text-xs mb-5">
              <Shield className="w-3 h-3" /> MilSim Registry
            </div>
            <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tight mb-4">
              MilSim <span className="text-primary">Groups</span>
            </h1>
            <div className="w-24 h-1 bg-primary mb-5" />
            <p className="text-xl text-muted-foreground font-sans max-w-2xl">
              Registered tactical units operating within the TAG ecosystem. Browse featured groups, view rosters, SOPs, and apply to join.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <Star className="w-5 h-5 text-accent" />
                  <h2 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">Featured Units</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featured.map((g, i) => <GroupCard key={g.id} group={g} index={i} featured />)}
                </div>
              </section>
            )}

            {/* All */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">
                    {featured.length > 0 ? "All Registered Units" : "Registered Units"}
                  </h2>
                </div>
                <Link
                  href="/milsim/register"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Register Your Unit
                </Link>
              </div>

              {approved.length === 0 && featured.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-border rounded-lg">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">No Groups Yet</p>
                  <p className="font-sans text-sm text-muted-foreground mb-6">Be the first to register your unit.</p>
                  <Link
                    href="/milsim/register"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all"
                  >
                    <Plus className="w-4 h-4" /> Register Now
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approved.map((g, i) => <GroupCard key={g.id} group={g} index={i} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function GroupCard({ group, index, featured = false }: { group: MilsimGroup; index: number; featured?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`group bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-all ${featured ? "border-accent/40" : "border-border"}`}
    >
      {/* Logo / Banner */}
      <div className="relative h-32 bg-secondary/60 flex items-center justify-center overflow-hidden">
        {featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent/20 border border-accent/40 text-accent px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-widest z-10">
            <Star className="w-2.5 h-2.5" /> Featured
          </div>
        )}
        {group.logoUrl ? (
          <img src={group.logoUrl} alt={`${group.name} logo`} className="w-20 h-20 object-contain" />
        ) : (
          <Shield className="w-12 h-12 text-muted-foreground/30" />
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display font-black uppercase tracking-wider text-foreground text-lg mb-1 truncate">
          {group.name}
        </h3>
        {group.tagLine && (
          <p className="text-xs text-primary font-display font-bold uppercase tracking-widest mb-3 truncate">{group.tagLine}</p>
        )}
        {group.description && (
          <p className="text-sm text-muted-foreground font-sans line-clamp-2 mb-4 leading-relaxed">
            {group.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/milsim/${group.slug}`}
            className="flex-1 text-center font-display font-bold uppercase tracking-wider text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded clip-angled-sm transition-all"
          >
            View Profile
          </Link>
          {group.discordUrl && (
            <a href={group.discordUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 border border-border hover:border-primary/40 rounded text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {group.websiteUrl && (
            <a href={group.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 border border-border hover:border-primary/40 rounded text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
