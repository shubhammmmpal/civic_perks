//  export const userXP: {
//   defaultXPCounter: 0,
//   defaultLevel: 1,
//   if(defaultXPCounter <= 99) {
//     XPName: "Observer"
//   } elseif(defaultXPCounter >= 100) {
//     XPName: "Neighbor",
//     defaultLevel: 2
//   } elseif(defaultXPCounter >= 300) {
//     XPName: "Reporter",
//     defaultLevel: 3
//   } elseif(defaultXPCounter >= 600) {
//     XPName: "Spotter",
//     defaultLevel: 4
//   } elseif(defaultXPCounter >= 1000) {
//     XPName: "Contributer",
//     defaultLevel: 5
//   } elseif(defaultXPCounter >= 1500) {
//     XPName: "Steward",
//     defaultLevel: 6
//   } elseif(defaultXPCounter >= 2500) {
//     XPName: "Street Steward",
//     defaultLevel: 7
//   } elseif(defaultXPXCounter >= 4000) {
//     XPName: "Civic Guide",
//     defaultLevel: 8
//   } elseif(defaultXPCounter >= 6000) {
//     XPName: "Advocate",
//     defaultLevel: 9
//   } elseif(defaultXPCounter >= 85000) {
//     XPName: "Urban Scout",
//     defaultLevel: 10
//   } elseif(dedfaultXPCounter >= 12000) {
//     XPName: "District Ally",
//     defaultLevel: 11
//   } elseif(defaultXPCounter >= 16000) {
//     XPName: "Trailblazer",
//     defaultLevel: 12,
//   } elseif(defaultXPCounter >= 22000) {
//     XPName: "Guardian",
//     defaultLevel: 13
//   } elseif(defaultXPCounter >= 30000) {
//     XPName: "City Pillar",
//     defaultLevel: 14
//   } elseif(defaultXPCounteer >= 40000) {
//     XPName: "Ambassador",
//     defaultLevel: 15
//   } elseif(defaultXPCounter >= 55000) {
//     XPName: "Architect of Change",
//     defaultLevel: 16
//   } elseif(defaultXPCounter >= 75000) {
//     XPName: "Visionary",
//     defaultLevel: 17
//   } elseif(defaultXPCounter >= 100000) {
//     XPName: "Paragon of Virtue",
//     defaultLevel: 18
//   } elseif(defaultXPCounter >= 150000) {
//     XPName: "Grand Chancellor",
//     defaultLevel: 19
//   } elseif(defaultXPCounter >= 250000) {
//     XPName: "City Soul",
//     defaultLevel: 20
//   }
// }

export const xpSystem = [
  {
    minXP: 250000,
    level: 20,
    name: "City Soul",
    emoji: "🔆",
  },
  {
    minXP: 150000,
    level: 19,
    name: "Grand Chancellor",
    emoji: "👑",
  },
  {
    minXP: 100000,
    level: 18,
    name: "Paragon of Virtue",
    emoji: "💠",
  },
  {
    minXP: 75000,
    level: 17,
    name: "Visionary",
    emoji: "🌟",
  },
  {
    minXP: 55000,
    level: 16,
    name: "Architect of Change",
    emoji: "📐",
  },
  {
    minXP: 40000,
    level: 15,
    name: "Ambassador",
    emoji: "⚖️",
  },
  {
    minXP: 30000,
    level: 14,
    name: "City Pillar",
    emoji: "🏛️",
  },
  {
    minXP: 22000,
    level: 13,
    name: "Guardian",
    emoji: "🛡️",
  },
  {
    minXP: 16000,
    level: 12,
    name: "Trailblazer",
    emoji: "🔥",
  },
  {
    minXP: 12000,
    level: 11,
    name: "District Ally",
    emoji: "🔗",
  },
  {
    minXP: 8500,
    level: 10,
    name: "Urban Scout",
    emoji: "🧭",
  },
  {
    minXP: 6000,
    level: 9,
    name: "Advocate",
    emoji: "📢",
  },
  {
    minXP: 4000,
    level: 8,
    name: "Civic Guide",
    emoji: "🗺️",
  },
  {
    minXP: 2500,
    level: 7,
    name: "Street Warden",
    emoji: "🔦",
  },
  {
    minXP: 1500,
    level: 6,
    name: "Steward",
    emoji: "📋",
  },
  {
    minXP: 1000,
    level: 5,
    name: "Contributor",
    emoji: "🤝",
  },
  {
    minXP: 600,
    level: 4,
    name: "Spotter",
    emoji: "🔍",
  },
  {
    minXP: 300,
    level: 3,
    name: "Reporter",
    emoji: "📝",
  },
  {
    minXP: 100,
    level: 2,
    name: "Neighbor",
    emoji: "👋",
  },
  {
    minXP: 0,
    level: 1,
    name: "Observer",
    emoji: "🌱",
  },
];

