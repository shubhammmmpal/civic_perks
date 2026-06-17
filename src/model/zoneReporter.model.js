import mongoose from "mongoose";

const zoneReporterSchema = new mongoose.Schema(
  {
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
      index: true,
    },

    hexagonId: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    category: {
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
      ],
      required: true,
    },

    voteWeight: {
      type: Number,
      required: true,
    },

    userLevel: {
      type: Number,
      required: true,
    },

    gpsLocation: {
      latitude: {
        type: String,
        // required: true,
      },
      longitude: {
        type: String,
        // required: true,
      },
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);


export default mongoose.model("ZoneReporter", zoneReporterSchema);

