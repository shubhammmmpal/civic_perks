import mongoose from "mongoose";

const zoneVoteSchema = new mongoose.Schema(
  {
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    vote: {
      type: String,
      enum: ["safe", "danger"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// One user can vote only once per zone
zoneVoteSchema.index(
  {
    zoneId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("ZoneVote", zoneVoteSchema);