export const getLevelData = (xp) => {
  return xpSystem.find((item) => xp >= item.minXP);
};

// config/xpConfig.js

export const XP_CONFIG = {
  "Hostile Ground": 80,
  "Abandoned Property": 70,
  "Pothole / Road Damage": 55,
  "Dark Zone / Broken Light": 65,
  "Broken Fixture": 45,
  Obstruction: 50,
  "Litter Cluster": 35,
  Overflow: 60,
  "Hazardous Waste": 120,
  "Vandalism / Graffiti": 40,
  "Dead Zone": 75,

  Furniture: 55,
  "Media / Books": 35,
  Electronics: 85,
  "Cardboard Goldmine": 30,
  "Neighborhood Event Leftovers": 45,
  "Digital Lifeline": 90,

  "Language Anchor": 65,
  "Study Haven": 70,
  "Acoustic Stage": 50,
  "Free Wall": 40,
  "Safe Keeper": 95,
  "Free Play": 45,
  "Lost Pet / Animal Rescue": 110,
  "Mutual Aid / Help Needed": 120,

  "Community Pantry / Free Fridge": 100,
  "Escape Line": 130,
  "Public Grill": 55,
  "Safe Park": 75,

  "Free Air": 30,
  "Safe Rack": 45,

  "Deposit Drop": 40,
  "Sponsored Merchant Bounty": 150,
  "Player-Funded Staked Bounty": 180,

  "Clean Wash": 90,

  "Guerrilla Garden": 85,
  "Organic Compost": 60,
  "Toxic Drop": 140,
  "Paw-Safe Path": 55,
  "Animal Feeding Station": 70,
  "Pet Hydration": 45,
  "Stray Sanctuary": 125,
  "Public Ashtray": 35,
  "Clean Lung Route": 95,

  "Heritage at Risk": 100,
  "Megaphone Zone": 80,
  "Mail Drop": 40,
};

export const BOOSTS = {
  radarFlare: {
    price: 150,
    durationHours: 24,
  },

  goldenCargo: {
    price: 80,
    durationHours: 2,
  },

  megaphone: {
    price: 500,
    durationHours: 3,
  },

  XrayFilter: {
    price: 40,
    durationHours: 1,
  },
  Double_XP: {
    price: 150,
    durationHours: 2,
  },
  CreditMagnet: {
    price: 120,
    durationHours: 1,
  },
  PioneerLuck: {
    price: 80,
    durationHours: 4,
  },
  LongRangeRadar: {
    price: 200,
    durationHours: 0.5,
  },
  MultiLock: {
    price: 150,
    durationHours: 2,
  },
  FastTrackJury: {
    price: 50,
    pinCount: 1,
    // durationHours: 1,
  },
  TheBeacon: {
    price: 300,
    pinCount: 1,
    // durationHours: 1,
  },
  HexParty: {
    price: 500,
    durationHours: 1,
  },
};

export const VALIDATION_CONFIG = {
  MAX_DISTANCE_METERS: 50,

  VERIFIED_SCORE: 100,

  FAKE_SCORE: -100,

  VALIDATION_XP: 5,

  VALIDATION_CREDITS: 2,

  CREATOR_VERIFIED_XP: 15,

  CREATOR_TRUST_REWARD: 0.5,

  FAKE_CREATOR_TRUST_PENALTY: 15,

  SHADOWBAN_TRUST_THRESHOLD: 40,
};

