import mongoose from "mongoose";

const hexPartySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    hexagon_id: String,
    activatedAt: Date,
    expiryAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("HexParty", hexPartySchema);
