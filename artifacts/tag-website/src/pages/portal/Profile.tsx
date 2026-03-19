import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Trash2, Loader2, Save, AlertTriangle, Globe } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { COUNTRIES, countryFlag } from "@/lib/countries";

export default function Profile() {
  useSEO({ title: "My Profile" });
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [bio, setBio] = useState(user?.bio ?? "");
  const [discordTag, setDiscordTag] = useState(user?.discordTag ?? "");
  const [nationality, setNationality] = useState((user as any)?.nationality ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, discordTag, nationality: nationality || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
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
      const res = await apiFetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Password Changed", description: "Your new password is active." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
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
            <p className="text-xs text-muted-foreground mt-1">Displayed as a flag next to your name on your profile and posts.</p>
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
            Note: security audit logs may be retained per our Privacy Policy.
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
