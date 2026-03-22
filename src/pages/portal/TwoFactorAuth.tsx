import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, ShieldOff, QrCode, KeyRound, Copy, Check,
  AlertCircle, Loader2, Eye, EyeOff, RefreshCw
} from "lucide-react";

export default function TwoFactorAuth() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["2fa-status"],
    queryFn: () => apiFetch("/api/auth/2fa/status"),
  });

  const enabled = status?.enabled ?? false;

  const [step, setStep] = useState<"idle" | "setup" | "verify" | "done" | "backup" | "disable">("idle");
  const [setupData, setSetupData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const copyText = (text: string, which: "secret" | "backup") => {
    navigator.clipboard.writeText(text);
    if (which === "secret") { setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }
    else { setCopiedBackup(true); setTimeout(() => setCopiedBackup(false), 2000); }
  };

  const startSetup = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/2fa/setup", { method: "POST" });
      setSetupData(data);
      setStep("setup");
      setCode("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to start setup", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      setBackupCodes(data.backupCodes ?? []);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["2fa-status"] });
      toast({ title: "2FA Enabled", description: "Your account is now protected." });
    } catch (err: any) {
      toast({ title: "Invalid Code", description: err?.message ?? "Code did not match.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!password) return;
    setLoading(true);
    try {
      await apiFetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: code.trim() || undefined }),
      });
      setStep("idle");
      setCode("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["2fa-status"] });
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to disable 2FA", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const viewBackupCodes = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/2fa/backup-codes");
      setBackupCodes(data.backupCodes ?? []);
      setStep("backup");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Could not fetch backup codes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const regenerateCodes = async () => {
    if (!password) { toast({ title: "Password required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/2fa/regenerate-backup-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      setBackupCodes(data.backupCodes ?? []);
      setPassword("");
      toast({ title: "Backup Codes Regenerated", description: "Old codes are now invalid." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to regenerate", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <h1 className="font-display font-bold text-2xl uppercase tracking-widest">Two-Factor Authentication</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Add an extra layer of security to your account. Once enabled, you'll need your authenticator app every time you log in.
        </p>

        {/* Status badge */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${enabled ? "bg-primary/10 border-primary/30" : "bg-secondary border-border"}`}>
          {enabled
            ? <ShieldCheck className="w-5 h-5 text-primary" />
            : <ShieldOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className={`font-display font-bold uppercase tracking-widest text-sm ${enabled ? "text-primary" : "text-muted-foreground"}`}>
              {enabled ? "2FA is Active" : "2FA is Disabled"}
            </p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              {enabled ? "Your account has two-factor authentication protection." : "Your account is protected by password only."}
            </p>
          </div>
        </div>

        {/* ── NOT ENABLED ──────────────────────────────────────── */}
        {!enabled && step === "idle" && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="font-display font-bold uppercase tracking-widest text-sm text-foreground">Enable 2FA</h2>
            <p className="text-sm text-muted-foreground font-sans">
              You'll need an authenticator app such as <strong className="text-foreground">Google Authenticator</strong>,{" "}
              <strong className="text-foreground">Authy</strong>, or <strong className="text-foreground">Microsoft Authenticator</strong>.
            </p>
            <button
              onClick={startSetup}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm rounded clip-angled transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {loading ? "Loading..." : "Set Up 2FA"}
            </button>
          </div>
        )}

        {/* ── SETUP: Show QR ──────────────────────────────────── */}
        {!enabled && step === "setup" && setupData && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-5">
            <h2 className="font-display font-bold uppercase tracking-widest text-sm text-foreground">Scan QR Code</h2>
            <p className="text-sm text-muted-foreground font-sans">
              Open your authenticator app and scan this code. Then enter the 6-digit code it shows below.
            </p>
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-lg inline-block">
                <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-sans mb-1">Can't scan? Enter this key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-xs font-mono text-foreground break-all">
                  {setupData.secret}
                </code>
                <button
                  onClick={() => copyText(setupData.secret, "secret")}
                  className="p-2 bg-secondary border border-border rounded hover:bg-border transition-colors"
                  title="Copy secret"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && verifySetup()}
                className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-mono text-lg tracking-widest focus:outline-none focus:border-primary transition-all text-center"
                placeholder="000 000"
                maxLength={6}
              />
            </div>
            <button
              onClick={verifySetup}
              disabled={loading || code.length < 6}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm rounded clip-angled transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? "Verifying..." : "Confirm & Enable"}
            </button>
            <button onClick={() => setStep("idle")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors font-sans">
              Cancel
            </button>
          </div>
        )}

        {/* ── DONE: Show backup codes ──────────────────────────── */}
        {step === "done" && backupCodes.length > 0 && (
          <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold uppercase tracking-widest text-sm text-primary">Save Your Backup Codes</h2>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-300 font-sans">
                <strong>Save these now.</strong> Each code can only be used once if you lose access to your authenticator app.
                These codes won't be shown again.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map(c => (
                <code key={c} className="bg-secondary border border-border rounded px-3 py-2 text-xs font-mono text-center text-foreground tracking-widest">
                  {c}
                </code>
              ))}
            </div>
            <button
              onClick={() => copyText(backupCodes.join("\n"), "backup")}
              className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors font-sans"
            >
              {copiedBackup ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedBackup ? "Copied!" : "Copy all codes"}
            </button>
            <button
              onClick={() => setStep("idle")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm rounded clip-angled transition-all active:scale-95"
            >
              I've saved my codes — Done
            </button>
          </div>
        )}

        {/* ── ENABLED OPTIONS ──────────────────────────────────── */}
        {enabled && step === "idle" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="font-display font-bold uppercase tracking-widest text-sm">Backup Codes</h2>
              <p className="text-xs text-muted-foreground font-sans">
                Emergency codes to use if you lose access to your authenticator app.
              </p>
              <button
                onClick={viewBackupCodes}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border hover:bg-border rounded text-sm font-display font-bold uppercase tracking-widest transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                View Backup Codes
              </button>
            </div>

            <div className="bg-card border border-destructive/30 rounded-lg p-6 space-y-3">
              <h2 className="font-display font-bold uppercase tracking-widest text-sm text-destructive">Disable 2FA</h2>
              <p className="text-xs text-muted-foreground font-sans">
                This will remove two-factor authentication from your account. You'll only need your password to log in.
              </p>
              <button
                onClick={() => setStep("disable")}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/40 hover:bg-destructive/20 rounded text-sm font-display font-bold uppercase tracking-widest text-destructive transition-all"
              >
                <ShieldOff className="w-4 h-4" />
                Disable 2FA
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW BACKUP CODES ──────────────────────────────────── */}
        {enabled && step === "backup" && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold uppercase tracking-widest text-sm">Backup Codes</h2>
              <button onClick={() => setStep("idle")} className="text-xs text-muted-foreground hover:text-foreground font-sans transition-colors">
                ← Back
              </button>
            </div>
            {backupCodes.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                All backup codes have been used. Regenerate new ones below.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map(c => (
                  <code key={c} className="bg-secondary border border-border rounded px-3 py-2 text-xs font-mono text-center text-foreground tracking-widest">
                    {c}
                  </code>
                ))}
              </div>
            )}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs text-muted-foreground font-sans">Regenerate all codes (invalidates current ones):</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground font-sans focus:outline-none focus:border-primary transition-all pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={regenerateCodes}
                  disabled={loading || !password}
                  className="flex items-center gap-1.5 px-4 py-2 bg-secondary border border-border hover:bg-border rounded text-xs font-display font-bold uppercase tracking-widest transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DISABLE CONFIRM ──────────────────────────────────── */}
        {enabled && step === "disable" && (
          <div className="bg-card border border-destructive/40 rounded-lg p-6 space-y-4">
            <h2 className="font-display font-bold uppercase tracking-widest text-sm text-destructive">Confirm Disable 2FA</h2>
            <p className="text-sm text-muted-foreground font-sans">
              Enter your account password to confirm. If you have your authenticator, you can also enter a current code.
            </p>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Account password (required)"
                  className="w-full bg-background border border-border rounded px-3 py-3 text-sm text-foreground font-sans focus:outline-none focus:border-destructive transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Authenticator code (optional)"
                className="w-full bg-background border border-border rounded px-3 py-3 text-sm text-foreground font-mono tracking-widest focus:outline-none focus:border-destructive transition-all text-center"
                maxLength={6}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={disable2FA}
                disabled={loading || !password}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-destructive hover:bg-destructive/90 text-white font-display font-bold uppercase tracking-widest text-sm rounded transition-all active:scale-95 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                {loading ? "Processing..." : "Disable 2FA"}
              </button>
              <button
                onClick={() => { setStep("idle"); setCode(""); setPassword(""); }}
                className="px-4 py-3 bg-secondary border border-border hover:bg-border rounded text-sm font-display font-bold uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
