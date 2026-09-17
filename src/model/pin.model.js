// import { type } from "firebase/firestore/pipelines";
// import mongoose from "mongoose";

// const AnswerSchema = new mongoose.Schema(
//   {
//     question: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     category: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     subCategory: {
//       type: String,
//       trim: true,
//     },
//   },
//   { _id: false },
// );

// const PinSchema = new mongoose.Schema(
//   {
//     // =========================================
//     // QUESTIONS / TASK DATA
//     // =========================================
//     questions: {
//       type: [AnswerSchema],
//       default: [],
//     },

//     description: {
//       type: String,
//       trim: true,
//     },

//     images: [
//       {
//         type: String, // cloudinary/s3 url
//       },
//     ],

//     // =========================================
//     // REWARDS
//     // =========================================
//     bounty: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     xpScore: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     // =========================================
//     // CREATOR
//     // =========================================
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     pinStatus: {
//       type: String,
//       enum: ["verified", "fake", "pending", "rejected"],
//       default: "pending",
//     },

//     // =========================================
//     // GEOJSON LOCATION
//     // =========================================
//     location: {
//       type: {
//         type: String,
//         enum: ["Point"],
//         default: "Point",
//       },

//       // [longitude, latitude]
//       coordinates: {
//         type: [Number],
//         required: true,

//         validate: {
//           validator: function (value) {
//             return value.length === 2;
//           },

//           message: "Coordinates must contain longitude and latitude",
//         },
//       },
//     },

//     // =========================================
//     // VALIDATION INFO
//     // =========================================
//     validatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     validationType: {
//       type: String,
//       enum: ["auto", "manual", "community"],
//       default: "community",
//     },

//     beneficiaries: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     fakereportingBy: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//     pinScore: {
//       type: Number,
//       default: 10,
//     },

//     creatorPenalized: {
//       type: Boolean,
//       default: false,
//     },

//     fakeReportersPenalized: {
//       type: Boolean,
//       default: false,
//     },

//     // =========================================
//     // TASK STATUS
//     // =========================================
//     status: {
//       type: String,
//       enum: ["red", "orange", "green"],
//       default: "red",
//     },
//     pin_solve_time: {
//       type: Number,
//       default: 0,
//     },

//     // =========================================
//     // OPTIONAL EXTRA FIELDS
//     // =========================================
//     solvedAt: {
//       type: Date,
//       default: null,
//     },

//     stoppedAt: {
//       type: Date,
//       default: null,
//     },

//     rewardDistributed: {
//       type: Boolean,
//       default: false,
//     },

//     reservationExpiresAt: {
//       type: Date,
//       default: null,
//     },

//     activePinMode: {
//       type: String,
//       enum: ["normal", "vanguard"],
//       default: "vanguard",
//     },
//     isFirstPin: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },

//     isBeacon: {
//       type: Boolean,
//       default: false,
//     },
//     islocked: {
//       type: Boolean,
//       default: false,
//     },
//     lockedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     lockExpiresAt: Date,

//     isGone: {
//       type: Boolean,
//       default: false,
//     },

//     hexagonId: {
//       type: String,
//       required: true,
//       index: true,
//     },
//     vanguardFakeReports: {
//       type: Number,
//       default: 0,
//     },

//     h3Index: {
//       type: String,
//       index: true,
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// // =========================================
// // GEO INDEX
// // =========================================
// PinSchema.index({ location: "2dsphere" });

// export default mongoose.model("Pin", PinSchema);

import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

export const RESOURCE_CATEGORY =
  "Resources (Zero-Waste, Upcycling & Utilities)";

/*
|--------------------------------------------------------------------------
| ANSWER SCHEMA
|--------------------------------------------------------------------------
*/

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
      default: "",
    },
  },
  {
    _id: false,
  },
);

/*
|--------------------------------------------------------------------------
| VALIDATION VOTE SCHEMA
|--------------------------------------------------------------------------
|
| Used for normal pins.
|
| Every user that validates a pin is stored here.
| This prevents the same user from validating/voting multiple times.
|
*/

const ValidationVoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

/*
|--------------------------------------------------------------------------
| GONE VOTE SCHEMA
|--------------------------------------------------------------------------
|
| Used for "It's Gone".
|
| After 3 unique users vote:
|
| status = green
| goneConfirmedAt = current time
| hideAfter = current time + 24 hours
|
*/

const GoneVoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

/*
|--------------------------------------------------------------------------
| PIN SCHEMA
|--------------------------------------------------------------------------
*/

const PinSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | QUESTIONS / TASK DATA
    |--------------------------------------------------------------------------
    */

    questions: {
      type: [AnswerSchema],
      default: [],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    pinDescription: {
      type: String,
      trim: true,
      default: "",
    },

    images: [
      {
        type: String,
      },
    ],

    /*
    |--------------------------------------------------------------------------
    | REWARDS
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | CREATOR
    |--------------------------------------------------------------------------
    */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | PIN VERIFICATION STATUS
    |--------------------------------------------------------------------------
    */

    pinStatus: {
      type: String,
      enum: ["verified", "fake", "pending", "rejected"],
      default: "pending",
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | GEOJSON LOCATION
    |--------------------------------------------------------------------------
    */

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      // MongoDB GeoJSON:
      // [longitude, latitude]
      coordinates: {
        type: [Number],
        required: true,

        validate: {
          validator(value) {
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              Number.isFinite(value[0]) &&
              Number.isFinite(value[1])
            );
          },

          message: "Coordinates must contain valid longitude and latitude",
        },
      },
    },

    /*
    |--------------------------------------------------------------------------
    | ORIGINAL VALIDATION INFO
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | NORMAL PIN VALIDATION VOTES
    |--------------------------------------------------------------------------
    |
    | Normal pins:
    |
    | User validates
    |       ↓
    | validationVotes[]
    |       ↓
    | validationVoteCount
    |
    | Resource pins will NOT use this.
    |
    */

    validationVotes: {
      type: [ValidationVoteSchema],
      default: [],
    },

    validationVoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | BENEFICIARIES
    |--------------------------------------------------------------------------
    */

    beneficiaries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /*
    |--------------------------------------------------------------------------
    | FAKE REPORTING
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | TASK STATUS
    |--------------------------------------------------------------------------
    |
    | red:
    |   newly created/open pin
    |
    | orange:
    |   validated / claimed / work in progress
    |
    | green:
    |   solved / gone confirmed / completed
    |
    */

    status: {
      type: String,
      enum: ["red", "orange", "green"],
      default: "red",
      index: true,
    },

    pin_solve_time: {
      type: Number,
      default: 0,
      min: 0,
    },

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

    /*
    |--------------------------------------------------------------------------
    | RESOURCE PIN — "IT'S MINE"
    |--------------------------------------------------------------------------
    |
    | Only applies when questions contains:
    |
    | category:
    | "Resources (Zero-Waste, Upcycling & Utilities)"
    |
    | Resource pins are NOT normally validated.
    |
    | User presses "It's Mine"
    |        ↓
    | claimedBy = user
    | claimedAt = now
    | status = orange
    |
    */

    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    claimedAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | GOLDEN CARGO RESERVATION
    |--------------------------------------------------------------------------
    */

    reservationExpiresAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | ACTIVE PIN MODE
    |--------------------------------------------------------------------------
    */

    activePinMode: {
      type: String,
      enum: ["normal", "vanguard"],
      default: "vanguard",
    },

    /*
    |--------------------------------------------------------------------------
    | FIRST PIN / BEACON
    |--------------------------------------------------------------------------
    */

    isFirstPin: {
      type: Boolean,
      default: false,
      index: true,
    },

    isBeacon: {
      type: Boolean,
      default: false,
    },

    /*
    |--------------------------------------------------------------------------
    | PIN LOCK
    |--------------------------------------------------------------------------
    */

    islocked: {
      type: Boolean,
      default: false,
    },

    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lockExpiresAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | "IT'S GONE" VOTING
    |--------------------------------------------------------------------------
    |
    | User 1 -> vote
    | User 2 -> vote
    | User 3 -> vote
    |
    | Once 3 unique users vote:
    |
    | status = green
    | goneConfirmedAt = now
    | hideAfter = now + 24 hours
    |
    | After hideAfter, getNearbyPins will stop returning it.
    |
    */

    goneVotes: {
      type: [GoneVoteSchema],
      default: [],
    },

    goneVoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    goneConfirmedAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | HIDE AFTER
    |--------------------------------------------------------------------------
    |
    | When 3 users vote "It's Gone":
    |
    | hideAfter = current time + 24 hours
    |
    | getNearbyPins will check this field.
    |
    */

    hideAfter: {
      type: Date,
      default: null,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | IS GONE
    |--------------------------------------------------------------------------
    |
    | Can become true once hideAfter has passed.
    |
    */

    isGone: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | VANGUARD FAKE REPORTS
    |--------------------------------------------------------------------------
    */

    vanguardFakeReports: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | HEXAGON
    |--------------------------------------------------------------------------
    */

    hexagonId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | H3 INDEX
    |--------------------------------------------------------------------------
    */

    h3Index: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| GEO INDEX
|--------------------------------------------------------------------------
*/

PinSchema.index({
  location: "2dsphere",
});

/*
|--------------------------------------------------------------------------
| HELPER METHOD — CHECK RESOURCE PIN
|--------------------------------------------------------------------------
|
| Usage:
|
| const pin = await Pin.findById(pinId);
|
| if (pin.isResourcePin()) {
|    // It's Mine flow
| }
|
*/

PinSchema.methods.isResourcePin = function () {
  return this.questions?.some(
    (answer) => answer.category === RESOURCE_CATEGORY,
  );
};

/*
|--------------------------------------------------------------------------
| HELPER METHOD — CHECK VALIDATION VOTE
|--------------------------------------------------------------------------
*/

PinSchema.methods.hasValidationVoteFrom = function (userId) {
  if (!userId) {
    return false;
  }

  return this.validationVotes.some(
    (vote) => vote.userId?.toString() === userId.toString(),
  );
};

/*
|--------------------------------------------------------------------------
| HELPER METHOD — CHECK GONE VOTE
|--------------------------------------------------------------------------
*/

PinSchema.methods.hasGoneVoteFrom = function (userId) {
  if (!userId) {
    return false;
  }

  return this.goneVotes.some(
    (vote) => vote.userId?.toString() === userId.toString(),
  );
};

/*
|--------------------------------------------------------------------------
| PRE SAVE
|--------------------------------------------------------------------------
|
| Keep vote counts synchronized with arrays.
|
*/

PinSchema.pre("save", function () {
  if (Array.isArray(this.validationVotes)) {
    this.validationVoteCount = this.validationVotes.length;
  }

  if (Array.isArray(this.goneVotes)) {
    this.goneVoteCount = this.goneVotes.length;
  }
});

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default mongoose.model("Pin", PinSchema);
