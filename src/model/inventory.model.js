import mongoose from "mongoose";

const activeBoostSchema = {
  activatedAt: Date,
  expiresAt: Date,
  active: {
    type:Boolean,
    default: false
  }
};

const inventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    boosts: {
      radarFlare: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },

      megaphone: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },

      XrayFilter: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },

      goldenCargo: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },

      Double_XP: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
      CreditMagnet: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
      PioneerLuck: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
      LongRangeRadar: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
      MultiLock: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
      FastTrackJury: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
      TheBeacon: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
      HexParty: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Inventory", inventorySchema);
