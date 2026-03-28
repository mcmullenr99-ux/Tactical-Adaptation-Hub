import { PortalLayout } from "@/components/layout/PortalLayout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Send, Loader2, ArrowLeft, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/apiFetch";

const composeSchema = z.object({
  recipientId: z.number().min(1, "Please select a recipient"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  body: z.string().min(1, "Message body is required").max(5000, "Too long (max 5000 chars)"),
});

type ComposeFormValues = z.infer<typeof composeSchema>;

interface UserResult { id: number; username: string; role: string; }

function RecipientSearch({ onChange, initialUsername }: { onChange: (id: number) => void; initialUsername?: string }) {
  const [q, setQ] = useState(initialUsername ?? "");
  const [selectedName, setSelectedName] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results = [] } = useQuery<UserResult[]>({
    queryKey: ["user-search", q],
    queryFn: () => apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2 && !selectedName,
    staleTime: 5_000,
  });

  // Auto-select when results come back and we have an initialUsername waiting
  useEffect(() => {
    if (initialUsername && !selectedName && results.length > 0) {
      const match = results.find((u: UserResult) => u.username.toLowerCase() === initialUsername.toLowerCase());
      if (match) { setSelectedName(match.username); onChange(match.id); setOpen(false); setQ(""); }
      else setOpen(true);
    }
  }, [results, initialUsername, selectedName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clear = () => { setQ(""); setSelectedName(""); onChange(0); setOpen(false); };

  if (selectedName) {
    return (
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/40 rounded px-3 py-3">
        <span className="font-display font-bold text-primary text-sm flex-1">{selectedName}</span>
        <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full bg-background border-2 border-border rounded pl-9 pr-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all"
          placeholder="Search by username…"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {results.map((u: UserResult) => (
            <button key={u.id} type="button" onClick={() => { setSelectedName(u.username); onChange(u.id); setOpen(false); setQ(""); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left">
              <span className="flex-1 font-display font-bold text-sm text-foreground">{u.username}</span>
              <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 font-display uppercase tracking-widest">{u.role}</span>
            </button>
          ))}
        </div>
      )}
      {open && q.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-lg shadow-2xl px-4 py-3 text-sm text-muted-foreground">
          No operators found.
        </div>
      )}
    </div>
  );
}

export default function Compose() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: (data: { recipientId: number; subject: string; body: string }) =>
      apiFetch("/api/messages", { method: "POST", body: JSON.stringify(data) }),
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ComposeFormValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: { recipientId: 0 },
  });

  const [toUsername, setToUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const replyTo = params.get("replyTo");
    const subject = params.get("subject");
    const toUser = params.get("to");
    if (replyTo) setValue("recipientId", parseInt(replyTo, 10));
    if (subject) setValue("subject", subject);
    if (toUser) setToUsername(toUser);
  }, [setValue]);

  const bodyValue = watch("body") ?? "";

  const onSubmit = (data: ComposeFormValues) => {
    sendMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: "Dispatch Sent", description: "Your message has been delivered." });
        queryClient.invalidateQueries({ queryKey: ["sent"] });
        setLocation("/portal/inbox");
      },
      onError: (err: any) => {
        toast({ title: "Transmission Failed", description: err.message || "Unknown error occurred.", variant: "destructive" });
      }
    });
  };

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-widest text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Abort
        </button>

        <h1 className="text-3xl font-display font-bold uppercase tracking-wider mb-8">New Dispatch</h1>

        <div className="bg-card border border-border p-6 sm:p-8 rounded-lg clip-angled">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Recipient</label>
              <RecipientSearch onChange={id => setValue("recipientId", id, { shouldValidate: true })} initialUsername={toUsername} />
              {errors.recipientId && <p className="text-destructive text-sm mt-1 font-sans">{errors.recipientId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Subject</label>
              <input {...register("subject")} type="text" className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all" placeholder="Operation briefing..." />
              {errors.subject && <p className="text-destructive text-sm mt-1 font-sans">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Transmission Body</label>
              <textarea {...register("body")} rows={8} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all resize-y" placeholder="Enter dispatch details here..." />
              <div className="flex justify-between mt-1">
                {errors.body && <p className="text-destructive text-sm font-sans">{errors.body.message}</p>}
                <p className="text-xs text-muted-foreground ml-auto">{bodyValue.length}/5000</p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-border">
              <button type="submit" disabled={sendMutation.isPending} className="flex items-center gap-3 font-display font-bold uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded clip-angled shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-95 disabled:opacity-70">
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendMutation.isPending ? "Transmitting..." : "Send Dispatch"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
