import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { motion } from "framer-motion";
import { Shield, Users, Target, Award, FileText, Calendar } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

interface PublicStats {
  active_members: number;
  milsim_groups: number;
  ops_completed: number;
  awards_given: number;
  aars_filed: number;
  founded_year: number;
  years_active: number;
}

export default function Stats() {
  useSEO({ title: "Unit Statistics — TAG", description: "Tactical Adaptation Group operational statistics and unit history." });

  const { data: stats, isLoading } = useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: () => apiFetch("/api/stats/public"),
    staleTime: 5 * 60_000,
  });

  const STATS = stats ? [
    { icon: Users, label: "Active Operators", value: stats.active_members.toLocaleString(), desc: "Verified TAG members" },
    { icon: Shield, label: "MilSim Units", value: stats.milsim_groups.toLocaleString(), desc: "Registered groups" },
    { icon: Target, label: "Ops Completed", value: stats.ops_completed.toLocaleString(), desc: "Operations logged" },
    { icon: Award, label: "Awards Given", value: stats.awards_given.toLocaleString(), desc: "Commendations issued" },
    { icon: FileText, label: "AARs Filed", value: stats.aars_filed.toLocaleString(), desc: "After Action Reports" },
    { icon: Calendar, label: "Years Active", value: stats.years_active > 0 ? `${stats.years_active}+` : "<1", desc: `Since ${stats.founded_year}` },
  ] : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-20 space-y-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <p className="text-primary text-xs font-display font-bold uppercase tracking-[0.3em]">By The Numbers</p>
          <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-wider">Unit Statistics</h1>
          <p className="text-muted-foreground max-w-xl mx-auto font-sans">
            Tactical Adaptation Group — an elite community built on dedication, discipline, and teamwork.
          </p>
        </motion.div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 clip-angled-sm relative overflow-hidden group hover:border-primary/50 transition-colors"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-4xl font-display font-black text-foreground">{stat.value}</p>
                  <p className="font-display font-bold uppercase tracking-widest text-sm text-primary mt-1">{stat.label}</p>
                  <p className="text-xs text-muted-foreground font-sans mt-1">{stat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center space-y-4 pt-8 border-t border-border">
          <h2 className="text-2xl font-display font-black uppercase tracking-wider">Ready to Join?</h2>
          <p className="text-muted-foreground font-sans">Become part of one of the most active tactical gaming communities around.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/join" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm px-6 py-3 rounded clip-angled-sm transition-all">
              Enlist Now
            </a>
            <a href="/milsim" className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-widest text-sm px-6 py-3 rounded clip-angled-sm transition-all">
              Browse Units
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
