import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema(
  {
    hexagonId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    primaryCategory: {
      type: String,
      enum: [
        "tourism",
        "commercial",
        "nature",
        "nightlife",
        "construction",
        "institutional",
        "industrial",
        "abandoned",
        "residential",
        "mixed",
      ],
      default: "mixed",
    },

    categoryPoints: {
      tourism: { type: Number, default: 0 },
      commercial: { type: Number, default: 0 },
      nature: { type: Number, default: 0 },
      nightlife: { type: Number, default: 0 },
      construction: { type: Number, default: 0 },
      institutional: { type: Number, default: 0 },
      industrial: { type: Number, default: 0 },
      abandoned: { type: Number, default: 0 },
      residential: { type: Number, default: 0 },
    },

    totalPoints: {
      type: Number,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      default: 0,
    },

    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Zone", zoneSchema);