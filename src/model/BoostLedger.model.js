// models/BoostLedger.js

import mongoose from "mongoose";

const boostLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    boostType: {
      type: String,
      enum: [
        "radarFlare","goldenCargo","megaphone","XrayFilter","Double_XP","CreditMagnet","PioneerLuck","LongRangeRadar","MultiLock","FastTrackJury","TheBeacon","HexParty"
      ],
      required: true,
    },

    
    quantity: {
      type: Number,
      required: true,
    },

    pricePerBoost: {
      type: Number,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    creditsBefore: Number,

    creditsAfter: Number,

    paymentMethod: {
      type: String,
      default: "Credits",
    },

    transactionType: {
      type: String,
      enum: [
        "PURCHASE",
        "REFUND",
        "ADMIN_ADDED",
        "ADMIN_REMOVED",
      ],
      default: "PURCHASE",
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    activatedAt: Date,

    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("BoostLedger", boostLedgerSchema);