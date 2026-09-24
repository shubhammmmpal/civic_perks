// import mongoose from "mongoose";

// const ValidationSchema = new mongoose.Schema(
//   {
//     // =========================================
//     // PIN REFERENCE
//     // =========================================
//     pinID: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Pin",
//       required: true,
//       index: true,
//     },

//     // =========================================
//     // MAIN VALIDATOR
//     // =========================================
//     validatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     // =========================================
//     // BENEFICIARIES
//     // =========================================
//     beneficiaries: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     // =========================================
//     // VALIDATION STATUS
//     // =========================================
//     status: {
//       type: String,
//       enum: ["red", "orange", "green"],
//       default: "orange",
//     },

//     // =========================================
//     // VALIDATION WINDOW
//     // =========================================
//     expiresAt: {
//       type: Date,
//     },

//     // =========================================
//     // TASK EVENTS
//     // =========================================
//     solvedAt: {
//       type: Date,
//       default: null,
//     },

//     stoppedAt: {
//       type: Date,
//       default: null,
//     },

//     // =========================================
//     // REWARD DISTRIBUTION
//     // =========================================
//     rewardDistributed: {
//       type: Boolean,
//       default: false,
//     },

//     validatorReward: {
//       bounty: {
//         type: Number,
//         default: 0,
//       },

//       xp: {
//         type: Number,
//         default: 0,
//       },
//     },
//     beforeImage: {
//       type: String,
//       default: null,
//     },

//     timeTaken: {
//       type: String, // minutes or seconds
//       default: null,
//     },

//     beneficiaryReward: {
//       bounty: {
//         type: Number,
//         default: 0,
//       },

//       xp: {
//         type: Number,
//         default: 0,
//       },
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// // =========================================
// // AUTO SET 24H EXPIRY
// // =========================================
// // ValidationSchema.pre("save", function (next) {
// //   if (!this.expiresAt) {
// //     this.expiresAt = new Date(
// //       Date.now() + 24 * 60 * 60 * 1000,
// //     );
// //   }

// //   next();
// // });

// ValidationSchema.pre("save", function () {
//   if (!this.expiresAt) {
//     this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
//   }
// });

// export default mongoose.model("Validation", ValidationSchema);


import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| VALIDATION VOTE
|--------------------------------------------------------------------------
|
| Stores a snapshot of the user's reputation at the exact time they voted.
| Do NOT calculate historical vote weight from the user's current trust/level.
|
*/

const ValidationVoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /*
    |--------------------------------------------------------------------------
    | VOTE TYPE
    |--------------------------------------------------------------------------
    */

    vote: {
      type: String,
      enum: ["VALID", "FAKE"],
      required: true,
    },

    /*
    |--------------------------------------------------------------------------
    | WEIGHT USED FOR THIS VOTE
    |--------------------------------------------------------------------------
    */

    weight: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | USER REPUTATION SNAPSHOT
    |--------------------------------------------------------------------------
    */

    trustScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    level: {
      type: Number,
      required: true,
      min: 1,
    },

    levelName: {
      type: String,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | PROXIMITY PROOF
    |--------------------------------------------------------------------------
    */

    location: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },
    },

    distanceMeters: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | REWARD
    |--------------------------------------------------------------------------
    */

    xpEarned: {
      type: Number,
      default: 0,
    },

    creditsEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

const ValidationSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | PIN
    |--------------------------------------------------------------------------
    */

    pinID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | ORIGINAL / MAIN VALIDATOR
    |--------------------------------------------------------------------------
    |
    | Keep this because your current APIs already depend on it.
    |
    */

    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | OLD BENEFICIARY SYSTEM
    |--------------------------------------------------------------------------
    |
    | Keep temporarily for backward compatibility.
    |
    */

    beneficiaries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /*
    |--------------------------------------------------------------------------
    | WEIGHTED VOTES
    |--------------------------------------------------------------------------
    |
    | This becomes the source of truth for Issue Validation.
    |
    */

    votes: {
      type: [ValidationVoteSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | CONSENSUS SCORE
    |--------------------------------------------------------------------------
    |
    | VALID vote = positive weight
    | FAKE vote  = negative weight
    |
    */

    confidenceScore: {
      type: Number,
      default: 0,
    },

    validWeight: {
      type: Number,
      default: 0,
    },

    fakeWeight: {
      type: Number,
      default: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | VOTE COUNTS
    |--------------------------------------------------------------------------
    */

    validVotes: {
      type: Number,
      default: 0,
    },

    fakeVotes: {
      type: Number,
      default: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | CONSENSUS STATUS
    |--------------------------------------------------------------------------
    */

    consensusStatus: {
      type: String,

      enum: [
        "PENDING",
        "VERIFIED",
        "FAKE",
        "EXPIRED",
      ],

      default: "PENDING",
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | EXISTING MAP STATUS
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,
      enum: ["red", "orange", "green"],
      default: "orange",
    },

    /*
    |--------------------------------------------------------------------------
    | CONSENSUS COMPLETED
    |--------------------------------------------------------------------------
    */

    consensusReachedAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | VALIDATION WINDOW
    |--------------------------------------------------------------------------
    */

    expiresAt: {
      type: Date,
    },

    /*
    |--------------------------------------------------------------------------
    | TASK EVENTS
    |--------------------------------------------------------------------------
    */

    solvedAt: {
      type: Date,
      default: null,
    },

    stoppedAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | REWARD DISTRIBUTION
    |--------------------------------------------------------------------------
    */

    rewardDistributed: {
      type: Boolean,
      default: false,
    },

    validatorReward: {
      bounty: {
        type: Number,
        default: 0,
      },

      xp: {
        type: Number,
        default: 0,
      },
    },

    beneficiaryReward: {
      bounty: {
        type: Number,
        default: 0,
      },

      xp: {
        type: Number,
        default: 0,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | SOLUTION INFORMATION
    |--------------------------------------------------------------------------
    */

    beforeImage: {
      type: String,
      default: null,
    },

    timeTaken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| AUTO SET 24 HOUR EXPIRY
|--------------------------------------------------------------------------
*/

ValidationSchema.pre("save", function () {
  if (!this.expiresAt) {
    this.expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );
  }
});

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

ValidationSchema.index({
  pinID: 1,
  consensusStatus: 1,
});

ValidationSchema.index({
  "votes.userId": 1,
});

export default mongoose.model(
  "Validation",
  ValidationSchema,
);