import { MainLayout } from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { User, Shield, MessageSquare, Loader2 } from "lucide-react";
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

const ROLE_COLORS: Record<string, string> = {
  member: "text-muted-foreground border-border",
  staff: "text-blue-400 border-blue-400/40",
  moderator: "text-accent border-accent/40",
  admin: "text-destructive border-destructive/40",
};

export default function UserPublicProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data: profile, isLoading, isError } = useQuery<PublicProfile>({
    queryKey: ["public-profile", username],
    queryFn: () => apiFetch(`/api/users/profile/${username}`).then(r => {
      if (!r.ok) throw new Error("User not found");
      return r.json();
    }),
    enabled: !!username,
  });

  useSEO({
    title: profile ? `${profile.username}'s Profile` : "Operator Profile",
    description: profile?.bio ?? `View ${username}'s TAG profile`,
  });

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

            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
