import mongoose from "mongoose";

const routePointSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MagicRouteVibeList",
      required: true,
    },

    categoryName: {
      type: String,
      required: true,
    },

    subCategory: {
      type: String,
      required: true,
    },

    icon: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    sequence: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const assignedFriendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { _id: false },
);

const magicRouteSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    routeName: {
      type: String,
      required: true,
    },

    routes: {
      type: [routePointSchema],
      validate: {
        validator: function (value) {
          return value.length >= 1 && value.length <= 5;
        },
        message: "Route must contain between 1 and 5 points",
      },
    },

    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "completed", "cancelled"],
      default: "draft",
    },

    scheduledDate: Date,

    assignedFriends: [assignedFriendSchema],

    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dislikedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    rewardStatus: {
      creatorRewardGiven: {
        type: Boolean,
        default: false,
      },

      rewardedAt: Date,
    },

    reward: {
      creator: {
        xpMultiplier: {
          type: Number,
          default: 2,
        },

        trustScore: {
          type: Number,
          default: 0.5,
        },
      },

      joinee: {
        baseXp: {
          type: Number,
          default: 100,
        },

        xpMultiplier: {
          type: Number,
          default: 2,
        },

        booster: {
          type: String,
          enum: ["radarFlare", "goldenCargo", "megaphone", "XrayFilter"],
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("MagicRoute", magicRouteSchema);
