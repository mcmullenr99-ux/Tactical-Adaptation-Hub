import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Shield, Target, Award, Users, ChevronDown, ChevronUp, Cpu, Lock, TrendingUp, BarChart3, Info, FileText, Crown, Zap, Map, Radio, FlaskConical, BookOpen, AlertTriangle, ChevronUp as PromoteIcon } from "lucide-react";
import { TagLogo } from "@/components/TagLogo";
import { useSEO } from "@/hooks/useSEO";

// ─────────────────────────────────────────────────────────────────────────────
// Platform Feature Carousel
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  // ── 1. Structure Engine ────────────────────────────────────────────────────
  {
    id: "structure",
    icon: <Cpu className="w-5 h-5" />,
    label: "Structure Engine",
    headline: "Doctrine-Enforced Unit Management",
    summary: "Hard military doctrine inside your unit. Not flavour — rules. Who can hold what rank, how many officers you are allowed, and when new positions unlock.",
    subsections: [
      {
        title: "How It Works",
        body: "Every unit picks British Army or US Army doctrine and is assigned a strength tier based on live active headcount. That tier governs everything. A 12-man section cannot have a Colonel. A 40-man platoon cannot have a General. The system enforces this in real time on every promotion attempt.",
      },
      {
        title: "Strength Tiers",
        table: {
          headers: ["Tier", "Headcount", "What Unlocks"],
          rows: [
            ["Section",   "1-7",        "Junior NCOs, Riflemen"],
            ["Platoon",   "8-35",       "Senior NCOs, Warrant Officers"],
            ["Company",   "36-71",      "Junior Officers (Lt, Capt)"],
            ["Battalion", "72-287",     "Senior Officers (Maj, Lt Col)"],
            ["Regiment",  "288-1,151",  "Colonel"],
            ["Brigade",   "1,152-4,607","Brigadier"],
            ["Division",  "4,608+",     "General Officer grades"],
          ],
        },
      },
      {
        title: "Promotion Caps",
        body: "The engine enforces hard caps on how many officers and SNCOs can exist simultaneously. If your officer slots are full, the promotion is blocked — no workarounds, no exceptions. Prevents the classic milsim problem of a 20-man unit fielding six captains.",
      },
      {
        title: "Progression Multiplier",
        body: "Each tier compounds upward from the one below it. A unit that genuinely grows earns proportionally more leadership capacity. Growth is rewarded — but the headcount must actually be there.",
      },
      {
        title: "What It Prevents",
        pills: ["Rank inflation", "Ghost officer corps", "Vanity ranks", "Soft cap bypasses"],
      },
    ],
  },

  // ── 2. Capability Scoring ──────────────────────────────────────────────────
  {
    id: "scoring",
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Capability Scoring",
    headline: "Operational Capability Scoring & Unit Evaluation",
    summary: "Objective measurement of how combat-ready a unit actually is — not based on what they claim, but on what they can demonstrate through recorded activity, doctrine, and live platform data.",
    subsections: [
      {
        title: "14 Scoring Pillars",
        table: {
          headers: ["Pillar", "Max", "What It Measures"],
          rows: [
            ["Manpower",            "40",  "Active verified headcount vs tier"],
            ["Member Activity",     "25",  "% of roster active in last 30 days"],
            ["Operations History",  "35",  "Verified operations logged"],
            ["Op Recency",          "20",  "How recently the last op was run"],
            ["AAR Discipline",      "25",  "AARs filed vs operations completed"],
            ["Training Doctrine",   "60",  "Depth of SOPs, TTPs, ROE, drills"],
            ["Discord Linked",      "10",  "Discord server connected to profile"],
            ["Page Maintenance",    "10",  "Recency of unit page updates"],
            ["Reputation",          "15",  "Community review average score"],
            ["Combat Intel",        "25",  "Win rate & objective data from AARs"],
            ["Game Breadth",        "15",  "Active strength across all listed games"],
            ["Doctrine Bonus",      "20",  "Full SOP+TTP+ROE+Drill set at depth 70+"],
            ["Joint Ops",           "20",  "Inter-unit ops, tier & win rate"],
            ["Accountability",      "+-20","Live modifier: conduct, PIOs, LOA, fitness"],
          ],
        },
      },
      {
        title: "Capability Tiers",
        tiers: [
          { tier: "POOR",        range: "0-74",        colour: "text-red-400",     desc: "No record, no doctrine, no verified activity." },
          { tier: "LIMITED",     range: "75-199",      colour: "text-amber-400",   desc: "Minimal ops and insufficient training docs." },
          { tier: "TACTICAL",    range: "200-399",     colour: "text-yellow-400",  desc: "Building op history. Some doctrine in place." },
          { tier: "OPERATIONAL", range: "400-649",     colour: "text-emerald-400", desc: "Consistent record and growing doctrine framework." },
          { tier: "STRATEGIC",   range: "650-899",     colour: "text-green-400",   desc: "Strong output, solid reputation, multi-domain doctrine." },
          { tier: "SOC",         range: "900-1,199",   colour: "text-blue-400",    desc: "Elite AAR discipline and comprehensive multi-type training." },
          { tier: "SOF",         range: "1,200+",      colour: "text-purple-400",  desc: "Highest designation. Exceptional across every pillar." },
        ],
      },
      {
        title: "Accountability Modifiers",
        body: "Live penalties and bonuses applied on top of all other scores. Conduct reports (up to -20pts), breached PIOs (-10pts), role fitness failures (-10pts), excessive LOA rate (-10pts). Active fitness reviews and training reviews each add up to +10pts. Updates the moment the underlying record changes.",
      },
      {
        title: "Verification Badge",
        body: "Separate from the tier — a 0-100 score that gates the Verified badge on the public registry. Requires: 3+ active members, 5+ AARs, activity within 90 days, logo, description, and at least one game. Losing any condition removes the badge automatically.",
      },
    ],
  },

  // ── 3. Joint Ops ──────────────────────────────────────────────────────────
  {
    id: "jointops",
    icon: <Target className="w-5 h-5" />,
    label: "Joint Ops",
    headline: "Inter-Unit Combat & Joint Operations",
    summary: "Units can challenge each other to cross-unit operations — head-to-head or cooperative. Every outcome is tracked, confirmed, and fed into a living Combat Record that contributes to capability scoring.",
    subsections: [
      {
        title: "How It Works",
        body: "A commander issues a challenge to another unit — specifying game, op type, and proposed date. The defending unit accepts or declines. When the op completes, both commanders submit their outcome. Results are only recorded once both sides confirm — no unilateral win claims.",
      },
      {
        title: "Combat Record",
        body: "Every unit has a Combat Record tracking wins, losses, draws, total ops played, current streak, best streak, and points earned. The record feeds directly into the Joint Ops scoring pillar in the Capability Tier system.",
      },
      {
        title: "Tier System",
        tiers: [
          { tier: "POOR",        range: "0-74 pts",       colour: "text-red-400"     },
          { tier: "LIMITED",     range: "75-199 pts",     colour: "text-amber-400"   },
          { tier: "TACTICAL",    range: "200-399 pts",    colour: "text-yellow-400"  },
          { tier: "OPERATIONAL", range: "400-649 pts",    colour: "text-emerald-400" },
          { tier: "STRATEGIC",   range: "650-899 pts",    colour: "text-green-400"   },
          { tier: "SOC",         range: "900-1,199 pts",  colour: "text-blue-400"    },
          { tier: "SOF",         range: "1,200+ pts",     colour: "text-purple-400"  },
        ],
      },
    ],
  },

  // ── 4. Operator Records / Service Files ──────────────────────────────────
  {
    id: "service-files",
    icon: <FileText className="w-5 h-5" />,
    label: "Service Files",
    headline: "Operator Service Files — The Record That Follows You",
    summary: "When an operator applies to your unit, you see their full verified service history pulled directly from the platform — not what they typed in a text box. Every past unit, every conduct report, every discharge, every reputation score from commanders who actually worked with them.",
    subsections: [
      {
        title: "What Commanders See on Every Application",
        colourRows: {
          headers: ["Section", "What It Shows", "Risk Signal"],
          rows: [
            { cells: ["Operator Reputation", "Scored by past commanders — Activity, Attitude, Experience, Discipline.", "Commend / Caution flags from named COs"], accent: "text-emerald-400" },
            { cells: ["Discharge Paperwork", "How and why they left. Voluntary, misconduct, or AWOL. Final rank, final role, who conducted it.", "Misconduct / AWOL visible permanently"], accent: "text-red-400" },
            { cells: ["Conduct Reports", "Any filed incidents, severity, outcome, and resolution note.", "Cannot be hidden or self-deleted"], accent: "text-red-400" },
            { cells: ["Role Fitness Reviews", "Periodic fitness assessments filed by chain of command.", "FIT / UNFIT verdict on record"], accent: "text-amber-400" },
            { cells: ["Promotion Flags", "Every promotion attempt — approved or denied — with criteria met at the time.", "Denied promotions visible to next unit"], accent: "text-amber-400" },
            { cells: ["Leave of Absence", "Every LOA — approved or denied, reason, dates, and who granted it.", "Patterns of absence are visible"], accent: "text-yellow-400" },
            { cells: ["Awards & Decorations", "Issued by a verified commander. Cannot be self-added.", "Fabricated awards impossible"], accent: "text-blue-400" },
            { cells: ["Qualifications", "Certified by instructors — shows who granted it and when.", "Cannot be claimed without a grant record"], accent: "text-blue-400" },
            { cells: ["AARs Authored", "Reports filed by the operator — outcomes, op names, dates.", "Op count is verified, not self-reported"], accent: "text-primary" },
            { cells: ["Rank & Assignment", "Callsign, rank, role, ops count, specialisations, commander note from last CO.", "Full service context at a glance"], accent: "text-primary" },
          ],
        },
      },
      {
        title: "The Problem It Solves",
        highlights: [
          { text: "Unit-hoppers thrive on fresh starts.", colour: "text-red-400" },
          { text: "Every new unit gets the same polished pitch — and no way to verify any of it.", colour: "text-muted-foreground" },
          { text: "On this platform, that stops.", colour: "text-emerald-400" },
          { text: "A commander who left under misconduct cannot hide it. An operator who was AWOL for 3 months has that on file. Conduct that was quietly 'resolved' internally is still visible to the next CO.", colour: "text-muted-foreground" },
        ],
      },
      {
        title: "Built by the Chain of Command — Not the Operator",
        body: "Operators cannot edit their own service file. Every entry is created by a commander, an instructor, or the platform itself based on recorded activity. An operator can claim 40 ops — the file shows 6. An operator can claim a clean conduct record — the file shows two filed reports. The record speaks for itself.",
      },
      {
        title: "What It Prevents",
        pills: ["Unit-hopping with no accountability", "Conduct whitewashing", "Inflated op counts", "Fake qualifications", "Unvetted bad actors cycling through communities"],
      },
    ],
  },

  // ── 5. Auto-Recruitment ──────────────────────────────────────────────────
  {
    id: "auto-recruitment",
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    label: "Auto-Recruitment",
    isPro: true,
    headline: "Automated Recruitment Scheduling",
    summary: "Set your recruitment post once. The platform pushes it to the community board automatically on a schedule you control — so your unit stays visible without someone manually remembering to post every week.",
    subsections: [
      {
        title: "How It Works",
        body: "Commanders build a recruitment card — headline, body, role slots, social links, banner image, and game tags. They set a posting interval (e.g. every 48 hours). A background job fires on schedule and publishes the post to the platform recruitment board automatically, without any manual action.",
      },
      {
        title: "What Goes In a Recruitment Post",
        colourRows: {
          headers: ["Field", "Purpose", "Notes"],
          rows: [
            { cells: ["Headline & Body",    "Your pitch — what the unit is, what you do, what you want.", "Full formatting supported"], accent: "text-primary" },
            { cells: ["Open Role Slots",    "Publicly visible roles with slot status (open / limited / closed).", "Pulled live from your ORBAT"], accent: "text-emerald-400" },
            { cells: ["Game Tags",          "Which titles you play — filters operators searching by game.", "Arma 3, Squad, DayZ, Reforger etc."], accent: "text-blue-400" },
            { cells: ["Banner / Video",     "Uploaded banner image or linked video to stand out.", "Optional but strongly recommended"], accent: "text-primary" },
            { cells: ["Social Links",       "Discord, YouTube, Twitch, Steam, website.", "Directly on the post card"], accent: "text-primary" },
            { cells: ["Posting Interval",   "How often the post fires — minimum 24 hours.", "Pro only — free users post manually"], accent: "text-yellow-400" },
          ],
        },
      },
      {
        title: "Free vs Pro",
        colourRows: {
          headers: ["Feature", "Free", "Pro"],
          rows: [
            { cells: ["Manual post",         "✓ — 48hr cooldown between posts", "✓ — no cooldown"], accent: "text-muted-foreground" },
            { cells: ["Auto-schedule",        "✗ — not available",              "✓ — set interval, runs automatically"], accent: "text-yellow-400" },
            { cells: ["Open role display",    "✗",                              "✓ — live slot counts on the post"], accent: "text-yellow-400" },
            { cells: ["Banner image upload",  "✗",                              "✓"], accent: "text-yellow-400" },
            { cells: ["Post count tracking",  "✗",                              "✓ — total post count shown on card"], accent: "text-yellow-400" },
          ],
        },
      },
      {
        title: "What It Prevents",
        pills: ["Recruitment going cold", "Manual posting fatigue", "Inconsistent visibility", "Units disappearing from the board for weeks"],
      },
    ],
  },

  // ── 6. Featured Registry Badge ────────────────────────────────────────────
  {
    id: "featured-badge",
    icon: <Crown className="w-5 h-5 text-yellow-400" />,
    label: "Featured Registry",
    isPro: true,
    headline: "Priority Placement & Featured Badge",
    summary: "Pro units appear at the top of the public registry with a Featured badge. Every operator searching for a unit sees your card first — not buried three pages in behind 200 other groups.",
    subsections: [
      {
        title: "What Featured Unlocks",
        colourRows: {
          headers: ["Feature", "Standard", "Featured (Pro)"],
          rows: [
            { cells: ["Registry placement",     "Sorted by capability score",           "Pinned to top of results"], accent: "text-yellow-400" },
            { cells: ["Featured badge",          "Not shown",                            "Gold Featured badge on registry card"], accent: "text-yellow-400" },
            { cells: ["Verified badge",          "Earned via verification score 60+",    "Displayed alongside Featured"], accent: "text-emerald-400" },
            { cells: ["Recruitment card boost",  "Standard board placement",             "Elevated in recruitment board results"], accent: "text-yellow-400" },
            { cells: ["Registry card styling",   "Standard card",                        "Pro crown indicator on card"], accent: "text-yellow-400" },
          ],
        },
      },
      {
        title: "Who Sees It",
        body: "The public registry is the first place any operator lands when looking for a unit. Operators browse by game, nationality, unit type, and capability tier. Featured units appear above the standard listing regardless of how the results are sorted — guaranteed top-of-page visibility for every search.",
      },
      {
        title: "Verified vs Featured",
        highlights: [
          { text: "Verified is earned — not bought.", colour: "text-emerald-400" },
          { text: "It requires 3+ active members, 5+ AARs, recent activity, a logo, a description, and at least one game. The badge is removed automatically if conditions lapse.", colour: "text-muted-foreground" },
          { text: "Featured is Pro.", colour: "text-yellow-400" },
          { text: "It gives you placement. Verified gives you credibility. The strongest units on the platform carry both.", colour: "text-muted-foreground" },
        ],
      },
      {
        title: "What It Prevents",
        pills: ["New units drowning in search results", "Good units going unnoticed", "Recruitment slowdown from poor visibility"],
      },
    ],
  },

  // ── 7. Intelligence Room ─────────────────────────────────────────────────
  {
    id: "intel-room",
    icon: <FlaskConical className="w-5 h-5" />,
    label: "Intelligence Room",
    headline: "J2 Intelligence — Operational Intel Management",
    summary: "A classified document store for your unit's operational intelligence. Archive SALUTE reports, threat profiles, op-specific intel docs, and historical records — all classified, all searchable, all linked to the operations they came from.",
    subsections: [
      {
        title: "What Lives in the Intel Room",
        colourRows: {
          headers: ["Document Type", "What It Contains", "Classification"],
          rows: [
            { cells: ["SALUTE Reports",    "Size, Activity, Location, Unit, Time, Equipment — filed during live ops.", "RESTRICTED / SECRET"], accent: "text-red-400" },
            { cells: ["Threat Profiles",   "Named enemy units — known games, tactics, equipment, engagement history, threat level.", "SECRET / TOP SECRET"], accent: "text-red-400" },
            { cells: ["Intel Documents",   "Freeform classified docs — orders, maps, analysis. Linked to an op or campaign.", "Configurable per doc"], accent: "text-amber-400" },
            { cells: ["Archived Reports",  "AARs, WARNOs, LACEs, SITREPs, Conduct Reports pushed here via Archive to Intel.", "Inherits source classification"], accent: "text-amber-400" },
            { cells: ["Campaign Intel",    "Intel docs scoped to a campaign rather than a single op — persistent across multiple operations.", "RESTRICTED+"], accent: "text-blue-400" },
          ],
        },
      },
      {
        title: "SALUTE Reports",
        body: "Filed by operators during or immediately after contact. Captures the full NATO SALUTE format — size, activity, location, unit, time observed, equipment. Confirmable by other operators who were present. Feeds directly into the Threat Profile for that enemy unit.",
      },
      {
        title: "Threat Profiles",
        body: "Enemy unit profiles built up over multiple engagements. Known games, documented tactics, equipment loadouts, engagement history, and a manually set threat level. Analysts update the profile after each contact — so every future op starts with institutional knowledge rather than nothing.",
      },
      {
        title: "Archive to Intel",
        body: "Any operational report — AAR, WARNO, LACE, SITREP, Conduct — can be pushed directly into the Intel archive from within the report itself. The document lands in J2 tagged to its source op, classified, and searchable. Nothing is lost between operations.",
      },
      {
        title: "What It Builds",
        highlights: [
          { text: "Collective tactical memory.", colour: "text-emerald-400" },
          { text: "Every SALUTE, every threat profile, every archived AAR is a data point. Over time your unit develops a body of knowledge about how enemy units operate, what tactics fail in which AOs, and where previous plans broke down.", colour: "text-muted-foreground" },
          { text: "That knowledge sharpens every decision made in the next planning cycle.", colour: "text-primary" },
          { text: "The difference between a unit that gets better and one that repeats the same mistakes is whether anyone bothered to record what happened. The Intel Room makes that the default, not the exception.", colour: "text-muted-foreground" },
        ],
      },
      {
        title: "What It Prevents",
        pills: ["Intel lost between ops", "Repeated contact with the same enemy unit and no institutional memory", "Unclassified sensitive reports", "SALUTE data going nowhere"],
      },
    ],
  },

  // ── 8. Op Planning Room ───────────────────────────────────────────────────
  {
    id: "planning-room",
    icon: <BookOpen className="w-5 h-5" />,
    label: "Planning Room",
    isPro: true,
    headline: "Op Planning Room — 7-Phase Structured Operation Planning",
    summary: "A full structured planning environment built around the NATO operational planning cycle. Every op moves through defined phases — from Warning Order to Consolidation — with linked records, task tracking, and team discussion baked in.",
    subsections: [
      {
        title: "The 7 Phases",
        colourRows: {
          headers: ["Phase", "Purpose", "Key Output"],
          rows: [
            { cells: ["1 — Planning",        "Initial analysis, situation assessment, mission statement.", "WARNO issued"], accent: "text-red-400" },
            { cells: ["2 — Preparation",     "Task assignment, loadout confirmation, comms plan finalised.", "Orders issued to sections"], accent: "text-amber-400" },
            { cells: ["3 — Briefing",        "Full operation order delivered to all participants.", "Op Briefing published"], accent: "text-yellow-400" },
            { cells: ["4 — Insertion",       "Movement to AO, comms check, final coordination.", "All callsigns confirmed"], accent: "text-emerald-400" },
            { cells: ["5 — Execution",       "Live operation — LACE, SITREP, SALUTE reports filed in real time.", "Operational reports logged"], accent: "text-blue-400" },
            { cells: ["6 — Extraction",      "Withdrawal, casualty accounting, equipment recovery.", "LACE final filed"], accent: "text-primary" },
            { cells: ["7 — Consolidation",   "AAR filed, intel archived, lessons learned recorded.", "Op closed — record permanent"], accent: "text-purple-400" },
          ],
        },
      },
      {
        title: "What's Linked Inside Each Op",
        body: "Every planning room links directly to the op's WARNO, Briefing, LACE reports, SITREPs, AAR, and Intel documents. No jumping between tabs — everything filed against this op surfaces here. Phase completion is tracked visually with a fill-progress indicator so command can see at a glance how prepared the unit is.",
      },
      {
        title: "Team Discussion",
        body: "Each op has a built-in discussion thread for planning coordination — questions, amendments, callsign assignments. Timestamped, attributed, and persistent. Replaces the chaos of Discord threads where planning context gets buried and lost.",
      },
      {
        title: "What It Builds",
        highlights: [
          { text: "Command competence — at every level.", colour: "text-emerald-400" },
          { text: "Running ops through defined phases forces section commanders to think ahead, not just react. Preparation, task assignment, contingency planning — all of it has to happen before Execution, because the structure requires it.", colour: "text-muted-foreground" },
          { text: "Over time, that process becomes instinct. Units that plan properly execute better, adapt faster, and produce AARs that actually reflect a coherent intent.", colour: "text-primary" },
        ],
      },
      {
        title: "What It Prevents",
        pills: ["Ops run without a plan", "Planning scattered across Discord", "No record of what was planned vs what happened", "Lessons learned lost after the op closes"],
      },
    ],
  },

  // ── 9. AO Map ─────────────────────────────────────────────────────────────
  {
    id: "ao-map",
    icon: <Map className="w-5 h-5" />,
    label: "AO Map",
    isPro: true,
    headline: "AO Map — Tactical Planning on Real Game Terrain",
    summary: "A live map canvas loaded with real topographic tiles from the actual in-game terrain. Mark objectives, draw phase lines, place unit markers, set bearing overlays, and plan arty fire — all on the correct map, at scale.",
    subsections: [
      {
        title: "Supported Maps",
        colourRows: {
          headers: ["Game", "Maps Available", "Tile Source"],
          rows: [
            { cells: ["Arma 3",         "Altis, Stratis, Tanoa, Malden, Livonia + community maps", "Real topo tiles — North-at-bottom convention"], accent: "text-emerald-400" },
            { cells: ["Squad",          "Jensen's Range, Yehorivka, Kohat, Mestia + more", "Real topo tiles"], accent: "text-blue-400" },
            { cells: ["DayZ",           "Chernarus, Sakhal, Livonia", "Real topo tiles"], accent: "text-amber-400" },
            { cells: ["Arma Reforger",  "Everon, Arland", "In development"], accent: "text-muted-foreground" },
          ],
        },
      },
      {
        title: "Planning Tools",
        colourRows: {
          headers: ["Tool", "What It Does"],
          rows: [
            { cells: ["Unit Markers",     "Place NATO APP-6 standard unit icons — infantry, armour, logistics, command."], accent: "text-primary" },
            { cells: ["Phase Lines",      "Draw named phase lines across the AO with colour coding."], accent: "text-blue-400" },
            { cells: ["Objective Markers","Mark primary, secondary, and tertiary objectives with status indicators."], accent: "text-emerald-400" },
            { cells: ["Bearing Tool",     "Cast bearings from any point — for comms references and arty direction."], accent: "text-amber-400" },
            { cells: ["Artillery Overlay","Select arty system, mark firing position, overlay effective range rings."], accent: "text-red-400" },
            { cells: ["Measurement",      "Distance and area measurement calibrated to real in-game scale."], accent: "text-primary" },
          ],
        },
      },
      {
        title: "What It Builds",
        highlights: [
          { text: "Spatial awareness and terrain literacy.", colour: "text-emerald-400" },
          { text: "When commanders plan on the actual terrain, they make better decisions about approach routes, fire positions, and phase boundaries. They stop treating the AO as abstract and start reading it as ground.", colour: "text-muted-foreground" },
          { text: "Briefings with a real map behind them land differently. Operators go into the op knowing exactly where they are, where the objective is, and what the ground looks like between them.", colour: "text-primary" },
        ],
      },
      {
        title: "What It Prevents",
        pills: ["Planning on a blank canvas with no terrain context", "Wrong scale assumptions", "Arty miscalculations", "Briefings with no visual reference"],
      },
    ],
  },

  // ── 10. Comms Plans ───────────────────────────────────────────────────────
  {
    id: "comms-plans",
    icon: <Radio className="w-5 h-5" />,
    label: "Comms Plans",
    isPro: true,
    headline: "Comms Plan Generator — NATO-Formatted Signal Orders",
    summary: "Build your unit's communications plan inside the platform and export it as a formatted NATO SIGORD. Frequencies, callsigns, encryption, relay procedures — structured, consistent, and attached directly to the op.",
    subsections: [
      {
        title: "What a Comms Plan Contains",
        colourRows: {
          headers: ["Section", "What It Defines", "NATO Reference"],
          rows: [
            { cells: ["Net List",          "Every radio net — command, logistics, fires, inter-unit. Frequency + purpose.", "SIGORD Part 1"], accent: "text-primary" },
            { cells: ["Callsign Table",    "Every callsign assigned for the op — element, callsign, net, radio operator.", "SIGORD Part 2"], accent: "text-primary" },
            { cells: ["COMSEC",           "Encryption in use, challenge/password, code words.", "SIGORD Part 3"], accent: "text-red-400" },
            { cells: ["Relay Procedures", "What happens when comms break down — relay routes, alternate freqs.", "SIGORD Part 4"], accent: "text-amber-400" },
            { cells: ["Emergency Signals","Lost comms protocol, last resort signals, exfil triggers.", "SIGORD Part 5"], accent: "text-red-400" },
          ],
        },
      },
      {
        title: "Linked to the Op",
        body: "Comms plans are created inside an op record and attached directly to it. When the briefing is published, the comms plan is part of it. When the op closes and archives to intel, the comms plan archives with it. Every op has a permanent record of exactly what comms structure was in place.",
      },
      {
        title: "Export",
        body: "The completed plan exports as a formatted document — ready to paste into Discord, post in a briefing channel, or print for a tabletop planning session. Structure is consistent across every op so every operator knows exactly where to find what they need.",
      },
      {
        title: "What It Builds",
        highlights: [
          { text: "Comms discipline as a unit habit.", colour: "text-emerald-400" },
          { text: "When every op has a written comms plan, operators stop improvising on net. They know their callsign, their freq, and their relay before the op starts. That discipline compounds — units that run structured comms consistently develop faster reaction times and fewer net failures under pressure.", colour: "text-muted-foreground" },
          { text: "The archive of past comms plans also becomes a resource. What freqs worked. What relay routes held. What broke. That informs the next plan.", colour: "text-primary" },
        ],
      },
      {
        title: "What It Prevents",
        pills: ["Ad-hoc frequency decisions made on the fly", "Callsign confusion mid-op", "Comms plan existing only in someone's head", "No record of what comms structure was used"],
      },
    ],
  },

  // ── 11. Accountability Tracker ───────────────────────────────────────────
  {
    id: "accountability",
    icon: <AlertTriangle className="w-5 h-5" />,
    label: "Accountability",
    isPro: true,
    headline: "Accountability Tracker — Leadership That Actually Has Consequences",
    summary: "Role Fitness Reviews, Performance Improvement Orders, and automated role-lapsing. The platform tracks whether your leaders, instructors, and NCOs are actually doing their jobs — and flags it when they aren't.",
    subsections: [
      {
        title: "The Three Tools",
        colourRows: {
          headers: ["Tool", "What It Does", "Who Files It"],
          rows: [
            { cells: ["Role Fitness Review",            "Periodic assessment of whether a member is meeting the expectations of their role. FIT or UNFIT verdict, with notes. Member must acknowledge.", "Chain of command"], accent: "text-emerald-400" },
            { cells: ["Performance Improvement Order",  "Formal PIO issued when a member is underperforming. Defines tasks, sets a deadline, tracks outcome. Open PIOs show on the service file.", "Leadership only"], accent: "text-amber-400" },
            { cells: ["Role Lapsing",                   "Automatic. If a role has defined activity thresholds (ops per month, training sessions, AARs filed) and a member stops meeting them, their role badge grays out publicly.", "System — automatic"], accent: "text-red-400" },
          ],
        },
      },
      {
        title: "Role Expectations",
        body: "Commanders define minimum activity thresholds per role — minimum ops per 30 days, training sessions, AARs filed, applications reviewed. If a member holding that role falls below threshold for the defined lapse period, role-lapsing triggers automatically. No manual intervention needed.",
      },
      {
        title: "Accountability Modifier",
        highlights: [
          { text: "Accountability is live-scored and feeds directly into your unit's Capability Tier.", colour: "text-primary" },
          { text: "Conduct reports on file: up to -20 pts. Breached PIOs: -10 pts. Role fitness failures: -10 pts. Excessive LOA rate: -10 pts.", colour: "text-red-400" },
          { text: "Active fitness reviews and training reviews in place: up to +10 pts each.", colour: "text-emerald-400" },
          { text: "A unit that holds its people to a standard scores higher. A unit that lets conduct slide scores lower. Publicly.", colour: "text-muted-foreground" },
        ],
      },
      {
        title: "Conduct Reports",
        body: "Filed by leadership against a named member. Severity-graded (Low / Medium / High), categorised, with evidence, outcome, and resolution note attached. Outcome options include counselling, warning, demotion, or discharge. The report is permanent on the member's service file — visible to future units when they apply.",
      },
      {
        title: "What It Builds",
        highlights: [
          { text: "A culture where standards are real, not decorative.", colour: "text-emerald-400" },
          { text: "When members know that role fitness is reviewed, that PIOs are tracked, and that inactivity is automatically flagged — they perform differently. Not because they fear consequences, but because the standard is visible and consistent for everyone.", colour: "text-muted-foreground" },
          { text: "Leadership that has been through a fitness review and passed carries genuine credibility. The rank means something because the system ensured they earned it.", colour: "text-primary" },
          { text: "Over time, accountability tools don't create conflict — they prevent it. Issues are caught early, documented properly, and resolved with a paper trail rather than a Discord argument.", colour: "text-muted-foreground" },
        ],
      },
      {
        title: "What It Prevents",
        pills: ["Ghost leaders holding ranks they don't earn", "No consequences for repeated misconduct", "PIOs issued verbally and never followed up", "Inactivity silently tolerated at leadership level"],
      },
    ],
  },

  // ── 12. Auto Promotion Engine ─────────────────────────────────────────────
  {
    id: "promotion-engine",
    icon: <TrendingUp className="w-5 h-5" />,
    label: "Promotion Engine",
    isPro: true,
    headline: "Automated Promotion Engine — No Promotion Slips Through the Cracks",
    summary: "Define your promotion criteria once. The platform monitors every roster member against those rules and flags eligible members automatically — so command never misses a promotion, and every promotion decision is backed by verified data.",
    subsections: [
      {
        title: "How Promotion Rules Work",
        body: "Commanders create a promotion rule for each rank transition — e.g. Lance Corporal → Corporal. The rule defines the minimum criteria that must all be met before the system flags the member as eligible. Rules are specific to your unit and can be updated at any time.",
      },
      {
        title: "Rule Criteria",
        colourRows: {
          headers: ["Criterion", "What It Checks", "Data Source"],
          rows: [
            { cells: ["Minimum Ops",          "Total verified operations the member has participated in.", "MilsimOp participant records"], accent: "text-emerald-400" },
            { cells: ["Minimum Tenure",       "Days since the member's enlistment date.", "MilsimRoster join_date"], accent: "text-blue-400" },
            { cells: ["AAR Filed",            "Whether the member has filed at least one AAR.", "MilsimAAR authored records"], accent: "text-amber-400" },
            { cells: ["No Active Conduct",    "No unresolved conduct reports on file.", "MilsimConductReport — open only"], accent: "text-red-400" },
          ],
        },
      },
      {
        title: "Promotion Flags",
        body: "When a member meets all criteria for a rule, a Promotion Flag is automatically raised and surfaced to leadership. The flag shows the member's callsign, current rank, target rank, ops count at flag time, and tenure in days. Leadership reviews the flag and either approves or denies — with a review note. The flag and its outcome are permanently recorded on the member's service file.",
      },
      {
        title: "What Commanders See",
        highlights: [
          { text: "A live list of every member eligible for promotion — right now.", colour: "text-emerald-400" },
          { text: "Exact criteria met at the time the flag was raised — ops count, tenure, AAR status, conduct status.", colour: "text-muted-foreground" },
          { text: "One-click approve or deny, with a mandatory review note.", colour: "text-primary" },
          { text: "Every decision logged permanently. Denied promotions are visible on the operator's service file when they apply to other units.", colour: "text-amber-400" },
        ],
      },
      {
        title: "What It Builds",
        highlights: [
          { text: "A promotion system members actually trust.", colour: "text-emerald-400" },
          { text: "When criteria are defined, published, and applied consistently by the platform — not by a commander's memory on a given day — operators know exactly what they're working toward. There's no ambiguity, no wondering if someone else got promoted faster because they're mates with the CO.", colour: "text-muted-foreground" },
          { text: "Timely promotions also retain good operators. The fastest way to lose a solid NCO is to make them feel invisible. The engine makes sure that doesn't happen.", colour: "text-primary" },
          { text: "And because every decision is logged with a review note, the record of how your unit handles promotion is permanently transparent — to command, and to every operator who reviews their service file.", colour: "text-muted-foreground" },
        ],
      },
      {
        title: "What It Prevents",
        pills: ["Promotions forgotten for months", "Favouritism with no paper trail", "Inconsistent criteria applied differently to different members", "Members waiting years because no one noticed they qualified"],
      },
    ],
  },

  // ── NEXT ENTRY — add here when approved ───────────────────────────────────
]

function PlatformFeatureCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const DURATION = 60000;
  const TICK = 200;

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p + TICK >= DURATION) {
          setActive(a => (a + 1) % FEATURES.length);
          return 0;
        }
        return p + TICK;
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [paused, active]);

  const feature = FEATURES[active];

  function renderSubsection(sub: any, i: number) {
    return (
      <div key={i} className="space-y-2">
        <h4 className="font-display font-bold uppercase tracking-wider text-xs text-primary">{sub.title}</h4>
        {sub.body && <p className="text-muted-foreground font-sans text-sm leading-relaxed">{sub.body}</p>}
        {sub.pills && (
          <div className="flex flex-wrap gap-2">
            {sub.pills.map((p: string, j: number) => (
              <span key={j} className="text-[11px] font-sans bg-secondary border border-border rounded px-2.5 py-1 text-muted-foreground">{p}</span>
            ))}
          </div>
        )}
        {sub.table && (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="bg-secondary/60 border-b border-border">
                  {sub.table.headers.map((h: string, j: number) => (
                    <th key={j} className="text-left px-3 py-2 font-display font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sub.table.rows.map((row: string[], j: number) => (
                  <tr key={j} className={`border-b border-border last:border-0 ${j % 2 === 0 ? "bg-card" : "bg-secondary/20"}`}>
                    {row.map((cell, k) => (
                      <td key={k} className={`px-3 py-2 ${k === 0 ? "font-display font-bold text-foreground uppercase tracking-wider" : k === 1 ? "font-mono text-primary" : "text-muted-foreground"}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sub.colourRows && (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="bg-secondary/60 border-b border-border">
                  {sub.colourRows.headers.map((h: string, j: number) => (
                    <th key={j} className="text-left px-3 py-2 font-display font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sub.colourRows.rows.map((row: any, j: number) => (
                  <tr key={j} className={`border-b border-border last:border-0 ${j % 2 === 0 ? "bg-card" : "bg-secondary/20"}`}>
                    <td className={`px-3 py-2 font-display font-bold uppercase tracking-wider ${row.accent}`}>{row.cells[0]}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.cells[1]}</td>
                    <td className={`px-3 py-2 font-sans text-[11px] ${row.accent} opacity-80`}>{row.cells[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sub.highlights && (
          <div className="space-y-2">
            {sub.highlights.map((h: any, j: number) => (
              <p key={j} className={`font-sans text-sm leading-relaxed font-semibold ${h.colour}`}>{h.text}</p>
            ))}
          </div>
        )}
        {sub.tiers && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sub.tiers.map((t: any, j: number) => (
              <div key={j} className="bg-secondary/40 border border-border rounded p-2.5 text-center">
                <p className={`font-display font-black uppercase tracking-widest text-xs ${t.colour}`}>{t.tier}</p>
                <p className="text-muted-foreground font-mono text-[10px] mt-0.5">{t.range}</p>
                {t.desc && <p className="text-muted-foreground text-[10px] font-sans mt-1 leading-snug">{t.desc}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded px-4 py-1.5 mb-4">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-bold uppercase tracking-wider text-primary">Platform Features</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-2">What TAG Does</h2>
        <p className="text-muted-foreground font-sans text-sm">Hover to pause. Click a tab to jump.</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {FEATURES.map((f, i) => (
          <button
            key={f.id}
            onClick={() => { setActive(i); setProgress(0); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
              i === active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-secondary rounded mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded transition-none"
          style={{ width: `${(progress / DURATION) * 100}%` }}
        />
      </div>

      {/* Feature panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 md:p-8"
        >
          {/* Feature headline */}
          <div className="mb-6 pb-5 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className={feature.isPro ? "text-yellow-400" : "text-primary"}>{feature.icon}</span>
              <span className={`text-xs font-display font-bold uppercase tracking-wider ${feature.isPro ? "text-yellow-400" : "text-primary"}`}>{feature.label}</span>
              {feature.isPro && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-display font-bold uppercase tracking-widest">
                  <Crown className="w-2.5 h-2.5" /> Pro
                </span>
              )}
            </div>
            <h3 className="text-2xl font-display font-bold uppercase tracking-wider text-foreground mb-2">{feature.headline}</h3>
            <p className="text-muted-foreground font-sans leading-relaxed">{feature.summary}</p>
          </div>

          {/* Subsections */}
          <div className="space-y-6">
            {feature.subsections.map((sub, i) => renderSubsection(sub, i))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => { setActive(a => (a - 1 + FEATURES.length) % FEATURES.length); setProgress(0); }}
          className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded hover:border-primary/50 transition-all"
        >
          Previous
        </button>
        <span className="text-xs text-muted-foreground font-sans self-center">{active + 1} / {FEATURES.length}</span>
        <button
          onClick={() => { setActive(a => (a + 1) % FEATURES.length); setProgress(0); }}
          className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded hover:border-primary/50 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
}


const STRENGTH_TIERS = [
  { label: "Fireteam",  range: "1-7",        unlocks: "Enlisted & NCOs only" },
  { label: "Section",   range: "8-35",        unlocks: "Expanded NCO allowance" },
  { label: "Platoon",   range: "36-71",       unlocks: "SNCOs + Junior Officers (2Lt / Lt)" },
  { label: "Company",   range: "72-287",      unlocks: "Senior Officers (Capt / Maj) + Staff" },
  { label: "Battalion", range: "288-1,151",   unlocks: "Lieutenant Colonel" },
  { label: "Regiment",  range: "1,152-4,607", unlocks: "Colonel" },
  { label: "Brigade",   range: "4,608+",      unlocks: "Full General tier (Brig through FM)" },
];

const PROMO_CAPS = [
  { tier: "Platoon",   officers: 1,  sNCOs: 2  },
  { tier: "Company",   officers: 2,  sNCOs: 4  },
  { tier: "Battalion", officers: 4,  sNCOs: 8  },
  { tier: "Regiment",  officers: 8,  sNCOs: 16 },
  { tier: "Brigade",   officers: 16, sNCOs: 32 },
];

const FAQS = [
  { q: "Is TAG free to join?",
    a: "Yes. Registering on the platform and applying to a unit is completely free. Commander Pro is an optional subscription for unit commanders who want access to advanced management tools -- it has no bearing on member access." },
  { q: "What games does TAG support?",
    a: "Arma 3, Arma Reforger, Squad, Ready Or Not, Escape From Tarkov, Ground Branch, DayZ, Grey Zone Warfare, Body Cam, Operator, Exfil, and Hell Let Loose. More titles are added as the platform grows." },
  { q: "How do I join a unit?",
    a: "Browse the Milsim Registry, find a unit that matches your playstyle and availability, and submit an application directly through the platform. Each unit runs its own application process and may include custom screening questions." },
  { q: "Can I run my own unit on TAG?",
    a: "Yes. Any registered user can create a Milsim Group. You get access to a full HQ portal including roster management, rank structures, op planning, and more. Commander Pro unlocks the advanced tier -- automated recruitment, promotion engines, campaign tracking, and analytics." },
  { q: "What is Commander Pro?",
    a: "Commander Pro is a subscription tier for unit commanders. It unlocks features like the automated promotion engine, recruitment scheduler, AI op debriefs, unit health dashboard, combat record tracking, and the full intelligence suite. It is designed for serious units that want to run a professional operation." },
  { q: "How does the Structure Engine prevent rank inflation?",
    a: "Every rank is assigned a class (Enlisted, NCO, SNCO, Junior Officer, Senior Officer, General). Each class only unlocks at a specific headcount threshold. On top of that, hard caps on the number of officers and SNCOs are enforced per tier. A promotion attempt that would breach either rule is blocked automatically." },
  { q: "What is the PJHQ system?",
    a: "PJHQ stands for Permanent Joint Headquarters -- the organisational model used to structure the unit HQ portal. Each tab corresponds to a J-code function: J1 is Human Resources, J2 is Intelligence, J3 is Operations, J4 is Logistics, J5 is Planning, J6 is Comms, J7 is Training, and J8 is Finance and Analytics. It mirrors how real joint operations headquarters are organised." },
  { q: "Are unit ranks and awards tied to real military systems?",
    a: "Unit commanders define their own rank structures, names, and insignia -- so you can run British, US, or entirely fictional doctrine. The ribbon bar system supports real-world post-1980 military awards from dozens of nations, with eligibility rules enforced to maintain authenticity." },
  { q: "How do Discord slash commands work with TAG?",
    a: "TAG's Discord bot supports native slash commands -- /op, /lace, /sitrep, /loa, and /aar. These commands open structured modals directly in Discord. When submitted, the data writes straight into the platform without anyone needing to log in to the website. Reports appear in the relevant J3 tabs in real time." },
  { q: "What is the Joint Ops system?",
    a: "Joint Ops lets units challenge each other to cross-unit operations -- head-to-head or cooperative. Each unit has a Combat Record tracking wins, losses, draws, points, and win rate. Outcomes are submitted by both commanders and confirmed before the record updates, preventing false results." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-card hover:bg-secondary/40 transition-colors"
      >
        <span className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-primary shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 text-sm text-muted-foreground font-sans leading-relaxed border-t border-border bg-secondary/20">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function About() {
  useSEO({ title: "About Us", description: "Learn about TAG -- history, values, and the platform behind the community." });

  return (
    <MainLayout>

      {/* ── HEADER ── */}
      <div className="bg-secondary/50 border-b border-border py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/tactical-texture.png)`, backgroundSize: "cover" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-wider mb-4">Who We Are</h1>
            <div className="w-24 h-1 bg-primary mb-4" />
            <p className="text-xl text-muted-foreground max-w-2xl font-sans">
              The history, mission, core values, and platform behind the Tactical Adaptation Group.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── MISSION ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-display font-bold uppercase tracking-wider mb-6 text-primary">The TAG Mission</h2>
              <div className="space-y-6 text-muted-foreground font-sans text-lg leading-relaxed">
                <p>TAG (Tactical Adaptation Group) was forged from a singular frustration: the chaos of public lobbies and the lack of coordinated, tactical gameplay in modern shooters. We are not just another gaming clan -- we are a dedicated unit.</p>
                <p>Our mission is simple: to bring together mature gamers, teach them fundamental warfighting skills adapted for virtual environments, and build a cohesive community that dominates every server we enter.</p>
                <p>We believe that tactics, communication, and discipline triumph over raw reflexes. By adopting real-world military doctrine to our supported games, we create an immersive, highly effective gaming experience.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="relative flex items-center justify-center rounded-lg border border-border bg-card overflow-hidden aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 23px,currentColor 23px,currentColor 24px),repeating-linear-gradient(90deg,transparent,transparent 23px,currentColor 23px,currentColor 24px)" }} />
              <div className="absolute w-[320px] h-[320px] bg-card" style={{ zIndex: 5 }} />
              <div className="relative p-8" style={{ zIndex: 10 }}><TagLogo size={320} /></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="py-20 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-4">Core Values</h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Shield className="w-8 h-8 text-primary" />, title: "Discipline", desc: "We maintain comms discipline, respect chain of command during operations, and execute plans with precision." },
              { icon: <Target className="w-8 h-8 text-primary" />, title: "Adaptation", desc: "No plan survives first contact. We teach our members to read the battlefield and adapt strategies on the fly." },
              { icon: <Users className="w-8 h-8 text-primary" />, title: "Brotherhood", desc: "We leave no one behind. We foster a mature, respectful environment where members support each other." },
              { icon: <Award className="w-8 h-8 text-primary" />, title: "Excellence", desc: "We are always learning and refining. Our SOPs are tested, proven, and built to make every player more effective." },
            ].map((val, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-secondary/40 border border-border p-8 rounded clip-angled hover:bg-secondary hover:border-primary/50 transition-all">
                <div className="w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center mb-6 shadow-inner">{val.icon}</div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider mb-3 text-foreground">{val.title}</h3>
                <p className="text-muted-foreground font-sans text-sm leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STRUCTURE ENGINE ── */}
      <section className="py-20 border-t border-border bg-secondary/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PlatformFeatureCarousel />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded px-4 py-1.5 mb-4">
              <Info className="w-4 h-4 text-accent" />
              <span className="text-xs font-display font-bold uppercase tracking-wider text-accent">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-4">Frequently Asked Questions</h2>
            <div className="w-24 h-1 bg-accent mx-auto" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </motion.div>
        </div>
      </section>

    </MainLayout>
  );
}
