import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { User, Loader2, Shield, Star, Globe, Hash, MessageSquare, Calendar, ChevronRight, ExternalLink, BadgeCheck } from "lucide-react";
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

        {/* ── Send Message CTA ── */}
        <div className="flex justify-center">
          <Link href={`/portal/inbox?compose=${profile.username}`}>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-all font-display text-xs uppercase tracking-widest">
              <MessageSquare className="w-4 h-4" />
              Send Message
            </button>
          </Link>
        </div>

      </div>
    </MainLayout>
  );
}
