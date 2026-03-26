import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { User, MessageSquare, Loader2, Award } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { countryFlag, countryName } from "@/lib/countries";

interface PublicProfile {
  id: number;
  username: string;
  role: string;
  bio: string | null;
  discordTag: string | null;
  nationality: string | null;
  createdAt: string;
}

interface EarnedRibbon {
  id: string;
  award_name: string;
  award_description: string;
  award_image_url: string | null;
  ribbon_color_1: string | null;
  ribbon_color_2: string | null;
  ribbon_color_3: string | null;
  group_name: string;
  reason: string;
  created_date: string;
}

const ROLE_COLORS: Record<string, string> = {
  member: "text-muted-foreground border-border",
  staff: "text-blue-400 border-blue-400/40",
  moderator: "text-accent border-accent/40",
  admin: "text-destructive border-destructive/40",
};

const RIBBONS_PER_ROW = 5;

function RibbonStripe({ ribbon, selected, onClick }: { ribbon: EarnedRibbon; selected?: boolean; onClick?: () => void }) {
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

export default function UserPublicProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [selRibbon, setSelRibbon] = useState<EarnedRibbon | null>(null);

  const { data: profile, isLoading, isError } = useQuery<PublicProfile>({
    queryKey: ["public-profile", username],
    queryFn: () => apiFetch(`/api/users/profile/${username}`),
    enabled: !!username,
  });

  const { data: ribbons = [] } = useQuery<EarnedRibbon[]>({
    queryKey: ["public-ribbons", username],
    queryFn: () => apiFetch(`/api/users/profile/${username}/ribbons`),
    enabled: !!username && !!profile,
  });

  useSEO({
    title: profile ? `${profile.username}'s Profile` : "Operator Profile",
    description: profile?.bio ?? `View ${username}'s TAG profile`,
  });

  const ribbonRows: EarnedRibbon[][] = [];
  for (let i = 0; i < ribbons.length; i += RIBBONS_PER_ROW) ribbonRows.push(ribbons.slice(i, i + RIBBONS_PER_ROW));

  return (
    <MainLayout>
      <div className="pt-28 pb-20 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : isError || !profile ? (
            <div className="text-center py-24">
              <User className="w-16 h-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
              <h1 className="font-display font-bold text-2xl uppercase tracking-widest mb-2">Operator Not Found</h1>
              <p className="text-muted-foreground">No operator with that callsign exists in our network.</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Profile card */}
              <div className="bg-card border border-border rounded-lg overflow-hidden clip-angled">
                <div className="bg-secondary/40 border-b border-border px-6 py-8 flex items-center gap-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px]" />
                  <div className="w-20 h-20 bg-primary/20 border-2 border-primary/50 rounded-lg flex items-center justify-center shrink-0 relative z-10">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="font-display font-bold text-3xl uppercase tracking-widest">{profile.username}</h1>
                      {profile.nationality && (
                        <span title={countryName(profile.nationality)} className="text-2xl leading-none" aria-label={countryName(profile.nationality)}>
                          {countryFlag(profile.nationality)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs font-display font-bold uppercase tracking-widest px-2 py-1 border rounded ${ROLE_COLORS[profile.role] ?? ROLE_COLORS.member}`}>
                        {profile.role}
                      </span>
                      {profile.nationality && (
                        <span className="text-xs text-muted-foreground">{countryName(profile.nationality)}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Enlisted {format(new Date(profile.createdAt), "MMMM yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {profile.bio ? (
                    <div>
                      <h3 className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Bio</h3>
                      <p className="text-foreground text-sm leading-relaxed">{profile.bio}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No bio set.</p>
                  )}

                  {profile.discordTag && (
                    <div>
                      <h3 className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Discord</h3>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <div className="w-4 h-4 bg-[#5865F2] rounded-sm flex items-center justify-center">
                          <span className="text-white text-[9px] font-bold">D</span>
                        </div>
                        {profile.discordTag}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6">
                  <Link
                    href={`/portal/compose?replyTo=${profile.id}&subject=Hello ${profile.username}`}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-primary text-primary hover:bg-primary/10 font-display font-bold uppercase tracking-widest text-sm rounded transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> Send Message
                  </Link>
                </div>
              </div>

              {/* Ribbon Rack */}
              {ribbons.length > 0 && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <h2 className="font-display font-bold text-sm uppercase tracking-widest">Service Ribbons</h2>
                    <span className="text-[10px] text-muted-foreground font-sans ml-auto">{ribbons.length} awarded</span>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col gap-1 mb-4">
                      {ribbonRows.map((row, ri) => (
                        <div key={ri} className="flex gap-1">
                          {row.map(r => (
                            <RibbonStripe
                              key={r.id}
                              ribbon={r}
                              selected={selRibbon?.id === r.id}
                              onClick={() => setSelRibbon(selRibbon?.id === r.id ? null : r)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    {selRibbon && (
                      <div className="bg-secondary/40 border border-border rounded-lg p-4 mt-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <RibbonStripe ribbon={selRibbon} />
                          <div>
                            <p className="font-display font-black text-sm uppercase tracking-widest">{selRibbon.award_name}</p>
                            <p className="text-[10px] text-muted-foreground font-sans">{selRibbon.group_name}</p>
                          </div>
                        </div>
                        {selRibbon.award_description && (
                          <p className="text-xs font-sans text-muted-foreground">{selRibbon.award_description}</p>
                        )}
                        {selRibbon.reason && (
                          <p className="text-xs font-sans text-foreground border-l-2 border-primary/40 pl-2 italic">"{selRibbon.reason}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
