import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { User, Loader2, Shield, Star, Globe, Hash, MessageSquare, Calendar, ChevronRight, ExternalLink, BadgeCheck, UserPlus, UserCheck, Clock, Send } from "lucide-react";
import { format } from "date-fns";
import { countryFlag, countryName } from "@/lib/countries";

const ROLE_BADGE: Record<string, string> = {
  member:    "bg-muted text-muted-foreground border-border",
  staff:     "bg-blue-500/10 text-blue-400 border-blue-400/30",
  moderator: "bg-accent/10 text-accent border-accent/30",
  admin:     "bg-destructive/10 text-destructive border-destructive/30",
};

const RIBBONS_PER_ROW = 5;

function RibbonStripe({ ribbon, selected, onClick }: { ribbon: any; selected?: boolean; onClick?: () => void }) {
  const c1 = ribbon.ribbon_color_1 || "#3b82f6";
  const c2 = ribbon.ribbon_color_2 || c1;
  const c3 = ribbon.ribbon_color_3 || c2;
  return (
    <div
      onClick={onClick}
      title={ribbon.award_name}
      className={`w-11 h-7 rounded-sm overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${selected ? "border-primary" : "border-transparent hover:border-primary/50"}`}
    >
      {ribbon.award_image_url ? (
        <img src={ribbon.award_image_url} alt={ribbon.award_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex">
          <div className="flex-1" style={{ background: c1 }} />
          {c2 !== c1 && <div className="flex-1" style={{ background: c2 }} />}
          {c3 !== c2 && <div className="flex-1" style={{ background: c3 }} />}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center bg-card border border-border rounded-md px-4 py-3 min-w-[80px]">
      <span className="text-lg font-bold font-display text-foreground">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display mt-0.5">{label}</span>
    </div>
  );
}

export default function UserPublicProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [selRibbon, setSelRibbon] = useState<any | null>(null);

  const { data: profile, isLoading, isError } = useQuery<any>({
    queryKey: ["public-profile", username],
    queryFn: () => apiFetch(`/users?path=profile/${username}`),
    enabled: !!username,
  });

  const { data: ribbons = [] } = useQuery<any[]>({
    queryKey: ["public-ribbons", username],
    queryFn: () => apiFetch(`/users?path=profile/${username}/ribbons`),
    enabled: !!username,
  });

  const { user: currentUser, isAuthenticated, token } = useAuth();
  const { toast } = useToast();

  const isOwnProfile = !!currentUser && currentUser?.username === username;

  // Friend status
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends' | 'loading'>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);

  const { data: friendStatusData } = useQuery<any>({
    queryKey: ["friend-status", profile?.id],
    queryFn: () => apiFetch(`/friends?path=status/${profile.id}`),
    enabled: !!profile?.id && !!currentUser && !isOwnProfile,
    retry: false,
    throwOnError: false,
  });

  // Sync friendStatusData -> friendStatus using useEffect (onSuccess removed in RQ v5)
  useEffect(() => {
    if (!friendStatusData) return;
    if (friendStatusData?.status === 'accepted') setFriendStatus('friends');
    else if (friendStatusData?.status === 'pending') {
      setFriendStatus('pending');
      if (friendStatusData.friendshipId) setFriendshipId(friendStatusData.friendshipId);
    } else {
      setFriendStatus('none');
    }
  }, [friendStatusData]);

  // Commander's own groups (for Invite to Unit)
  const { data: myGroups = [] } = useQuery<any[]>({
    queryKey: ["my-commander-groups", currentUser?.id],
    queryFn: () => apiFetch(`/milsimGroups?path=my`),
    enabled: !!currentUser && !isOwnProfile,
    select: (data: any[]) => data.filter((g: any) => g.owner_id === currentUser?.id || g.role === 'owner'),
  });

  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [inviteSent, setInviteSent] = useState<string | null>(null); // groupId that was invited

  async function handleAddFriend() {
    if (!profile?.id) return;
    setFriendStatus('loading');
    try {
      const res = await apiFetch(`/friends?path=request/${profile.id}`, { method: 'POST' });
      setFriendStatus('pending');
      setFriendshipId(res.id);
      toast({ title: 'Friend request sent', description: `Request sent to ${profile.username}.` });
    } catch (e: any) {
      setFriendStatus('none');
      toast({ title: 'Error', description: e.message ?? 'Could not send request', variant: 'destructive' });
    }
  }

  async function handleInviteToGroup(groupId: string, groupName: string) {
    // Send a message to the user's inbox with the invite
    try {
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipient_username: profile.username,
          subject: `Invitation to join ${groupName}`,
          body: `${currentUser?.username} has invited you to join ${groupName} on TAGnet. Visit your group section to apply or contact the commander for details.`,
        }),
      });
      setInviteSent(groupId);
      setShowInviteMenu(false);
      toast({ title: 'Invite sent', description: `${profile.username} has been sent an invite to ${groupName}.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message ?? 'Could not send invite', variant: 'destructive' });
    }
  }

  useSEO({ title: profile ? `${profile.username} — TAG` : "Operator Profile — TAG" });

  if (isLoading) return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    </MainLayout>
  );

  if (isError || !profile) return (
    <MainLayout>
      <div className="max-w-xl mx-auto py-20 text-center">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-display text-lg uppercase tracking-widest text-muted-foreground">Operator Not Found</p>
        <p className="text-sm text-muted-foreground font-sans mt-2">No record exists for this callsign.</p>
      </div>
    </MainLayout>
  );

  const ribbonRows: any[][] = [];
  for (let i = 0; i < ribbons.length; i += RIBBONS_PER_ROW) {
    ribbonRows.push(ribbons.slice(i, i + RIBBONS_PER_ROW));
  }

  const joinedDate = profile.createdAt ? format(new Date(profile.createdAt), "MMM yyyy") : "Unknown";

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* ── Header card ── */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                : <User className="w-9 h-9 text-muted-foreground" />
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl uppercase tracking-widest text-foreground">{profile.username}</h1>
                {profile.is_verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" title="Verified Operator" />}
                <span className={`text-[10px] font-display uppercase tracking-widest border px-2 py-0.5 rounded ${ROLE_BADGE[profile.role] ?? ROLE_BADGE.member}`}>
                  {profile.role}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mt-2">
                {profile.nationality && (
                  <span className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {countryFlag(profile.nationality)} {countryName(profile.nationality)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Enlisted {joinedDate}
                </span>
                {profile.discord_tag && (
                  <span className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {profile.discord_tag}
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm font-sans text-muted-foreground mt-3 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-5 flex-wrap">
            <StatBox label="Ops" value={profile.total_ops ?? 0} />
            <StatBox label="Units" value={(profile.milsim_groups ?? []).length} />
            <StatBox label="Posts" value={profile.post_count ?? 0} />
            <StatBox label="Ribbons" value={ribbons.length} />
          </div>
        </div>

        {/* ── Ribbon Rack ── */}
        {ribbons.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-4">Ribbon Rack</p>
            <div className="space-y-1.5">
              {ribbonRows.map((row, ri) => (
                <div key={ri} className="flex gap-1.5 flex-wrap">
                  {row.map((r: any) => (
                    <RibbonStripe key={r.id} ribbon={r} selected={selRibbon?.id === r.id} onClick={() => setSelRibbon(selRibbon?.id === r.id ? null : r)} />
                  ))}
                </div>
              ))}
            </div>
            {selRibbon && (
              <div className="mt-4 bg-muted/40 border border-border rounded p-3 flex gap-3 items-start">
                {selRibbon.award_image_url
                  ? <img src={selRibbon.award_image_url} alt={selRibbon.award_name} className="w-10 h-6 object-cover rounded-sm flex-shrink-0 mt-0.5" />
                  : (
                    <div className="w-10 h-6 rounded-sm overflow-hidden flex-shrink-0 mt-0.5 flex">
                      <div className="flex-1" style={{ background: selRibbon.ribbon_color_1 || "#3b82f6" }} />
                      {selRibbon.ribbon_color_2 && selRibbon.ribbon_color_2 !== selRibbon.ribbon_color_1 && <div className="flex-1" style={{ background: selRibbon.ribbon_color_2 }} />}
                      {selRibbon.ribbon_color_3 && selRibbon.ribbon_color_3 !== selRibbon.ribbon_color_2 && <div className="flex-1" style={{ background: selRibbon.ribbon_color_3 }} />}
                    </div>
                  )
                }
                <div>
                  <p className="text-xs font-display font-bold uppercase tracking-widest text-foreground">{selRibbon.award_name}</p>
                  {selRibbon.group_name && <p className="text-[10px] text-muted-foreground font-sans">{selRibbon.group_name}</p>}
                  {selRibbon.reason && <p className="text-xs text-muted-foreground font-sans mt-1">{selRibbon.reason}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Milsim Units ── */}
        {(profile.milsim_groups ?? []).length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-4">Units Served</p>
            <div className="space-y-3">
              {profile.milsim_groups.map((g: any) => (
                <Link key={g.group_id} href={`/milsim/${g.group_slug ?? g.group_id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer group">
                    {g.logo_url
                      ? <img src={g.logo_url} alt={g.group_name} className="w-10 h-10 rounded object-cover flex-shrink-0 border border-border" />
                      : <div className="w-10 h-10 rounded bg-muted border border-border flex items-center justify-center flex-shrink-0"><Shield className="w-5 h-5 text-muted-foreground" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-display uppercase tracking-widest text-foreground truncate">{g.group_name}</p>
                        {g.is_owner && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" title="Commander" />}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        {g.callsign && <span className="text-[10px] text-muted-foreground font-sans">Callsign: {g.callsign}</span>}
                        {g.rank && <span className="text-[10px] text-muted-foreground font-sans">· {g.rank}</span>}
                        {g.role && <span className="text-[10px] text-muted-foreground font-sans">· {g.role}</span>}
                        {g.ops_count > 0 && <span className="text-[10px] text-muted-foreground font-sans">· {g.ops_count} ops</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap items-center justify-center gap-3">

          {/* Send Message — always visible when logged in and not own profile */}
          {!isOwnProfile && currentUser && (
            <Link href={`/portal/comms?section=compose&to=${profile.username}`}>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-all font-display text-xs uppercase tracking-widest">
                <MessageSquare className="w-4 h-4" />
                Send Message
              </button>
            </Link>
          )}

          {/* Add Friend / Pending / Friends */}
          {!isOwnProfile && currentUser && (
            friendStatus === 'friends' ? (
              <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-md font-display text-xs uppercase tracking-widest cursor-default">
                <UserCheck className="w-4 h-4" />
                Friends
              </button>
            ) : friendStatus === 'pending' ? (
              <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-md font-display text-xs uppercase tracking-widest cursor-default">
                <Clock className="w-4 h-4" />
                Request Pending
              </button>
            ) : friendStatus === 'loading' ? (
              <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-muted border border-border text-muted-foreground rounded-md font-display text-xs uppercase tracking-widest cursor-default">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Request...
              </button>
            ) : (
              <button onClick={handleAddFriend} className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-md hover:bg-muted hover:border-primary/40 transition-all font-display text-xs uppercase tracking-widest">
                <UserPlus className="w-4 h-4" />
                Add Friend
              </button>
            )
          )}

          {/* Invite to Unit — only if viewer commands a group */}
          {!isOwnProfile && currentUser && myGroups.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowInviteMenu(v => !v)}
                className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-md hover:bg-muted hover:border-primary/40 transition-all font-display text-xs uppercase tracking-widest"
              >
                <Send className="w-4 h-4" />
                Invite to Unit
              </button>
              {showInviteMenu && (
                <div className="absolute bottom-full mb-2 left-0 z-50 bg-card border border-border rounded-lg shadow-xl min-w-[200px] overflow-hidden">
                  <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground px-3 pt-2 pb-1">Select Unit</p>
                  {myGroups.map((g: any) => (
                    <button
                      key={g.id}
                      onClick={() => handleInviteToGroup(g.id, g.name)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-muted transition-colors text-xs font-sans ${inviteSent === g.id ? 'text-green-400' : 'text-foreground'}`}
                    >
                      {inviteSent === g.id ? <UserCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> : <Shield className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                      <span className="truncate">{g.name}</span>
                      {inviteSent === g.id && <span className="ml-auto text-[10px] text-green-400">Sent</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Not logged in — prompt to login */}
          {!currentUser && (
            <Link href="/portal/login">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-all font-display text-xs uppercase tracking-widest">
                <MessageSquare className="w-4 h-4" />
                Login to Interact
              </button>
            </Link>
          )}

        </div>

      </div>
    </MainLayout>
  );
}
