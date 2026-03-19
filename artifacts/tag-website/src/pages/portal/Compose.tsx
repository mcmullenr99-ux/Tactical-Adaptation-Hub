import { PortalLayout } from "@/components/layout/PortalLayout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSendMessage, getGetSentQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const composeSchema = z.object({
  recipientId: z.number().min(1, "Valid Recipient ID is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});

type ComposeFormValues = z.infer<typeof composeSchema>;

export default function Compose() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: send, isPending } = useSendMessage();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ComposeFormValues>({
    resolver: zodResolver(composeSchema)
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const replyTo = params.get('replyTo');
    const subject = params.get('subject');
    
    if (replyTo) setValue('recipientId', parseInt(replyTo, 10));
    if (subject) setValue('subject', subject);
  }, [setValue]);

  const onSubmit = (data: ComposeFormValues) => {
    send({ data }, {
      onSuccess: () => {
        toast({ title: "Dispatch Sent", description: "Your message has been delivered." });
        queryClient.invalidateQueries({ queryKey: getGetSentQueryKey() });
        setLocation("/portal/inbox");
      },
      onError: (err: any) => {
        toast({ title: "Transmission Failed", description: err.data?.error || "Unknown error occurred.", variant: "destructive" });
      }
    });
  };

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-widest text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Abort
        </button>

        <h1 className="text-3xl font-display font-bold uppercase tracking-wider mb-8">New Dispatch</h1>

        <div className="bg-card border border-border p-6 sm:p-8 rounded-lg clip-angled">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Recipient ID
              </label>
              <input
                {...register("recipientId", { valueAsNumber: true })}
                type="number"
                className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Target ID (e.g. 1)"
              />
              <p className="text-xs text-muted-foreground mt-2 font-sans">Find user IDs via dispatch history or command roster.</p>
              {errors.recipientId && <p className="text-destructive text-sm mt-1 font-sans">{errors.recipientId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Subject
              </label>
              <input
                {...register("subject")}
                type="text"
                className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Operation briefing..."
              />
              {errors.subject && <p className="text-destructive text-sm mt-1 font-sans">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Transmission Body
              </label>
              <textarea
                {...register("body")}
                rows={8}
                className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y"
                placeholder="Enter dispatch details here..."
              />
              {errors.body && <p className="text-destructive text-sm mt-1 font-sans">{errors.body.message}</p>}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-3 font-display font-bold uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded clip-angled shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-95 disabled:opacity-70"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isPending ? "Transmitting..." : "Send Dispatch"}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
