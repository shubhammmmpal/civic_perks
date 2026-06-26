import mongoose from "mongoose";

const magicRouteFeedbackSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MagicRoute",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    awardedXp: {
      type: Number,
      default: 100,
    },

    awardedBooster: {
      type: String,
      enum: [
        "radarFlare",
        "goldenCargo",
        "megaphone",
        "XrayFilter",
      ],
    },
  },
  {
    timestamps: true,
  }
);

magicRouteFeedbackSchema.index(
  { routeId: 1, userId: 1 },
  { unique: true }
);

export default mongoose.model(
  "MagicRouteFeedback",
  magicRouteFeedbackSchema
);