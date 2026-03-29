import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { KeyRound, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token. Please request a new reset link.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/authResetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      setDone(true);
      setTimeout(() => setLocation("/portal/login"), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Invalid or expired reset link. Please request a new one.");
    } finally {
      setLoading(false);
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
          <div className="bg-card border border-border p-8 sm:p-10 rounded-lg clip-angled shadow-xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-secondary flex items-center justify-center clip-angled-sm mb-6 border border-border">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground">Set New Passcode</h1>
              <p className="text-muted-foreground font-sans mt-2 text-sm text-center">
                Choose a strong new password for your TAG account.
              </p>
            </div>

            {done ? (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-primary mx-auto" />
                <p className="text-primary font-display font-bold uppercase tracking-widest text-sm">Password Updated</p>
                <p className="text-muted-foreground font-sans text-sm">
                  Your password has been changed. Redirecting you to login...
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
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-background border-2 border-border rounded px-4 py-3 pr-11 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="Repeat your password"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-1 mt-1">
                  {[8, 10, 12, 16].map(len => (
                    <div
                      key={len}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        password.length >= len ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  {password.length < 8 ? "Too short" : password.length < 10 ? "Weak" : password.length < 12 ? "Fair" : "Strong"}
                </p>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full flex items-center justify-center gap-3 font-display font-bold uppercase tracking-widest text-base bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded clip-angled shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-95 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                  {loading ? "Updating..." : "Set New Password"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
