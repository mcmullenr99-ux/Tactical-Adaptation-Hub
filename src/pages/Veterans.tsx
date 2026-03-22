import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "wouter";
import {
  Phone, MessageSquare, ExternalLink, Shield, Users, Heart,
  Compass, MapPin, ChevronDown, Loader2, Globe,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

// ── Resource types ─────────────────────────────────────────────────────────────

interface Resource {
  name: string;
  description: string;
  action: string;
  secondary?: string;
  tertiary?: string;
  href: string;
  urgent?: boolean;
  icon: any;
}

// ── Country database ───────────────────────────────────────────────────────────

const COUNTRY_RESOURCES: Record<string, { label: string; resources: Resource[] }> = {
  US: {
    label: "United States",
    resources: [
      {
        name: "Veterans Crisis Line",
        description: "Call, text, or chat 24/7. Real people, no hold music, no judgment.",
        action: "Call 988 — Press 1",
        secondary: "Text 838255",
        tertiary: "1-800-273-8255 — Press 1",
        href: "https://www.veteranscrisisline.net",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Headstrong",
        description: "Free, confidential mental health care for post-9/11 veterans. No VA required. No paperwork runaround.",
        action: "Get started free",
        href: "https://www.getheadstrong.org",
        icon: Heart,
      },
      {
        name: "Give an Hour",
        description: "Free therapy sessions with licensed clinicians who specialise in military and veteran care.",
        action: "Find a provider",
        href: "https://giveanhour.org",
        icon: MessageSquare,
      },
      {
        name: "Team Red White & Blue",
        description: "Getting veterans active and connected through physical and social activity. Gets you moving and around people who get it.",
        action: "Find your chapter",
        href: "https://www.teamrwb.org",
        icon: Users,
      },
      {
        name: "Mission 22",
        description: "Veteran outreach, mental health programs, and a community built around keeping veterans in the fight.",
        action: "Learn more",
        href: "https://mission22.com",
        icon: Compass,
      },
    ],
  },

  GB: {
    label: "United Kingdom",
    resources: [
      {
        name: "Combat Stress Crisis Line",
        description: "24/7 mental health helpline for veterans. Free, confidential, run by the UK's leading veteran mental health charity.",
        action: "Call 0800 138 1619",
        secondary: "Text 'HELLO' to 85258",
        href: "https://www.combatstress.org.uk",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Veterans Gateway",
        description: "First point of contact for veterans and their families needing support — signposts you to the right service fast.",
        action: "Call 0808 802 1212",
        secondary: "Free, 24/7",
        href: "https://www.veteransgateway.org.uk",
        urgent: true,
        icon: Shield,
      },
      {
        name: "Samaritans",
        description: "Confidential support for anyone struggling. Available around the clock, no referral needed.",
        action: "Call 116 123",
        secondary: "Free from any phone, 24/7",
        href: "https://www.samaritans.org",
        icon: Phone,
      },
      {
        name: "Help for Heroes",
        description: "Practical and emotional support for wounded, injured, and sick veterans and their families.",
        action: "Find support",
        href: "https://www.helpforheroes.org.uk",
        icon: Heart,
      },
      {
        name: "SSAFA — Armed Forces Charity",
        description: "Lifelong support for serving personnel, veterans, and their families. Has been there since 1885.",
        action: "Get help",
        href: "https://www.ssafa.org.uk",
        icon: Compass,
      },
    ],
  },

  CA: {
    label: "Canada",
    resources: [
      {
        name: "VAC Assistance Service",
        description: "Veterans Affairs Canada's 24/7 mental health and crisis support line for veterans and their families.",
        action: "Call 1-800-268-7708",
        secondary: "Free, 24/7",
        href: "https://www.veterans.gc.ca/eng/help-centre/assistance-service",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Crisis Services Canada",
        description: "National crisis and suicide prevention service. Real support, any time.",
        action: "Call 1-833-456-4566",
        secondary: "Text 45645 — 4pm to midnight ET",
        href: "https://www.crisisservicescanada.ca",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Wounded Warriors Canada",
        description: "Trauma-informed care and peer support programs specifically for Canadian Armed Forces members and veterans.",
        action: "Learn more",
        href: "https://woundedwarriors.ca",
        icon: Heart,
      },
      {
        name: "Veterans Affairs Canada",
        description: "Programs, benefits, and services for Canadian veterans. Health coverage, rehabilitation, and transition support.",
        action: "Access benefits",
        href: "https://www.veterans.gc.ca",
        icon: Compass,
      },
      {
        name: "True Patriot Love",
        description: "Supports the mental, physical, and social wellbeing of Canadian military families.",
        action: "Find support",
        href: "https://truepatriotlove.com",
        icon: Users,
      },
    ],
  },

  AU: {
    label: "Australia",
    resources: [
      {
        name: "Open Arms",
        description: "Free, confidential counselling and support for veterans and families. Run by the Australian Government — 24/7.",
        action: "Call 1800 011 046",
        secondary: "Free, 24/7",
        href: "https://www.openarms.gov.au",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Lifeline Australia",
        description: "24/7 crisis support and suicide prevention for anyone in distress.",
        action: "Call 13 11 14",
        secondary: "Chat online at lifeline.org.au",
        href: "https://www.lifeline.org.au",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Beyond Blue",
        description: "Mental health support for anxiety and depression. Veteran-specific resources available.",
        action: "Call 1300 22 4636",
        secondary: "Free, 24/7",
        href: "https://www.beyondblue.org.au",
        icon: Heart,
      },
      {
        name: "Department of Veterans' Affairs",
        description: "Benefits, health coverage, and rehabilitation services for Australian veterans.",
        action: "Access your entitlements",
        href: "https://www.dva.gov.au",
        icon: Shield,
      },
      {
        name: "Soldier On",
        description: "Holistic support programs for veterans and their families — employment, health, and community.",
        action: "Get support",
        href: "https://www.soldieron.org.au",
        icon: Compass,
      },
    ],
  },

  NZ: {
    label: "New Zealand",
    resources: [
      {
        name: "Veterans Affairs New Zealand",
        description: "Support, services, and entitlements for New Zealand veterans and their families.",
        action: "Call 0800 483 888",
        href: "https://www.veteransaffairs.mil.nz",
        urgent: true,
        icon: Shield,
      },
      {
        name: "Lifeline New Zealand",
        description: "24/7 crisis support for anyone struggling. Free and confidential.",
        action: "Call 0800 543 354",
        secondary: "Free, 24/7",
        href: "https://www.lifeline.org.nz",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Need to Talk?",
        description: "Free, confidential mental health support — call or text for immediate help.",
        action: "Call or text 1737",
        secondary: "Free, 24/7",
        href: "https://1737.org.nz",
        icon: MessageSquare,
      },
      {
        name: "Youthline (Veterans under 25)",
        description: "Support for younger veterans making the transition to civilian life.",
        action: "Call 0800 376 633",
        href: "https://www.youthline.co.nz",
        icon: Users,
      },
    ],
  },

  IE: {
    label: "Ireland",
    resources: [
      {
        name: "Samaritans Ireland",
        description: "Confidential support for anyone in emotional distress. Free, 24/7.",
        action: "Call 116 123",
        secondary: "Free from any phone",
        href: "https://www.samaritans.org/ireland",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Veterans.ie",
        description: "Support network and advocacy for Irish Defence Forces veterans.",
        action: "Get support",
        href: "https://veterans.ie",
        icon: Shield,
      },
      {
        name: "Pieta House",
        description: "Free, specialised therapy for people affected by suicidal ideation or self-harm.",
        action: "Call 1800 247 247",
        secondary: "Or text HELP to 51444",
        href: "https://www.pieta.ie",
        icon: Heart,
      },
      {
        name: "Turn2Me",
        description: "Online mental health support including peer groups, counselling, and self-help tools.",
        action: "Get help online",
        href: "https://www.turn2me.ie",
        icon: MessageSquare,
      },
    ],
  },

  DE: {
    label: "Germany",
    resources: [
      {
        name: "Telefonseelsorge",
        description: "Free, anonymous, 24/7 crisis support by phone. Available in German.",
        action: "0800 111 0 111",
        secondary: "Or 0800 111 0 222 — Free, 24/7",
        href: "https://www.telefonseelsorge.de",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Sozialberatung Bundeswehr",
        description: "Social counselling service for Bundeswehr soldiers and veterans — practical and emotional support.",
        action: "Find support",
        href: "https://www.bundeswehr.de/de/organisation/personal/beratung",
        icon: Shield,
      },
      {
        name: "Deutsche Kriegsgräberfürsorge",
        description: "Veteran commemoration and community organisation for German military veterans.",
        action: "Learn more",
        href: "https://www.volksbund.de",
        icon: Compass,
      },
    ],
  },

  FR: {
    label: "France",
    resources: [
      {
        name: "Numéro National de Prévention du Suicide",
        description: "Ligne nationale 24/7 d'aide à la prévention du suicide — gratuite et confidentielle.",
        action: "Appeler le 3114",
        secondary: "Gratuit, 24h/24",
        href: "https://www.3114.fr",
        urgent: true,
        icon: Phone,
      },
      {
        name: "Cellule Soutien aux Blessés de l'Armée de Terre",
        description: "Soutien aux soldats blessés et aux anciens combattants de l'armée française.",
        action: "En savoir plus",
        href: "https://www.terre.defense.gouv.fr",
        icon: Shield,
      },
      {
        name: "ONAC-VG",
        description: "Office national des anciens combattants — services et aides pour les vétérans français.",
        action: "Accéder aux services",
        href: "https://www.onac-vg.fr",
        icon: Compass,
      },
    ],
  },
};

// Generic fallback for countries not in the database
const INTERNATIONAL_RESOURCES: Resource[] = [
  {
    name: "International Association for Suicide Prevention",
    description: "Find crisis centres and helplines in your country — updated directory of worldwide services.",
    action: "Find your local crisis centre",
    href: "https://www.iasp.info/resources/Crisis_Centres/",
    urgent: true,
    icon: Globe,
  },
  {
    name: "Findahelpline.com",
    description: "Curated directory of mental health helplines around the world, searchable by country.",
    action: "Find helplines in your country",
    href: "https://findahelpline.com",
    urgent: true,
    icon: Phone,
  },
  {
    name: "Give an Hour",
    description: "Free therapy sessions with licensed clinicians who specialise in military and veteran care. Available internationally.",
    action: "Find a provider",
    href: "https://giveanhour.org",
    icon: MessageSquare,
  },
  {
    name: "Headstrong",
    description: "Free, confidential mental health care for post-9/11 veterans globally. No VA required.",
    action: "Get started free",
    href: "https://www.getheadstrong.org",
    icon: Heart,
  },
];

// ── Country selector ───────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = Object.entries(COUNTRY_RESOURCES).map(([code, { label }]) => ({ code, label }));
COUNTRY_OPTIONS.push({ code: "OTHER", label: "Other / International" });

// ── Geo detection hook ─────────────────────────────────────────────────────────

function useGeoCountry() {
  // Check for ?country=XX test override in the URL
  const urlParam = new URLSearchParams(window.location.search).get("country")?.toUpperCase() ?? null;
  const paramData = urlParam
    ? COUNTRY_RESOURCES[urlParam]
      ? { code: urlParam, label: COUNTRY_RESOURCES[urlParam].label }
      : urlParam === "OTHER"
        ? { code: "OTHER", label: "International" }
        : null
    : null;

  const [countryCode, setCountryCode] = useState<string | null>(paramData?.code ?? null);
  const [countryName, setCountryName] = useState<string>(paramData?.label ?? "");
  const [loading, setLoading] = useState(!paramData);
  const [overridden, setOverridden] = useState(false);
  const testMode = !!paramData;

  useEffect(() => {
    if (paramData || overridden) return;
    setLoading(true);
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        const code: string = data.country_code ?? "US";
        setCountryCode(code);
        setCountryName(data.country_name ?? "");
      })
      .catch(() => {
        setCountryCode("US");
        setCountryName("United States");
      })
      .finally(() => setLoading(false));
  }, [overridden]);

  const override = (code: string, label: string) => {
    setCountryCode(code);
    setCountryName(label);
    setOverridden(true);
    setLoading(false);
  };

  return { countryCode, countryName, loading, overridden, override, testMode };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Veterans() {
  useSEO({
    title: "Veterans Support",
    description: "TAG's veterans support resources — local mental health crisis lines and veteran services based on your location.",
  });

  const { countryCode, countryName, loading, overridden, override, testMode } = useGeoCountry();
  const [showPicker, setShowPicker] = useState(false);

  const countryData = countryCode ? COUNTRY_RESOURCES[countryCode] : null;
  const resources: Resource[] = countryData?.resources ?? INTERNATIONAL_RESOURCES;
  const displayName = countryData?.label ?? countryName ?? "International";

  return (
    <MainLayout>

      {/* Test mode banner */}
      {testMode && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/40 rounded-lg text-yellow-400 text-xs font-display font-bold uppercase tracking-widest shadow-xl">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Test mode — country override: {countryCode}
        </div>
      )}

      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px),
              repeating-linear-gradient(90deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px)`,
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded text-primary font-display font-bold uppercase tracking-widest text-xs mb-8">
              <Shield className="w-3 h-3" /> For Those Who've Served
            </div>

            <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl uppercase tracking-tight text-foreground mb-8 leading-none">
              You're Not<br />
              <span className="text-primary">Lost.</span><br />
              You're Between<br />
              <span className="text-muted-foreground">Deployments.</span>
            </h1>

            <div className="space-y-6 text-lg text-muted-foreground font-sans leading-relaxed max-w-2xl">
              <p>
                If you've recently separated and civilian life feels like a foreign operating
                environment — you're not broken. The structure is gone. The mission is gone.
                The people who understood you without explanation are gone.
                That's a real loss, and it hits hard.
              </p>
              <p>
                Nobody told you that the hardest part wasn't the deployment.
                It was coming home.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Real Talk Section */}
      <section className="py-20 bg-secondary/20 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-8">
                We Know What<br />
                <span className="text-primary">It Actually Feels Like</span>
              </h2>

              <div className="space-y-5 font-sans text-muted-foreground leading-relaxed">
                <p>
                  You wake up and there's no formation. No one's counting on you to be somewhere
                  at a specific time doing a specific thing. For most people that sounds like freedom.
                  For you it feels like falling.
                </p>
                <p>
                  Civilians are fine. But they don't understand why you scan rooms,
                  why you can't watch a movie without sitting near the exit,
                  or why small talk feels like a foreign language.
                  Explaining yourself gets exhausting.
                </p>
                <p>
                  TAG was built around tactical games, but what it actually is —
                  is a group of men who don't need everything explained.
                  You get on comms and within five minutes you're operating with people
                  who speak the same language, think the same way, and hold the same standard.
                </p>
                <p className="text-foreground font-medium">
                  That's not nothing. Sometimes that's everything.
                </p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-5">
              {[
                { heading: "Structure", body: "Ops nights run on a schedule. There's a chain of command. There's a mission. Your brain knows what to do with that." },
                { heading: "Brotherhood", body: "These aren't randoms. People have your back on the virtual battlefield the same way they would in real life. Trust gets built fast when you're working together under pressure." },
                { heading: "Purpose", body: "You're not just gaming. You're leading a squad, planning an op, training newer members. You're useful again." },
                { heading: "No Explanation Required", body: "Say you're having a rough one, no one asks twenty questions. They just say \"copy that\" and get on with the mission. That's the culture here." },
              ].map((item, i) => (
                <motion.div
                  key={item.heading}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-colors"
                >
                  <h3 className="font-display font-bold uppercase tracking-widest text-primary text-sm mb-2">{item.heading}</h3>
                  <p className="font-sans text-muted-foreground text-sm leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Support Resources */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
              If You Need to<br />
              <span className="text-primary">Talk to Someone</span>
            </h2>
            <p className="font-sans text-muted-foreground max-w-2xl leading-relaxed mb-6">
              Gaming together helps. But if things are dark right now — if you're really struggling —
              the links below connect you to people who specialise in exactly what you're going through.
              Using them isn't weakness. It's the same instinct that made you call for support on the
              battlefield when you needed it.
            </p>

            {/* Location bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 border border-border rounded-lg text-sm">
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground font-display uppercase tracking-wider text-xs">Detecting location…</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-foreground font-display font-bold uppercase tracking-wider text-xs">
                      Showing services for {displayName}
                    </span>
                    {overridden && (
                      <span className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">(manual)</span>
                    )}
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowPicker(p => !p)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                >
                  Wrong location?
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPicker ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 top-full mt-1.5 w-52 bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden"
                    >
                      {COUNTRY_OPTIONS.map(opt => (
                        <button
                          key={opt.code}
                          onClick={() => {
                            override(opt.code, opt.label);
                            setShowPicker(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-display uppercase tracking-wider hover:bg-secondary transition-colors ${
                            countryCode === opt.code ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Resource cards */}
          <AnimatePresence mode="wait">
            {!loading && (
              <motion.div
                key={countryCode ?? "loading"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {resources.map((resource, i) => (
                  <motion.a
                    key={resource.name}
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`group flex items-start gap-5 p-6 rounded-lg border transition-all ${
                      resource.urgent
                        ? "bg-primary/5 border-primary/40 hover:border-primary hover:bg-primary/10"
                        : "bg-card border-border hover:border-primary/40 hover:bg-secondary/40"
                    }`}
                  >
                    <div className={`w-12 h-12 shrink-0 rounded flex items-center justify-center ${
                      resource.urgent ? "bg-primary/20 border border-primary/50" : "bg-secondary border border-border"
                    }`}>
                      <resource.icon className={`w-5 h-5 ${resource.urgent ? "text-primary" : "text-muted-foreground group-hover:text-primary"} transition-colors`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="font-display font-bold uppercase tracking-wider text-sm text-foreground">
                          {resource.name}
                        </h3>
                        {resource.urgent && (
                          <span className="text-[10px] font-display font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded">
                            24/7 Available
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-muted-foreground text-sm leading-relaxed mb-2">
                        {resource.description}
                      </p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-display font-bold text-sm text-primary flex items-center gap-1">
                          {resource.action} <ExternalLink className="w-3 h-3 opacity-60" />
                        </span>
                        {resource.secondary && (
                          <span className="font-display text-xs text-muted-foreground">{resource.secondary}</span>
                        )}
                        {resource.tertiary && (
                          <span className="font-display text-xs text-muted-foreground">{resource.tertiary}</span>
                        )}
                      </div>
                    </div>
                  </motion.a>
                ))}

                {/* International fallback note */}
                {!COUNTRY_RESOURCES[countryCode ?? ""] && countryCode !== null && (
                  <p className="text-xs text-muted-foreground text-center pt-2 font-display uppercase tracking-widest">
                    Don't see your country? Use the "Wrong location?" menu above to browse all supported countries.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Join TAG CTA */}
      <section className="py-20 bg-secondary/20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-6">
              Regroup With Some Battle Buddies
            </h2>
            <p className="font-sans text-muted-foreground text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Whether you're a veteran, active duty, or just someone who thinks in tactics —
              TAG is a place where you belong. Jump in, no pressure. Stay as long as you like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/join"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black uppercase tracking-widest text-sm px-8 py-4 rounded clip-angled shadow-[0_0_20px_hsla(var(--primary),0.3)] hover:shadow-[0_0_30px_hsla(var(--primary),0.5)] transition-all active:scale-95"
              >
                <Users className="w-4 h-4" />
                Join the Unit
              </Link>
              <a
                href="https://discord.gg/matmFhU4yg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-widest text-sm px-8 py-4 rounded clip-angled transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                Join the Discord
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </MainLayout>
  );
}
