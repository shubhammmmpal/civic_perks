import mongoose from "mongoose";
import { xpSystem } from "../helper/constants.js";
import { type } from "firebase/firestore/pipelines";
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    nickname: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },

    mobile: {
      type: Number,

    },
    street:{
      type: String,
    },
    country:{
      type: String
    },

    fullName: { type: String, trim: true, default: "unnamed" },
    latitude: { type: Number, index: true },
    longitude: { type: Number, index: true },
    //   location: { type: String, index: true },
    activeAt: { type: Date, default: Date.now },

    trustScore: { type: Number, default: 75.0, min: 0, max: 99.9 },
    level: { type: Number, default: 1, min: 1 },
    levelName: {
      type: String,
      default: "Observer",
    },
    xp: { type: Number, default: 0, min: 0 },
    credits: { type: Number, default: 10000, min: 0 },
    //   boostType: { type:String, enum: ["X-Ray Filter", "Golden Cargo", "Radar Flare", "Megaphone"] , default:'none'},

    tier: {
      type: String,
      enum: ["Free_Tier", "Civic_Plus", "Civic_Pro"],
      default: "Free_Tier",
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "none"],
      default: "none",
    },

    subscriptionStartDate: {
      type: Date,
      default: null,
    },

    subscriptionEndDate: {
      type: Date,
      default: null,
    },


    qrCode: String,

    accountType: {
      type: String,
      enum: ["public", "private", "friends"],
      default: "public",
    },

    perks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Perk",
        index: true,
      },
    ],

    image: {
      type: String,
      default: null,
    },

    otp: String,
    otpExpiry: {
      type: Date,
      index: { expires: 0 },
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    plans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaidPlan",
        index: true,
      },
    ],
    refferredBy: {
      type: String,
    },
    refferal_id: {
      type: String,
    },

    password: {
      type: String,
      // required: true
    },

    level_milestone: {
      type: Number,
      default: 100,
    },

    qrCode: {
      type: String, // QR image URL/path
      default: null,
    },

    qrToken: {
      type: String, // unique token encoded inside QR
      unique: true,
      index: true,
    },
    qrUrl: {
      type: String,
      default: null,
    },

    activeRadius: {
      type: Number,
      default: 1, // miles
    },

    activeMode: {
      type: String,
      enum: ["normal", "vanguard"],
      default: "vanguard",
    },

    // Add these fields

    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    suspendReason: {
      type: String,
      default: null,
    },

    suspendedUntil: {
      type: Date,
      default: null,
    },

    banReason: {
      type: String,
      default: null,
    },

    bannedAt: {
      type: Date,
      default: null,
    },

    blacklistedIp: {
      type: String,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);
userSchema.pre("validate", async function () {
  if (this.nickname || !this.email) return;

  const User = this.constructor;

  // Remove everything after @
  let baseNickname = this.email.split("@")[0];

  // Remove trailing numbers
  baseNickname = baseNickname.replace(/\d+$/, "");

  // If nothing remains (e.g. "123@gmail.com")
  if (!baseNickname) {
    baseNickname = "user";
  }

  let nickname = baseNickname;
  let counter = 1;

  while (await User.exists({ nickname })) {
    nickname = `${baseNickname}${counter}`;
    counter++;
  }

  this.nickname = nickname;
});

userSchema.pre("save", function () {
  if (!this.isModified("xp")) return;

  const currentXP = this.xp;

  // Find current level
  const currentLevel = xpSystem.find((level) => currentXP >= level.minXP);

  if (currentLevel) {
    this.level = currentLevel.level;
    this.level_name = currentLevel.name;
  }

  // Find next milestone
  const nextLevel = xpSystem
    .slice()
    .reverse()
    .find((level) => level.minXP > currentXP);

  this.level_milestone = nextLevel ? nextLevel.minXP : null;
});

export default mongoose.model("User", userSchema);
