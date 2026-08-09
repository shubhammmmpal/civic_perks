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
  "Obstruction": 50,
  "Litter Cluster": 35,
  "Overflow": 60,
  "Hazardous Waste": 120,
  "Vandalism / Graffiti": 40,
  "Dead Zone": 75,

  "Furniture": 55,
  "Media / Books": 35,
  "Electronics": 85,
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
};