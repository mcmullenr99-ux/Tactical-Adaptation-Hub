import { PortalLayout } from "@/components/layout/PortalLayout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Send, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

const GAMES = [
  "Arma 3", "Arma Reforger", "Squad", "Bellum", "Ground Branch",
  "Ready Or Not", "Escape From Tarkov", "DayZ", "Exfil",
  "Grey Zone Warfare", "Body Cam"
];

const applySchema = z.object({
  gamertag: z.string().min(2, "Gamertag is required"),
  games: z.array(z.string()).min(1, "Select at least one game"),
  experience: z.string().min(20, "Please provide more detail about your experience (min 20 chars)"),
  motivation: z.string().min(20, "Please provide more detail about your motivation (min 20 chars)"),
});

type ApplyFormValues = z.infer<typeof applySchema>;

export default function Apply() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: (data: ApplyFormValues) =>
      apiFetch("/api/staff-applications", { method: "POST", body: JSON.stringify(data) }),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { games: [] }
  });

  const onSubmit = (data: ApplyFormValues) => {
    submitMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Application Submitted", description: "HQ has received your staff application." });
        setLocation("/portal/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Submission Failed", description: err.message || "Unknown error occurred.", variant: "destructive" });
      }
    });
  };

  return (
    <PortalLayout requireRole={['member']}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded flex items-center justify-center clip-angled-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-foreground">Staff Application</h1>
            <p className="text-muted-foreground font-sans">Step up and help lead the Tactical Adaptation Group.</p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 sm:p-8 rounded-lg clip-angled">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Primary Gamertag</label>
              <input {...register("gamertag")} type="text" className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" placeholder="Your main operational handle" />
              {errors.gamertag && <p className="text-destructive text-sm mt-1 font-sans">{errors.gamertag.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-4">Operational Sectors (Games)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {GAMES.map(game => (
                  <label key={game} className="flex items-center gap-3 p-3 bg-background border border-border rounded cursor-pointer hover:border-primary/50 transition-colors group">
                    <input type="checkbox" value={game} {...register("games")} className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/50 focus:ring-2" />
                    <span className="font-sans text-sm text-foreground group-hover:text-primary transition-colors">{game}</span>
                  </label>
                ))}
              </div>
              {errors.games && <p className="text-destructive text-sm mt-2 font-sans">{errors.games.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Leadership / Tactical Experience</label>
              <textarea {...register("experience")} rows={5} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y" placeholder="Detail any previous clan leadership, military experience, or relevant tactical gaming experience..." />
              {errors.experience && <p className="text-destructive text-sm mt-1 font-sans">{errors.experience.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Motivation</label>
              <textarea {...register("motivation")} rows={5} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y" placeholder="Why do you want to become a staff member for TAG?" />
              {errors.motivation && <p className="text-destructive text-sm mt-1 font-sans">{errors.motivation.message}</p>}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button type="submit" disabled={submitMutation.isPending} className="flex items-center gap-3 font-display font-bold uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded clip-angled shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-95 disabled:opacity-70">
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitMutation.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