export const CARTOGRAPHER_RANKS = [
  { count: 550, name: "The Illuminator", emoji: "☀️", level: 2 },
  { count: 525, name: "Oracle", emoji: "🔮", level: 2 },
  { count: 500, name: "Overseer", emoji: "🦅", level: 2 },
  { count: 450, name: "Pathfinder", emoji: "🔥", level: 2 },
  { count: 400, name: "Vanguard", emoji: "🚩", level: 2 },
  { count: 350, name: "Sentinel", emoji: "🛡️", level: 2 },
  { count: 300, name: "Surveyor", emoji: "🗺️", level: 2 },
  { count: 250, name: "Scout", emoji: "🧭", level: 2 },
  { count: 200, name: "Spotter", emoji: "🎯", level: 2 },
  { count: 150, name: "Observer", emoji: "🔭", level: 2 },

  { count: 100, name: "The Apex", emoji: "💠", level: 1 },
  { count: 90, name: "Visionary", emoji: "👁️", level: 1 },
  { count: 80, name: "Amplifier", emoji: "📢", level: 1 },
  { count: 70, name: "Beacon", emoji: "🚨", level: 1 },
  { count: 60, name: "Auditor", emoji: "📋", level: 1 },
  { count: 50, name: "Radar", emoji: "📡", level: 1 },
  { count: 40, name: "Tracker", emoji: "📍", level: 1 },
  { count: 30, name: "Scanner", emoji: "🔦", level: 1 },
  { count: 20, name: "Lens", emoji: "🔍", level: 1 },
  { count: 10, name: "Spark", emoji: "⚡", level: 1 },
];

export const ACTION_HERO_RANKS = [
  { count: 650, name: "The Silencer", emoji: "🔇", level: 2 },
  { count: 550, name: "Heavyweight", emoji: "🏗️", level: 2 },
  { count: 460, name: "Ironclad", emoji: "🛡️", level: 2 },
  { count: 380, name: "Enforcer", emoji: "🚧", level: 2 },
  { count: 310, name: "Optimizer", emoji: "💠", level: 2 },
  { count: 250, name: "Specialist", emoji: "🥽", level: 2 },
  { count: 200, name: "Fixer", emoji: "🦾", level: 2 },
  { count: 160, name: "Stabilizer", emoji: "⚓", level: 2 },
  { count: 130, name: "Wrench", emoji: "🔧", level: 2 },
  { count: 110, name: "Responder", emoji: "🚨", level: 2 },

  { count: 100, name: "The Warden", emoji: "🗝️", level: 1 },
  { count: 90, name: "Restorer", emoji: "🛠️", level: 1 },
  { count: 80, name: "Architect", emoji: "📐", level: 1 },
  { count: 70, name: "Constructor", emoji: "🧱", level: 1 },
  { count: 60, name: "Closer", emoji: "🔒", level: 1 },
  { count: 50, name: "Catalyst", emoji: "⚡", level: 1 },
  { count: 40, name: "Operator", emoji: "🎛️", level: 1 },
  { count: 30, name: "Technician", emoji: "⚙️", level: 1 },
  { count: 20, name: "Mender", emoji: "🪛", level: 1 },
  { count: 10, name: "Helper", emoji: "🩹", level: 1 },
];

export const getSkillRank = (count, ranks) => {
  return (
    ranks.find((rank) => count >= rank.count) || {
      count: 0,
      name: "Unranked",
      emoji: "",
      level: 1,
    }
  );
};

export const getActionHeroRank = (solvedPins = 0) => {
  const count = Number(solvedPins || 0);

  const current =
    ACTION_HERO_RANKS.find((rank) => count >= rank.count) || {
      count: 0,
      name: "Unranked",
      emoji: "",
      level: 1,
    };

  // Array descending hai, so next milestone find karna
  const ascending = [...ACTION_HERO_RANKS].reverse();

  const next = ascending.find((rank) => rank.count > count) || null;

  return {
    ...current,

    solvedPins: count,

    nextRank: next
      ? {
          name: next.name,
          emoji: next.emoji,
          requiredFixes: next.count,
          remainingFixes: next.count - count,
        }
      : null,

    maxRankReached: !next,
  };
};