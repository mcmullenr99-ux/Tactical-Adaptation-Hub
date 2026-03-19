import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Users, Search, UserPlus, UserCheck, UserX, MessageSquare,
  Bell, Loader2
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FriendUser {
  friendship_id: number;
  friends_since?: string;
  created_at?: string;
  id: number;
  username: string;
  email: string;
  role: string;
  bio: string | null;
  discord_tag: string | null;
}

interface SearchUser {
  id: number;
  username: string;
  role: string;
  bio: string | null;
  discord_tag: string | null;
  created_at: string;
}

interface FriendStatus {
  status: "none" | "pending" | "accepted" | "declined";
  friendshipId?: number;
  iAmRequester?: boolean;
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  member:    "text-muted-foreground border-border",
  staff:     "text-blue-400 border-blue-400/50",
  moderator: "text-amber-400 border-amber-400/50",
  admin:     "text-destructive border-destructive/50",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-display font-bold uppercase tracking-widest px-2 py-0.5 border rounded ${ROLE_COLORS[role] || ROLE_COLORS.member}`}>
      {role}
    </span>
  );
}

// ─── Friend Card ──────────────────────────────────────────────────────────────

function FriendCard({ friend, onRemove }: { friend: FriendUser; onRemove: () => void }) {
  return (
    <div className="bg-card border border-border rounded p-4 flex items-start gap-4">
      <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center shrink-0">
        <Users className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-display font-bold text-foreground uppercase tracking-wider text-sm">{friend.username}</p>
          <RoleBadge role={friend.role} />
        </div>
        {friend.bio && <p className="text-xs font-sans text-muted-foreground truncate mb-1">{friend.bio}</p>}
        {friend.friends_since && (
          <p className="text-xs font-sans text-muted-foreground">Friends since {format(new Date(friend.friends_since), "MMM dd, yyyy")}</p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href={`/portal/compose?replyTo=${friend.id}&subject=Hey ${friend.username}`}
          className="p-2 border border-border rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Send message"
        >
          <MessageSquare className="w-4 h-4" />
        </Link>
        <button
          onClick={onRemove}
          className="p-2 border border-destructive/30 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          title="Remove friend"
        >
          <UserX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Search Result Row ────────────────────────────────────────────────────────

function SearchResult({ user, currentUserId }: { user: SearchUser; currentUserId: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery<FriendStatus>({
    queryKey: ["friend-status", user.id],
    queryFn: () => apiFetch(`/api/friends/status/${user.id}`),
    enabled: user.id !== currentUserId,
  });

  const sendRequest = useMutation({
    mutationFn: () => apiFetch(`/api/friends/request/${user.id}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-status", user.id] });
      toast({ title: "Request Sent", description: `Friend request sent to ${user.username}.` });
    },
    onError: (err: any) => toast({ title: "Failed", description: err?.error || "Could not send request.", variant: "destructive" }),
  });

  if (user.id === currentUserId) return null;

  return (
    <div className="bg-card border border-border rounded p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center shrink-0">
        <Users className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-display font-bold text-foreground uppercase tracking-wider text-sm">{user.username}</p>
          <RoleBadge role={user.role} />
        </div>
        {user.bio && <p className="text-xs font-sans text-muted-foreground truncate">{user.bio}</p>}
      </div>
      <div className="shrink-0">
        {statusLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : status?.status === "accepted" ? (
          <span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-green-400">
            <UserCheck className="w-4 h-4" /> Friends
          </span>
        ) : status?.status === "pending" ? (
          <span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-amber-400">
            <Bell className="w-4 h-4" /> {status.iAmRequester ? "Request Sent" : "Wants to Connect"}
          </span>
        ) : (
          <button
            onClick={() => sendRequest.mutate()}
            disabled={sendRequest.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Friend
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "friends" | "requests" | "search";

export default function Friends() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: friends = [], isLoading: friendsLoading, refetch: refetchFriends } = useQuery<FriendUser[]>({
    queryKey: ["friends"],
    queryFn: () => apiFetch("/api/friends"),
  });

  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery<FriendUser[]>({
    queryKey: ["friend-requests"],
    queryFn: () => apiFetch("/api/friends/requests"),
  });

  const { data: searchResults = [], isLoading: searchLoading } = useQuery<SearchUser[]>({
    queryKey: ["user-search", debouncedQuery],
    queryFn: () => apiFetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length >= 2,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/friends/${id}/accept`, { method: "PATCH" }),
    onSuccess: () => { refetchFriends(); refetchRequests(); toast({ title: "Connected", description: "Friend request accepted." }); },
  });

  const declineMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/friends/${id}/decline`, { method: "PATCH" }),
    onSuccess: () => { refetchRequests(); toast({ title: "Request Declined" }); },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => apiFetch(`/api/friends/${userId}`, { method: "DELETE" }),
    onSuccess: () => { refetchFriends(); toast({ title: "Friend Removed" }); },
  });

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      setDebouncedQuery(trimmed);
    } else {
      setDebouncedQuery("");
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "friends",  label: "Connections",    count: friends.length },
    { id: "requests", label: "Requests",        count: requests.length },
    { id: "search",   label: "Find Members" },
  ];

  return (
    <PortalLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded flex items-center justify-center clip-angled-sm shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-foreground">Connections</h1>
            <p className="text-muted-foreground font-sans text-sm">Your trusted network inside TAG.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-display font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-xs ${tab === t.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Friends List */}
        {tab === "friends" && (
          <div className="space-y-3">
            {friendsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : friends.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded p-12 flex flex-col items-center gap-3 text-center">
                <Users className="w-12 h-12 text-muted-foreground/40" />
                <p className="font-display font-bold uppercase tracking-wider text-muted-foreground">No connections yet</p>
                <p className="text-sm font-sans text-muted-foreground">Use the <button className="text-primary hover:underline" onClick={() => setTab("search")}>Find Members</button> tab to connect with other operators.</p>
              </div>
            ) : (
              friends.map(f => (
                <FriendCard key={f.friendship_id} friend={f} onRemove={() => removeMutation.mutate(f.id)} />
              ))
            )}
          </div>
        )}

        {/* Requests */}
        {tab === "requests" && (
          <div className="space-y-3">
            {requestsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : requests.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded p-12 flex flex-col items-center gap-3 text-center">
                <Bell className="w-12 h-12 text-muted-foreground/40" />
                <p className="font-display font-bold uppercase tracking-wider text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.friendship_id} className="bg-card border border-primary/30 rounded p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-display font-bold text-foreground uppercase tracking-wider text-sm">{req.username}</p>
                      <RoleBadge role={req.role} />
                    </div>
                    {req.bio && <p className="text-xs font-sans text-muted-foreground truncate">{req.bio}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => acceptMutation.mutate(req.friendship_id)}
                      disabled={acceptMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => declineMutation.mutate(req.friendship_id)}
                      disabled={declineMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Member Search */}
        {tab === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search members by username..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                autoFocus
                className="w-full bg-background border border-border rounded pl-10 pr-4 py-3 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {debouncedQuery.length < 2 ? (
              <p className="text-sm font-sans text-muted-foreground text-center py-8">Type at least 2 characters to search.</p>
            ) : searchLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : searchResults.length === 0 ? (
              <p className="text-sm font-sans text-muted-foreground text-center py-8">No members found for "{debouncedQuery}".</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map(u => (
                  <SearchResult key={u.id} user={u} currentUserId={user?.id ?? 0} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
