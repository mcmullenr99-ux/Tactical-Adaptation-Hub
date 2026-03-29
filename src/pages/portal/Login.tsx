import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, Mail, CheckCircle, ArrowLeft, ShieldAlert, RefreshCw } from "lucide-react";
import { TagLogo } from "@/components/TagLogo";
import { useAuth } from "@/components/auth/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function ForgotPasswordPanel({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError(null);
    try {
      await apiFetch("/authForgotPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      key="forgot"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-6 font-display uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Login
      </button>

      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-secondary flex items-center justify-center clip-angled-sm mb-6 border border-border">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground">Reset Passcode</h1>
        <p className="text-muted-foreground font-sans mt-2 text-sm text-center">
          Enter your email — we'll send a secure reset link directly to your inbox.
        </p>
      </div>

      {sent ? (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-primary mx-auto" />
          <p className="text-primary font-display font-bold uppercase tracking-widest text-sm">Email Sent</p>
          <p className="text-muted-foreground font-sans text-sm">
            If that address is registered, a reset link has been sent. Check your inbox (and spam folder).
            The link expires in <strong className="text-foreground">1 hour</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded text-destructive flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Email Address
            </label>
            <input
              type="email" autoComplete="off"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="operator@tag.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-3 font-display font-bold uppercase tracking-widest text-base bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded clip-angled shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-95 disabled:opacity-70"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
            {sending ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
    </motion.div>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    setUnverifiedEmail(null);
    setIsPending(true);
    try {
      await login(data.email, data.password);
      setLocation("/portal/dashboard");
    } catch (err: any) {
      if (err?.data?.requires_verification) {
        setUnverifiedEmail(err?.data?.email ?? data.email);
      } else {
        setErrorMsg(err?.data?.error || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendState("sending");
    try {
      // Call resend — no auth token available here so we pass email in body
      await apiFetch("/authResendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[90vh] flex items-center justify-center py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background/95" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-card border border-border p-8 sm:p-10 rounded-lg clip-angled shadow-xl overflow-hidden">
            <AnimatePresence mode="wait">
              {showForgot ? (
                <ForgotPasswordPanel key="forgot" onBack={() => setShowForgot(false)} />
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex flex-col items-center mb-8">
                    <TagLogo size={110} className="mb-4" />
                    <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground">HQ Uplink</h1>
                    <p className="text-muted-foreground font-sans mt-2">Authorized personnel only</p>
                  </div>

                  {errorMsg && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded text-destructive flex items-center gap-3 text-sm font-sans">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {unverifiedEmail && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded space-y-3">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-yellow-300 font-display font-bold uppercase tracking-widest text-xs mb-1">Email Not Verified</p>
                          <p className="text-yellow-200/80 font-sans text-xs">You must verify your email before logging in. Check your inbox for a verification link.</p>
                        </div>
                      </div>
                      {resendState === "idle" && (
                        <button type="button" onClick={handleResendVerification} className="w-full py-2 px-4 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-display font-bold uppercase tracking-widest text-xs rounded hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2">
                          <RefreshCw className="w-3 h-3" /> Resend Verification Email
                        </button>
                      )}
                      {resendState === "sending" && (
                        <div className="flex items-center justify-center gap-2 text-yellow-300 text-xs font-display uppercase tracking-widest">
                          <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                        </div>
                      )}
                      {resendState === "sent" && (
                        <p className="text-green-400 font-display uppercase tracking-widest text-xs text-center">✓ Verification email sent — check your inbox</p>
                      )}
                      {resendState === "error" && (
                        <p className="text-destructive font-sans text-xs text-center">Failed to resend. Please wait a few minutes and try again.</p>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                    <div>
                      <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        {...register("email")}
                        type="email" autoComplete="off"
                        className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        placeholder="operator@tag.com"
                      />
                      {errors.email && <p className="text-destructive text-sm mt-2 font-sans">{errors.email.message}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground">
                          Passcode
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-xs text-primary hover:text-accent transition-colors font-sans underline-offset-2 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <input
                        {...register("password")}
                        type="password" autoComplete="new-password"
                        className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        placeholder="••••••••"
                      />
                      {errors.password && <p className="text-destructive text-sm mt-2 font-sans">{errors.password.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full flex items-center justify-center gap-3 font-display font-bold uppercase tracking-widest text-lg bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded clip-angled shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-95 disabled:opacity-70"
                    >
                      {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {isPending ? "Authenticating..." : "Authenticate"}
                    </button>
                  </form>

                  <div className="mt-8 border-t border-border pt-6">
                    <p className="text-center text-muted-foreground font-sans text-sm">
                      No access credentials?{" "}
                      <Link href="/portal/register" className="text-primary hover:text-accent transition-colors font-bold">
                        Request Access
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
