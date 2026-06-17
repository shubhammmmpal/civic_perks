import mongoose from "mongoose";

const weekSchema = new mongoose.Schema(
  {
    week: Number,
    points: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const monthSchema = new mongoose.Schema(
  {
    month: Number,
    monthlyPoints: {
      type: Number,
      default: 0,
    },
    weeks: [weekSchema],
  },
  { _id: false }
);

const yearSchema = new mongoose.Schema(
  {
    year: Number,

    yearlyPoints: {
      type: Number,
      default: 0,
    },

    months: [monthSchema],
  },
  { _id: false }
);

const userLeaderBoardLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    totalPoints: {
      type: Number,
      default: 0,
    },

    years: [yearSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "UserLeaderBoardLog",
  userLeaderBoardLogSchema
);