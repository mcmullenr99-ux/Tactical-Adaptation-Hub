import { useState, useEffect } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { User, Lock, Trash2, Loader2, Save, AlertTriangle, Globe, Activity, Share2, Copy, Check, Star } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { COUNTRIES, countryFlag } from "@/lib/countries";
import { differenceInDays, format } from "date-fns";

const DUTY_OPTIONS = [
  { value: "available", label: "Available", color: "bg-green-500/20 text-green-400 border-green-500/40" },
  { value: "deployed", label: "Deployed", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
  { value: "on-leave", label: "On Leave", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
  { value: "mia", label: "MIA", color: "bg-red-500/20 text-red-400 border-red-500/40" },
];

function getServiceBadge(createdAt: string) {
  const days = differenceInDays(new Date(), new Date(createdAt));
  if (days >= 730) return { label: "2-Year Elite", icon: "★★", color: "text-accent" };
  if (days >= 365) return { label: "1-Year Veteran", icon: "★", color: "text-yellow-400" };
  if (days >= 180) return { label: "6-Month Operator", icon: "◆", color: "text-blue-400" };
  if (days >= 30) return { label: "30-Day Operator", icon: "▲", color: "text-primary" };
  return { label: "Recruit", icon: "●", color: "text-muted-foreground" };
}

export default function Profile() {
  useSEO({ title: "My Profile" });
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [bio, setBio] = useState(user?.bio ?? "");
  const [discordTag, setDiscordTag] = useState(user?.discordTag ?? "");
  const [nationality, setNationality] = useState((user as any)?.nationality ?? "");
  const [steamProfileUrl, setSteamProfileUrl] = useState((user as any)?.steam_profile_url ?? "");
  const [xboxGamertag, setXboxGamertag] = useState((user as any)?.xbox_gamertag ?? "");
  const [psnId, setPsnId] = useState((user as any)?.psn_id ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [dutyStatus, setDutyStatus] = useState((user as any)?.on_duty_status ?? "available");
  const [savingDuty, setSavingDuty] = useState(false);

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [recruits, setRecruits] = useState<any[]>([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch<{ referral_code: string | null }>("/api/referral-code/mine")
      .then(r => setReferralCode(r.referral_code)).catch(() => {});
    apiFetch<any[]>("/api/referral-code/recruits")
      .then(setRecruits).catch(() => {});
  }, []);

  if (!user) return null;

  const badge = getServiceBadge(user.createdAt);
  const daysIn = differenceInDays(new Date(), new Date(user.createdAt));

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await apiFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, discordTag, nationality: nationality || null, steamProfileUrl: steamProfileUrl || null, xboxGamertag: xboxGamertag || null, psnId: psnId || null }),
      });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords don't match.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await apiFetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast({ title: "Password Changed", description: "Your new password is active." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const saveDutyStatus = async () => {
    setSavingDuty(true);
    try {
      await apiFetch("/api/duty-status", { method: "PATCH", body: JSON.stringify({ status: dutyStatus }) });
      toast({ title: "Status Updated", description: `Duty status set to ${dutyStatus}.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingDuty(false);
    }
  };

  const generateReferralCode = async () => {
    setGeneratingCode(true);
    try {
      const r = await apiFetch<{ referral_code: string }>("/api/referral-code/generate", { method: "PATCH" });
      setReferralCode(r.referral_code);
      toast({ title: "Code Generated", description: "Your referral code is ready to share." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await apiFetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      qc.clear();
      window.location.href = "/";
    } catch (e: any) {
      toast({ title: "Deletion Failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="font-display font-bold text-2xl uppercase tracking-widest">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your callsign details, password, and account.</p>
        </div>

        {/* Service Record */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold uppercase tracking-widest">Service Record</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Callsign</p>
              <p className="font-display font-bold text-foreground">{user.username}</p>
            </div>
            <div>
              <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Clearance</p>
              <p className="font-display font-bold text-foreground uppercase">{user.role}</p>
            </div>
            <div>
              <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Enlisted</p>
              <p className="font-display font-bold">{format(new Date(user.createdAt), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Service Badge</p>
              <p className={`font-display font-bold ${badge.color}`}>{badge.icon} {badge.label}</p>
              <p className="text-xs text-muted-foreground">{daysIn} days</p>
            </div>
          </div>
        </div>

        {/* Duty Status */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold uppercase tracking-widest">Duty Status</h2>
          </div>
          <p className="text-xs text-muted-foreground font-sans">Visible to unit commanders and on your profile.</p>
          <div className="grid grid-cols-2 gap-2">
            {DUTY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDutyStatus(opt.value)}
                className={`flex items-center gap-2 px-4 py-3 rounded border font-display font-bold uppercase tracking-widest text-xs transition-all ${
                  dutyStatus === opt.value ? opt.color : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {dutyStatus === opt.value && <Check className="w-3.5 h-3.5" />}
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={saveDutyStatus}
              disabled={savingDuty}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded transition-all disabled:opacity-50"
            >
              {savingDuty ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Status
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-lg uppercase tracking-widest">{user.username}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <span className="ml-auto text-xs font-display font-bold uppercase tracking-widest px-2 py-1 border border-border rounded text-muted-foreground">{user.role}</span>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="mf-input w-full resize-none"
              placeholder="A short bio about yourself..."
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/500</p>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Discord Tag</label>
            <input
              value={discordTag}
              onChange={e => setDiscordTag(e.target.value)}
              maxLength={50}
              className="mf-input w-full"
              placeholder="YourName#1234 or @yourname"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">
              <Globe className="inline w-3 h-3 mr-1" />Nationality
            </label>
            <div className="relative">
              <select
                value={nationality}
                onChange={e => setNationality(e.target.value)}
                className="mf-input w-full appearance-none pr-8"
              >
                <option value="">— Not set —</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {countryFlag(c.code)} {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</div>
            </div>
          </div>

          {/* Platform Links */}
          <div className="pt-2 space-y-4 border-t border-border">
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Platform Links</p>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Steam Profile URL</label>
              <input
                value={steamProfileUrl}
                onChange={e => setSteamProfileUrl(e.target.value)}
                className="mf-input w-full"
                placeholder="https://steamcommunity.com/id/yourname"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Xbox Gamertag</label>
              <input
                value={xboxGamertag}
                onChange={e => setXboxGamertag(e.target.value)}
                maxLength={60}
                className="mf-input w-full"
                placeholder="Your Xbox Gamertag"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">PlayStation Network ID</label>
              <input
                value={psnId}
                onChange={e => setPsnId(e.target.value)}
                maxLength={60}
                className="mf-input w-full"
                placeholder="Your PSN ID"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded transition-all disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold uppercase tracking-widest">Recruitment Code</h2>
          </div>
          <p className="text-xs text-muted-foreground font-sans">Share this code with potential recruits. When they register, they'll be linked to you.</p>
          {referralCode ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-secondary border border-border rounded px-4 py-3 font-mono font-bold text-primary tracking-widest text-sm">
                {referralCode}
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-4 py-3 border border-border rounded font-display font-bold uppercase text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : (
            <button
              onClick={generateReferralCode}
              disabled={generatingCode}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border hover:border-primary/50 text-foreground font-display font-bold uppercase tracking-wider text-sm rounded transition-all disabled:opacity-50"
            >
              {generatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Generate My Code
            </button>
          )}
          {recruits.length > 0 && (
            <div>
              <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Recruited by You ({recruits.length})</p>
              <div className="space-y-1">
                {recruits.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm px-3 py-2 bg-secondary/40 rounded">
                    <span className="font-display font-bold text-foreground">{r.username}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM dd, yyyy")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold uppercase tracking-widest">Change Password</h2>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mf-input w-full" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mf-input w-full" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mf-input w-full" placeholder="••••••••" />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={changePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded transition-all disabled:opacity-50"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-card border border-destructive/30 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="font-display font-bold uppercase tracking-widest text-destructive">Delete Account</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Permanently deletes your account and all associated data. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2 border border-destructive/50 text-destructive hover:bg-destructive/10 font-display font-bold uppercase tracking-wider text-sm rounded transition-all"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-xs text-foreground font-medium">Enter your password to confirm deletion:</p>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="mf-input w-full"
                placeholder="Your password"
              />
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  disabled={deleting || !deletePassword}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white font-display font-bold uppercase text-xs rounded"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Confirm Delete
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-border rounded text-xs font-display uppercase text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </PortalLayout>
  );
}
