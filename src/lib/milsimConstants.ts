// ─── Military Branch + Unit Type taxonomy ─────────────────────────────────────
// Single source of truth used by Registry, Register, MilsimGroup public page,
// MilsimManage and the milsimGroups backend.

export const BRANCHES = [
  "Army",
  "Marines",
  "Air Force",
  "Navy",
  "Special Operations",
  "Multi-Branch",
  "PMC",
] as const;

export type Branch = typeof BRANCHES[number];

export const UNIT_TYPES_BY_BRANCH: Record<Branch, string[]> = {
  Army: [
    "Infantry",
    "Armoured / Cavalry",
    "Mechanized Infantry",
    "Motorized Infantry",
    "Airborne / Parachute",
    "Air Assault",
    "Artillery / Fire Support",
    "Armoured Reconnaissance",
    "Combat Engineers",
    "Logistics / Supply",
    "Military Intelligence",
    "Military Police",
    "Signals / Comms",
    "Medical / MEDEVAC",
    "Chemical / CBRN",
    "Mixed Arms",
    "Other",
  ],
  Marines: [
    "Infantry",
    "Amphibious Assault",
    "Reconnaissance",
    "Raider / Special Operations",
    "Aviation",
    "Artillery",
    "Combat Engineers",
    "Logistics / Support",
    "Light Armoured Vehicles",
    "Anti-Tank",
    "Combined Arms",
    "Other",
  ],
  "Air Force": [
    "Fighter / Interceptor",
    "Close Air Support",
    "Strategic Bomber",
    "Transport / Airlift",
    "Tanker / Refuelling",
    "ISR / Reconnaissance",
    "Electronic Warfare",
    "Combat Search & Rescue",
    "Pararescue (PJ)",
    "Air Assault Support",
    "UAV / Drone Operations",
    "Ground Defence",
    "Mixed Air Wing",
    "Other",
  ],
  Navy: [
    "Surface Warfare (Surface Strike)",
    "Submarine Warfare",
    "Naval Aviation (Carrier)",
    "Amphibious Operations",
    "Naval Special Warfare",
    "Mine Warfare",
    "Expeditionary Strike Group",
    "Littoral Combat",
    "Logistics / Fleet Support",
    "Naval Intelligence",
    "Mixed Naval",
    "Other",
  ],
  "Special Operations": [
    "Mountain Warfare",
    "Maritime / Amphibious Assault",
    "Air Assault Wing",
    "Desert Operations",
    "Mobility / Vehicle Assault",
    "Counter Terrorism Wing",
    "Demolitions / Breaching",
    "Direct Action",
    "Unconventional Warfare",
    "Foreign Internal Defence",
    "Psychological Operations",
    "Civil Affairs",
    "Pathfinders / Rangers",
    "Airborne / HALO / HAHO",
    "Hostage Rescue Team",
    "Combat Search & Rescue",
    "Mixed SOF",
    "Other",
  ],
  "PMC": [
    "Close Protection / PSD",
    "Security Contracting",
    "Armed Escort",
    "Site / Compound Security",
    "Advance Reconnaissance",
    "High-Value Target Recovery",
    "Hostile Environment Operations",
    "Combat Search & Rescue (Contract)",
    "Logistics Security",
    "Maritime Security",
    "Aviation Security",
    "Counter-IED / EOD Contract",
    "Training & Advisory (MPRI-type)",
    "Intelligence & Surveillance Contract",
    "Mixed Contractor Force",
    "Other",
  ],
  "Multi-Branch": [
    "Joint Task Force",
    "Combined Arms",
    "Combined Arms Task Force",
    "NATO / Coalition Force",
    "Other",
  ],
};

/** Flat list of all unit types (for legacy dropdowns) */
export const ALL_UNIT_TYPES = Array.from(
  new Set(Object.values(UNIT_TYPES_BY_BRANCH).flat())
).sort();

export const GAMES_LIST = [
  "Arma 3",
  "Arma Reforger",
  "DCS World",
  "Squad",
  "Hell Let Loose",
  "Post Scriptum",
  "Insurgency: Sandstorm",
  "GHPC",
  "Foxhole",
  "Ground Branch",
  "Ready or Not",
  "Escape from Tarkov",
  "Other",
] as const;

export const COUNTRIES_LIST = [
  "🇬🇧 United Kingdom", "🇺🇸 United States", "🇨🇦 Canada",
  "🇦🇺 Australia", "🇳🇿 New Zealand", "🇩🇪 Germany", "🇫🇷 France",
  "🇮🇹 Italy", "🇵🇱 Poland", "🇳🇱 Netherlands", "🇳🇴 Norway",
  "🇸🇪 Sweden", "🇩🇰 Denmark", "🇧🇪 Belgium", "🇪🇸 Spain",
  "🇵🇹 Portugal", "🇹🇷 Turkey", "🇯🇵 Japan", "🇰🇷 South Korea",
  "🇧🇷 Brazil", "International", "Other",
] as const;

export const LANGUAGES_LIST = [
  "English", "German", "French", "Spanish", "Italian", "Polish",
  "Dutch", "Portuguese", "Norwegian", "Swedish", "Danish", "Turkish",
  "Japanese", "Korean", "Other",
] as const;

export const BRANCH_ICONS: Record<Branch, string> = {
  Army: "🪖",
  Marines: "⚓",
  "Air Force": "✈️",
  Navy: "🚢",
  "Special Operations": "🎯",
  "Multi-Branch": "🌐",
  "PMC": "💀",
};
