import mongoose from "mongoose";

const multiLockSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  activeAt: {
    type: Date,
    default: null,
  },

  expireAt: {
    type: Date,
    default: null,
  },

  activePinCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3,
  },

  activePins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
    },
  ],
});

export default mongoose.model("MultiLock", multiLockSchema);