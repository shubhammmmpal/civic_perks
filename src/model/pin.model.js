import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    subCategory: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const PinSchema = new mongoose.Schema(
  {
    // =========================================
    // QUESTIONS / TASK DATA
    // =========================================
    questions: {
      type: [AnswerSchema],
      default: [],
    },

    description: {
      type: String,
      trim: true,
    },

    images: [
      {
        type: String, // cloudinary/s3 url
      },
    ],

    // =========================================
    // REWARDS
    // =========================================
    bounty: {
      type: Number,
      default: 0,
      min: 0,
    },

    xpScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================================
    // CREATOR
    // =========================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    pinStatus: {
      type: String,
      enum: ["verified", "fake", "pending","rejected"],
      default: "pending",
    },

    // =========================================
    // GEOJSON LOCATION
    // =========================================
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      // [longitude, latitude]
      coordinates: {
        type: [Number],
        required: true,

        validate: {
          validator: function (value) {
            return value.length === 2;
          },

          message: "Coordinates must contain longitude and latitude",
        },
      },
    },

    // =========================================
    // VALIDATION INFO
    // =========================================
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    validationType: {
      type: String,
      enum: ["auto", "manual", "community"],
      default: "community",
    },

    beneficiaries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    fakereportingBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pinScore: {
      type: Number,
      default: 10,
    },

    creatorPenalized: {
      type: Boolean,
      default: false,
    },

    fakeReportersPenalized: {
    type: Boolean,
    default: false,
    },

    // =========================================
    // TASK STATUS
    // =========================================
    status: {
      type: String,
      enum: ["red", "orange", "green"],
      default: "red",
    },

    // =========================================
    // OPTIONAL EXTRA FIELDS
    // =========================================
    solvedAt: {
      type: Date,
      default: null,
    },

    stoppedAt: {
      type: Date,
      default: null,
    },

    rewardDistributed: {
      type: Boolean,
      default: false,
    },

    reservationExpiresAt: {
      type: Date,
      default: null,
    },
    

    h3Index: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// =========================================
// GEO INDEX
// =========================================
PinSchema.index({ location: "2dsphere" });

export default mongoose.model("Pin", PinSchema);
