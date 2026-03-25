import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from "lucide-react";
import { TagLogo } from "@/components/TagLogo";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/components/auth/AuthContext";

type VerifyState = "verifying" | "success" | "expired" | "invalid" | "resend_success" | "resend_error";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth() as any;
  const [state, setState] = useState<VerifyState>("verifying");
  const [resending, setResending] = useState(false);

  // Extract token from URL query string
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const verifyToken = searchParams.get("token");

  useEffect(() => {
    if (!verifyToken) {
      // No token — just show the "check your inbox" page
      setState("invalid");
      return;
    }

    const doVerify = async () => {
      try {
        await apiFetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: verifyToken }),
        });
        setState("success");
        // Redirect to dashboard after 3 seconds
        setTimeout(() => setLocation("/portal/dashboard?verified=1"), 3000);
      } catch (err: any) {
        const status = err?.status ?? 0;
        if (status === 410) {
          setState("expired");
        } else {
          setState("invalid");
        }
      }
    };

    doVerify();
  }, [verifyToken]);

  const handleResend = async () => {
    setResending(true);
    try {
      await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setState("resend_success");
    } catch {
      setState("resend_error");
    } finally {
      setResending(false);
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <TagLogo size={56} className="mb-4" />
            <h2 className="font-display font-black uppercase tracking-widest text-foreground text-xl">
              TACTICAL ADAPTATION GROUP
            </h2>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-2xl">

            {/* Verifying */}
            {state === "verifying" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground">
                  Verifying your email...
                </p>
              </div>
            )}

            {/* Success */}
            {state === "success" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <h3 className="font-display font-black uppercase tracking-widest text-lg text-foreground">
                  Email Verified
                </h3>
                <p className="text-muted-foreground font-sans text-sm">
                  Your email has been confirmed. Your account is now fully active.
                </p>
                <p className="text-xs text-muted-foreground font-display uppercase tracking-widest">
                  Redirecting to dashboard...
                </p>
                <button
                  onClick={() => setLocation("/portal/dashboard")}
                  className="mt-2 w-full py-3 px-6 bg-primary text-primary-foreground font-display font-bold uppercase tracking-widest text-sm rounded hover:bg-primary/90 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* Expired */}
            {state === "expired" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <XCircle className="w-12 h-12 text-yellow-500" />
                <h3 className="font-display font-black uppercase tracking-widest text-lg text-foreground">
                  Link Expired
                </h3>
                <p className="text-muted-foreground font-sans text-sm">
                  This verification link has expired. Links are valid for 24 hours.
                </p>
                {token && (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="mt-2 w-full py-3 px-6 bg-primary text-primary-foreground font-display font-bold uppercase tracking-widest text-sm rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Resend Verification Email
                  </button>
                )}
                {!token && (
                  <p className="text-xs text-muted-foreground">
                    Log in and visit your dashboard to request a new link.
                  </p>
                )}
              </div>
            )}

            {/* Invalid / no token */}
            {state === "invalid" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <Mail className="w-12 h-12 text-primary" />
                <h3 className="font-display font-black uppercase tracking-widest text-lg text-foreground">
                  Check Your Inbox
                </h3>
                <p className="text-muted-foreground font-sans text-sm">
                  We've sent a verification link to your email address. Click the link in the email to activate your account.
                </p>
                <p className="text-xs text-muted-foreground font-sans">
                  Didn't receive it? Check your spam folder, or log in to request a new link.
                </p>
                {token && (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="mt-2 w-full py-3 px-6 bg-secondary text-foreground border border-border font-display font-bold uppercase tracking-widest text-sm rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Resend Email
                  </button>
                )}
                <button
                  onClick={() => setLocation("/portal/login")}
                  className="w-full py-3 px-6 bg-primary text-primary-foreground font-display font-bold uppercase tracking-widest text-sm rounded hover:bg-primary/90 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            )}

            {/* Resend success */}
            {state === "resend_success" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <h3 className="font-display font-black uppercase tracking-widest text-lg text-foreground">
                  Email Sent
                </h3>
                <p className="text-muted-foreground font-sans text-sm">
                  A new verification link has been sent to your email address. Check your inbox.
                </p>
              </div>
            )}

            {/* Resend error */}
            {state === "resend_error" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <XCircle className="w-12 h-12 text-destructive" />
                <h3 className="font-display font-black uppercase tracking-widest text-lg text-foreground">
                  Failed to Resend
                </h3>
                <p className="text-muted-foreground font-sans text-sm">
                  Could not resend the verification email. Please wait a few minutes and try again, or contact support.
                </p>
                <button
                  onClick={() => setState("invalid")}
                  className="mt-2 w-full py-3 px-6 bg-secondary text-foreground border border-border font-display font-bold uppercase tracking-widest text-sm rounded hover:bg-secondary/80 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
