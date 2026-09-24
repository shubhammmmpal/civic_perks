// validation.controller.js

import Validation from "../model/validation.model.js";
import Pin from "../model/pin.model.js";
import User from "../model/user.model.js"; // assuming you have user model
import mongoose from "mongoose";
import {
  calculateDistanceInMeters,
  getActiveBoosts,
  isHexPartyActive,
  calculateXPWithBoosts,
  createNotification,
  updateLeaderboardXP,
  checkLevelUp,
  sendNotification,
  calculateCreditBountyWithBoost,
  getLevelUpNotification,
} from "../helper/helper.js";
import {
  ACTION_HERO_RANKS,
  CARTOGRAPHER_RANKS,
  getActionHeroRank,
  getLevelData,
  VALIDATION_CONFIG,
} from "../helper/constants.js";
import States from "../model/states.model.js";
import Activity from "../model/activity.model.js";
import Fine from "../model/fine.model.js";
import Megaphone from "../model/megaphone.model.js";
import GoldenCargo from "../model/goldenCargo.model.js";
import Notification from "../model/notification.model.js";
import Inventory from "../model/inventory.model.js";
import MultiLock from "../model/multiLock.model.js";
import { getValidationWeight } from "../helper/validationWeight.js";

// export const validatePin = async (req, res) => {

//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const { pinId } = req.params;

//     const userId = req.user.id;

//     const { currentLatitude, currentLongitude } = req.body;

//     /*
//     |--------------------------------------------------------------------------
//     | BASIC VALIDATION
//     |--------------------------------------------------------------------------
//     */

//     if (currentLatitude === undefined || currentLongitude === undefined) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "Current location is required",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | FIND USER
//     |--------------------------------------------------------------------------
//     */

//     const user = await User.findById(userId).session(session);

//     if (!user) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | FIND PIN
//     |--------------------------------------------------------------------------
//     */

//     const pin = await Pin.findById(pinId).session(session);

//     if (!pin) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "Pin not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CHECK IF PIN IS ALREADY GONE
//     |--------------------------------------------------------------------------
//     */

//     if (pin.isGone) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "This pin is no longer available",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CHECK LOCK
//     |--------------------------------------------------------------------------
//     */

//     if (
//       pin.islocked === true &&
//       pin.lockedBy &&
//       pin.lockedBy.toString() !== userId.toString()
//     ) {
//       await session.abortTransaction();

//       return res.status(403).json({
//         success: false,
//         message: "This pin is locked",
//         lockedBy: pin.lockedBy,
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CREATOR CANNOT VALIDATE / CLAIM
//     |--------------------------------------------------------------------------
//     */

//     if (pin.createdBy.toString() === userId.toString()) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "You cannot validate or claim your own pin",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | PIN LOCATION
//     |--------------------------------------------------------------------------
//     */

//     const pinLongitude = pin.location.coordinates[0];

//     const pinLatitude = pin.location.coordinates[1];

//     /*
//     |--------------------------------------------------------------------------
//     | CALCULATE LIVE DISTANCE
//     |--------------------------------------------------------------------------
//     */

//     const liveDistance = calculateDistanceInMeters(
//       Number(currentLatitude),
//       Number(currentLongitude),
//       pinLatitude,
//       pinLongitude,
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | MUST BE WITHIN 10 METERS
//     |--------------------------------------------------------------------------
//     */

//     if (liveDistance > 10) {
//       await session.abortTransaction();

//       return res.status(403).json({
//         success: false,

//         message: "You must be within 10 meters of the pin location",

//         distance: `${liveDistance.toFixed(2)} meters`,
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CHECK RESOURCE CATEGORY
//     |--------------------------------------------------------------------------
//     |
//     | Category is stored inside:
//     |
//     | pin.questions[].category
//     |
//     */

//     const isResourcePin = pin.questions?.some(
//       (item) =>
//         item.category === "Resources (Zero-Waste, Upcycling & Utilities)",
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | RESOURCE PIN → "IT'S MINE"
//     |--------------------------------------------------------------------------
//     |
//     | Resource pins DO NOT use normal validation.
//     |
//     | Instead:
//     |
//     | User presses validate / It's Mine
//     |
//     | claimedBy = user
//     | claimedAt = now
//     | status = orange
//     |
//     */

//     if (isResourcePin) {
//       /*
//       |--------------------------------------------------------------------------
//       | ALREADY CLAIMED
//       |--------------------------------------------------------------------------
//       */

//       if (pin.claimedBy) {
//         /*
//         | If same user already claimed
//         */

//         if (pin.claimedBy.toString() === userId.toString()) {
//           await session.abortTransaction();

//           return res.status(400).json({
//             success: false,

//             message: "You already claimed this resource",

//             data: {
//               pinId: pin._id,
//               claimedBy: pin.claimedBy,
//               claimedAt: pin.claimedAt,
//               status: pin.status,
//             },
//           });
//         }

//         /*
//         | Claimed by another user
//         */

//         await session.abortTransaction();

//         return res.status(409).json({
//           success: false,

//           message: "This resource has already been claimed by another user",

//           data: {
//             pinId: pin._id,
//             claimedAt: pin.claimedAt,
//           },
//         });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | CLAIM RESOURCE
//       |--------------------------------------------------------------------------
//       */

//       pin.claimedBy = userId;

//       pin.claimedAt = new Date();

//       pin.status = "orange";

//       /*
//       | Keep validatedBy for compatibility
//       | with existing code.
//       |
//       | But resource ownership should always
//       | be checked using claimedBy.
//       */

//       pin.validatedBy = userId;

//       await pin.save({
//         session,
//       });

//       /*
//       |--------------------------------------------------------------------------
//       | CREATE ACTIVITY
//       |--------------------------------------------------------------------------
//       */

//       await Activity.create(
//         [
//           {
//             userId,

//             activityType: "pin_claimed",

//             pinId: pin._id,

//             pinTitle: pin.description || "Resource Claimed",

//             images: pin.images || [],

//             xpEarned: 0,

//             creditsSpent: 0,

//             distance: liveDistance,

//             activityLocation: {
//               latitude: pinLatitude,
//               longitude: pinLongitude,
//             },

//             startLocation: {
//               latitude: Number(currentLatitude),

//               longitude: Number(currentLongitude),
//             },

//             endLocation: {
//               latitude: pinLatitude,
//               longitude: pinLongitude,
//             },

//             status: "completed",
//           },
//         ],
//         {
//           session,
//         },
//       );

//       /*
//       |--------------------------------------------------------------------------
//       | CREATOR NOTIFICATION
//       |--------------------------------------------------------------------------
//       */

//       const pinCreator = await User.findById(pin.createdBy)
//         .select("fcmToken name")
//         .session(session);

//       const creatorNotification = {
//         tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],

//         title: "📦 Resource Claimed",

//         body: `${user.name} claimed your resource.`,

//         data: {
//           type: "RESOURCE_CLAIMED",

//           pinId: pin._id.toString(),

//           claimedBy: user._id.toString(),
//         },
//       };

//       /*
//       |--------------------------------------------------------------------------
//       | COMMIT
//       |--------------------------------------------------------------------------
//       */

//       await session.commitTransaction();

//       /*
//       |--------------------------------------------------------------------------
//       | SEND NOTIFICATION AFTER COMMIT
//       |--------------------------------------------------------------------------
//       */

//       if (creatorNotification.tokens.length) {
//         await sendNotification(creatorNotification);
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | RESPONSE
//       |--------------------------------------------------------------------------
//       */

//       return res.status(200).json({
//         success: true,

//         type: "ITS_MINE",

//         message: "Resource claimed successfully",

//         data: {
//           pinId: pin._id,

//           category: "Resources (Zero-Waste, Upcycling & Utilities)",

//           claimedBy: userId,

//           claimedAt: pin.claimedAt,

//           status: pin.status,

//           distance: `${liveDistance.toFixed(2)} meters`,
//         },
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     |--------------------------------------------------------------------------
//     | NORMAL PIN VALIDATION STARTS HERE
//     |--------------------------------------------------------------------------
//     |--------------------------------------------------------------------------
//     */

//     /*
//     |--------------------------------------------------------------------------
//     | PREVENT DUPLICATE VALIDATION VOTE
//     |--------------------------------------------------------------------------
//     */

//     const alreadyVoted = pin.validationVotes?.some(
//       (vote) => vote.userId.toString() === userId.toString(),
//     );

//     if (alreadyVoted) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "You already validated this pin",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | FIND PENDING ACTIVITY
//     |--------------------------------------------------------------------------
//     */

//     const activity = await Activity.findOne({
//       userId,
//       pinId: pin._id,
//       status: "pending",
//     })
//       .sort({
//         createdAt: -1,
//       })
//       .session(session);

//     if (!activity) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "No pending activity found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | ACTIVE BOOSTS
//     |--------------------------------------------------------------------------
//     */

//     const activeBoosts = await getActiveBoosts(userId);

//     const hexPartyActive = await isHexPartyActive(pin.hexagonId);

//     /*
//     |--------------------------------------------------------------------------
//     | COMPLETE PENDING ACTIVITY
//     |--------------------------------------------------------------------------
//     */

//     activity.status = "completed";

//     await activity.save({
//       session,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | TRAVEL XP
//     |--------------------------------------------------------------------------
//     */

//     const travelDistance = Number(activity.distance) || 0;

//     const baseTravelXP = Math.max(1, Math.floor(travelDistance / 100));

//     const travelXP = calculateXPWithBoosts({
//       baseXP: baseTravelXP,

//       doubleXP: activeBoosts.Double_XP,

//       hexParty: hexPartyActive,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | ADD VALIDATION VOTE
//     |--------------------------------------------------------------------------
//     */

//     pin.validationVotes.push({
//       userId,
//       votedAt: new Date(),
//     });

//     /*
//     | pre-save middleware will also
//     | synchronize this count.
//     */

//     pin.validationVoteCount = pin.validationVotes.length;

//     /*
//     |--------------------------------------------------------------------------
//     | FIRST VALIDATOR
//     |--------------------------------------------------------------------------
//     */

//     const isFirstValidator = pin.validationVoteCount === 1;

//     if (isFirstValidator) {
//       pin.validatedBy = userId;

//       pin.status = "orange";
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | INCREASE PIN SCORE
//     |--------------------------------------------------------------------------
//     */

//     pin.pinScore += 10;

//     /*
//     |--------------------------------------------------------------------------
//     | CREATE / UPDATE VALIDATION DOCUMENT
//     |--------------------------------------------------------------------------
//     |
//     | Keeping your existing Validation collection
//     | because solve/reward/fake-report logic may
//     | depend on it elsewhere.
//     |
//     */

//     let validation = await Validation.findOne({
//       pinID: pin._id,
//     }).session(session);

//     if (!validation) {
//       validation = new Validation({
//         pinID: pin._id,

//         validatedBy: userId,

//         status: "orange",

//         beneficiaries: [],
//       });
//     } else {
//       /*
//       | First validator is stored in validatedBy.
//       |
//       | Every later validator becomes beneficiary.
//       */

//       const isAlreadyBeneficiary = validation.beneficiaries?.some(
//         (id) => id.toString() === userId.toString(),
//       );

//       if (
//         !isAlreadyBeneficiary &&
//         validation.validatedBy?.toString() !== userId.toString()
//       ) {
//         validation.beneficiaries.push(userId);
//       }
//     }

//     await validation.save({
//       session,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | KEEP PIN BENEFICIARIES
//     |--------------------------------------------------------------------------
//     */

//     if (!isFirstValidator) {
//       const alreadyBeneficiary = pin.beneficiaries?.some(
//         (id) => id.toString() === userId.toString(),
//       );

//       if (!alreadyBeneficiary) {
//         pin.beneficiaries.push(userId);
//       }
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | AUTO VERIFY
//     |--------------------------------------------------------------------------
//     */

//     let pinVerifiedNotification = null;

//     if (
//       pin.pinScore >= 100 &&
//       (!pin.pinStatus || pin.pinStatus === "pending")
//     ) {
//       pin.pinStatus = "verified";

//       pin.status = "green";

//       /*
//       |--------------------------------------------------------------------------
//       | REWARD PIN CREATOR
//       |--------------------------------------------------------------------------
//       */

//       const pinCreator = await User.findById(pin.createdBy).session(session);

//       if (pinCreator) {
//         pinCreator.xp += 15;

//         pinCreator.trustScore = Math.min(
//           99.9,

//           Number((pinCreator.trustScore + 0.5).toFixed(1)),
//         );

//         /*
//         |--------------------------------------------------------------------------
//         | LEVEL
//         |--------------------------------------------------------------------------
//         */

//         const creatorLevelData = getLevelData(pinCreator.xp);

//         pinCreator.level = creatorLevelData.level;

//         pinCreator.levelName = creatorLevelData.name;

//         await pinCreator.save({
//           session,
//         });

//         await updateLeaderboardXP(pinCreator._id, 15, session);

//         pinVerifiedNotification = {
//           tokens: pinCreator.fcmToken ? [pinCreator.fcmToken] : [],

//           title: "🎉 Pin Verified",

//           body: "Congratulations! Your pin has been verified. You earned 15 XP.",

//           data: {
//             type: "PIN_VERIFIED",

//             pinId: pin._id.toString(),

//             xp: 15,
//           },
//         };
//       }
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | PENALIZE FALSE FAKE REPORTERS
//     |--------------------------------------------------------------------------
//     */

//     if (
//       pin.fakereportingBy?.length > 0 &&
//       !pin.fakeReportersPenalized &&
//       pin.pinStatus === "verified"
//     ) {
//       const fakeReporters = await User.find({
//         _id: {
//           $in: pin.fakereportingBy,
//         },
//       }).session(session);

//       for (const reporter of fakeReporters) {
//         reporter.trustScore = Math.max(
//           0,

//           Number((reporter.trustScore - 15).toFixed(1)),
//         );

//         /*
//         | Keep your actual ban threshold here.
//         */

//         if (reporter.trustScore < 40) {
//           reporter.status = "banned";
//         }

//         await reporter.save({
//           session,
//         });

//         await Fine.create(
//           [
//             {
//               userId: reporter._id,

//               amount: 15,

//               reason: `False fake report on verified pin ${pin._id}`,
//             },
//           ],

//           {
//             session,
//           },
//         );
//       }

//       pin.fakeReportersPenalized = true;
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | SAVE PIN
//     |--------------------------------------------------------------------------
//     */

//     await pin.save({
//       session,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | VALIDATOR REWARD
//     |--------------------------------------------------------------------------
//     |
//     | First validator:
//     | 5 credits
//     |
//     | Other validators:
//     | 2 credits
//     |
//     */

//     const creditsEarned = isFirstValidator ? 5 : 2;

//     /*
//     |--------------------------------------------------------------------------
//     | CHECK LEVEL UP
//     |--------------------------------------------------------------------------
//     */

//     const updatedLevelXP = user.xp + travelXP;

//     await checkLevelUp(user, updatedLevelXP, session);

//     /*
//     |--------------------------------------------------------------------------
//     | GIVE USER REWARD
//     |--------------------------------------------------------------------------
//     */

//     user.xp += travelXP;

//     user.credits += creditsEarned;

//     user.trustScore = Math.min(
//       99.9,

//       Number((user.trustScore + 0.1).toFixed(1)),
//     );

//     await updateLeaderboardXP(user._id, travelXP, session);

//     await user.save({
//       session,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | UPDATE USER STATS
//     |--------------------------------------------------------------------------
//     */

//     await States.findOneAndUpdate(
//       {
//         userId,
//       },

//       {
//         $inc: {
//           pinsValidated: 1,
//         },
//       },

//       {
//         upsert: true,
//         new: true,
//         session,
//       },
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | CREATE VALIDATION ACTIVITY
//     |--------------------------------------------------------------------------
//     */

//     await Activity.create(
//       [
//         {
//           userId,

//           activityType: "pin_validated",

//           pinId: pin._id,

//           pinTitle: pin.description || "Pin Validation",

//           images: pin.images || [],

//           xpEarned: travelXP,

//           /*
//           | Your schema currently appears
//           | to use creditsSpent even though
//           | these are rewards.
//           |
//           | Keeping it for compatibility.
//           */

//           creditsSpent: creditsEarned,

//           distance: travelDistance,

//           activityLocation: {
//             latitude: pinLatitude,

//             longitude: pinLongitude,
//           },

//           startLocation: {
//             latitude: Number(currentLatitude),

//             longitude: Number(currentLongitude),
//           },

//           endLocation: {
//             latitude: pinLatitude,

//             longitude: pinLongitude,
//           },

//           status: "completed",
//         },
//       ],

//       {
//         session,
//       },
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | NOTIFICATIONS
//     |--------------------------------------------------------------------------
//     */

//     const pinCreator = await User.findById(pin.createdBy)
//       .select("fcmToken name")
//       .session(session);

//     const validatorNotification = {
//       tokens: user.fcmToken ? [user.fcmToken] : [],

//       title: "✅ Pin Validated",

//       body: `You earned ${travelXP} XP and ${creditsEarned} Credits.`,

//       data: {
//         type: "PIN_VALIDATED",

//         pinId: pin._id.toString(),

//         xp: travelXP,

//         credits: creditsEarned,
//       },
//     };

//     const creatorNotification = {
//       tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],

//       title: "📍 Pin Validation",

//       body: `${user.name} validated your pin.`,

//       data: {
//         type: "PIN_VALIDATED_BY_USER",

//         pinId: pin._id.toString(),

//         validatorId: user._id.toString(),
//       },
//     };

//     /*
//     |--------------------------------------------------------------------------
//     | COMMIT TRANSACTION
//     |--------------------------------------------------------------------------
//     */

//     await session.commitTransaction();

//     /*
//     |--------------------------------------------------------------------------
//     | SEND NOTIFICATIONS
//     |--------------------------------------------------------------------------
//     |
//     | Do after transaction commit.
//     |
//     */

//     const notifications = [];

//     if (validatorNotification.tokens.length) {
//       notifications.push(sendNotification(validatorNotification));
//     }

//     if (creatorNotification.tokens.length) {
//       notifications.push(sendNotification(creatorNotification));
//     }

//     if (pinVerifiedNotification?.tokens?.length) {
//       notifications.push(sendNotification(pinVerifiedNotification));
//     }

//     await Promise.all(notifications);

//     /*
//     |--------------------------------------------------------------------------
//     | RESPONSE
//     |--------------------------------------------------------------------------
//     */

//     return res.status(200).json({
//       success: true,

//       type: "VALIDATION",

//       message: "Pin validated successfully",

//       rewards: {
//         travelXP,

//         creditsEarned,

//         trustScoreEarned: 0.1,
//       },

//       validation: {
//         isFirstValidator,

//         validationVoteCount: pin.validationVoteCount,

//         validatedBy: pin.validatedBy,
//       },

//       pinData: {
//         pinId: pin._id,

//         pinScore: pin.pinScore,

//         pinStatus: pin.pinStatus,

//         status: pin.status,
//       },

//       distanceInfo: {
//         liveDistanceMeters: Number(liveDistance.toFixed(2)),

//         travelDistanceMeters: Number(travelDistance.toFixed(2)),
//       },

//       activeBoosts,

//       hexPartyActive,
//     });
//   } catch (error) {
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }

//     console.error("Validate pin error:", error);

//     return res.status(500).json({
//       success: false,

//       message: error.message || "Failed to validate pin",
//     });
//   } finally {
//     await session.endSession();
//   }
// };

// ------

export const solvePin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { pinId } = req.params;

    const action = req.body.action;
    const timeTaken = req.body.timeTaken;

    const beforeImage = req.file?.path || null;

    const userId = req.user.id;

    // =====================================================
    // FIND PIN
    // =====================================================

    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // =====================================================
    // GOLDEN CARGO RESERVATION CHECK
    // =====================================================

    if (pin.reservationExpiresAt && pin.reservationExpiresAt > new Date()) {
      const activeCargo = await GoldenCargo.findOne({
        pinId: pin._id,
        expiresAt: {
          $gt: new Date(),
        },
      }).session(session);

      if (activeCargo && activeCargo.userId.toString() !== userId.toString()) {
        await session.abortTransaction();

        return res.status(403).json({
          success: false,
          message: "This pin is currently reserved.",
          reservationExpiresAt: pin.reservationExpiresAt,
        });
      }
    }

    // =====================================================
    // FIND VALIDATION
    // =====================================================

    const validation = await Validation.findOne({
      pinID: pinId,
    }).session(session);
    // =====================================================
    // NORMAL MODE:
    // ONCE VERIFIED, FAKE REPORTING IS PERMANENTLY LOCKED
    // =====================================================

    if (
      pin.activePinMode !== "vanguard" &&
      (validation?.consensusStatus === "VERIFIED" ||
        pin.pinStatus === "verified")
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "This pin has already been verified and can no longer be reported as fake.",
      });
    }

    if (!validation) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Validation not found",
      });
    }

    // =====================================================
    // ONLY PRIMARY VALIDATOR CAN SOLVE
    // =====================================================

    if (
      !validation.validatedBy ||
      validation.validatedBy.toString() !== userId.toString()
    ) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message: "Only validator can complete this task",
      });
    }

    // =====================================================
    // STOP TASK
    // =====================================================

    if (action === "stop") {
      pin.status = "orange";

      validation.status = "orange";

      pin.stoppedAt = new Date();

      validation.stoppedAt = new Date();

      await pin.save({
        session,
      });

      await validation.save({
        session,
      });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Task stopped successfully",
      });
    }

    // =====================================================
    // INVALID ACTION
    // =====================================================

    if (action !== "solve") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid action. Use stop or solve",
      });
    }

    // =====================================================
    // ALREADY SOLVED
    // =====================================================

    if (pin.status === "green") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Task already solved",
      });
    }

    // =====================================================
    // ACTIVE BOOSTS
    // =====================================================

    const activeBoosts = await getActiveBoosts(userId);

    const hexPartyActive = await isHexPartyActive(pin.hexagonId);

    const fastTrackJuryApplied = !!activeBoosts.FastTrackJury;

    console.log("Active boosts:", activeBoosts);
    console.log("Hex Party active:", hexPartyActive);

    // =====================================================
    // SAVE OPTIONAL DATA
    // =====================================================

    if (beforeImage) {
      validation.beforeImage = beforeImage;
    }

    if (timeTaken) {
      validation.timeTaken = timeTaken;
    }

    // =====================================================
    // FAST TRACK JURY
    // =====================================================

    if (beforeImage && activeBoosts.FastTrackJury) {
      pin.pinStatus = "verified";

      const inventory = await Inventory.findOne({
        userId,
      }).session(session);

      if (!inventory) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message: "Inventory not found",
        });
      }

      /*
       * Keeping your existing FastTrackJury structure.
       */

      if (inventory.boosts?.FastTrackJury?.active) {
        inventory.boosts.FastTrackJury.active.active = false;
      }

      validation.rewardDistributed = true;

      await inventory.save({
        session,
      });
    } else {
      // Normal jury flow
      validation.status = "pending";
    }

    // =====================================================
    // UPDATE SOLVED STATUS
    // =====================================================

    pin.status = "green";

    validation.status = "green";

    pin.solvedAt = new Date();

    pin.pin_solve_time = Number(timeTaken) || 0;

    validation.solvedAt = new Date();

    // =====================================================
    // BASE REWARDS
    // =====================================================

    const baseValidatorBounty = Number(pin.bounty) || 0;

    const baseValidatorXP = Number(pin.xpScore) || 0;

    let validatorBounty = baseValidatorBounty;

    let validatorXP = baseValidatorXP;

    // =====================================================
    // BEACON
    // 3X XP
    // =====================================================

    const beaconApplied = !!pin.isBeacon;

    if (beaconApplied) {
      validatorXP *= 3;
    }

    // =====================================================
    // CREDIT MAGNET
    // +25% CREDIT BOUNTY
    // =====================================================

    const creditMagnetApplied = !!activeBoosts.CreditMagnet;

    validatorBounty = calculateCreditBountyWithBoost({
      bounty: validatorBounty,

      creditMagnet: creditMagnetApplied,
    });

    // =====================================================
    // PIONEER LUCK
    // FIRST PIN IN HEXAGON = 3X
    // =====================================================

    let pioneerLuckApplied = false;

    if (pin.isFirstPin && activeBoosts.PioneerLuck) {
      validatorXP *= 3;

      validatorBounty *= 3;

      pioneerLuckApplied = true;
    }

    // =====================================================
    // DOUBLE XP + HEX PARTY
    // =====================================================

    const doubleXPApplied = !!activeBoosts.Double_XP;

    validatorXP = calculateXPWithBoosts({
      baseXP: validatorXP,

      doubleXP: doubleXPApplied,

      hexParty: hexPartyActive,
    });

    // =====================================================
    // MEGAPHONE BONUS
    // =====================================================

    const activeMegaphone = await Megaphone.findOne({
      pinId: pin._id,

      expiresAt: {
        $gt: new Date(),
      },
    }).session(session);

    let megaphoneBonusApplied = false;

    if (activeMegaphone) {
      validatorBounty *= 2;

      validatorXP *= 2;

      megaphoneBonusApplied = true;
    }

    // =====================================================
    // FIND SOLVER
    // =====================================================

    const user = await User.findById(validation.validatedBy).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Validator user not found",
      });
    }

    // =====================================================
    // STORE OLD LEVEL
    // =====================================================

    const oldLevel = Number(user.level || 1);

    // =====================================================
    // CALCULATE NEW XP
    // =====================================================

    const updatedXP = Number(user.xp || 0) + Number(validatorXP || 0);

    // =====================================================
    // CHECK LEVEL UP
    // =====================================================

    await checkLevelUp(user, updatedXP, session);

    // =====================================================
    // ADD REWARDS
    // =====================================================

    user.xp = updatedXP;

    user.credits = Number(user.credits || 0) + Number(validatorBounty || 0);

    // =====================================================
    // LEADERBOARD
    // =====================================================

    await updateLeaderboardXP(user._id, validatorXP, session);

    // =====================================================
    // GET FINAL LEVEL
    // =====================================================

    const levelData = getLevelData(user.xp);

    user.level = levelData.level;

    user.levelName = levelData.name;

    // =====================================================
    // LEVEL-UP NOTIFICATION
    // =====================================================

    let levelUpNotification = null;

    if (Number(levelData.level) > oldLevel) {
      const levelMessage = getLevelUpNotification({
        level: levelData.level,

        levelName: levelData.name,

        emoji: levelData.emoji || "",
      });

      levelUpNotification = {
        tokens: user.fcmToken ? [user.fcmToken] : [],

        title: levelMessage.title,

        body: levelMessage.body,

        data: {
          type: "LEVEL_UP",

          level: String(levelData.level),

          levelName: String(levelData.name || ""),

          emoji: String(levelData.emoji || ""),
        },
      };
    }

    // =====================================================
    // SAVE SOLVER
    // =====================================================

    await user.save({
      session,
    });

    // =====================================================
    // SAVE LEVEL-UP NOTIFICATION IN DB
    // =====================================================

    if (levelUpNotification) {
      await Notification.create(
        [
          {
            title: levelUpNotification.title,

            description: levelUpNotification.body,

            notificationType: "private",

            receivers: [user._id],

            senderRole: "system",

            isRead: false,
          },
        ],
        {
          session,
        },
      );
    }

    // =====================================================
    // REFERRAL BONUS
    // =====================================================

    const validator = await User.findById(userId)
      .select("createdAt refferredBy")
      .session(session);

    if (validator) {
      const isEligible =
        Date.now() - validator.createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000;

      if (isEligible && validator.refferredBy) {
        const referrer = await User.findOne({
          refferal_id: validator.refferredBy,
        }).session(session);

        if (referrer) {
          const referralCredits = Math.floor(validatorBounty * 0.1);

          const referralXP = Math.floor(validatorXP * 0.1);

          const referrerUser = await User.findById(referrer._id).session(
            session,
          );

          if (referrerUser) {
            const updatedReferrerXP = Number(referrerUser.xp || 0) + referralXP;

            await checkLevelUp(referrerUser, updatedReferrerXP, session);

            referrerUser.xp = updatedReferrerXP;

            referrerUser.credits =
              Number(referrerUser.credits || 0) + referralCredits;

            // =============================================
            // UPDATE REFERRER LEVEL
            // =============================================

            const referrerLevelData = getLevelData(referrerUser.xp);

            referrerUser.level = referrerLevelData.level;

            referrerUser.levelName = referrerLevelData.name;

            await updateLeaderboardXP(referrerUser._id, referralXP, session);

            await referrerUser.save({
              session,
            });

            await States.findOneAndUpdate(
              {
                userId: referrer._id,
              },

              {
                $inc: {
                  earnedByFriends: referralCredits,
                },
              },

              {
                upsert: true,

                new: true,

                session,
              },
            );
          }
        }
      }
    }

    // =====================================================
    // UPDATE SOLVER STATS
    // =====================================================

    // await States.findOneAndUpdate(
    //   {
    //     userId: validation.validatedBy,
    //   },

    //   {
    //     $inc: {
    //       pinsSolved: 1,

    //       hoursServed: Number(timeTaken) || 0,
    //     },
    //   },

    //   {
    //     upsert: true,

    //     new: true,

    //     session,
    //   },
    // );

    // =====================================================
    // UPDATE SOLVER STATS + ACTION HERO SKILL TREE
    // =====================================================

    const previousStats = await States.findOne({
      userId: validation.validatedBy,
    }).session(session);

    const previousPinsSolved = Number(previousStats?.pinsSolved || 0);

    const previousActionHeroRank = getActionHeroRank(previousPinsSolved);

    // Increment solve stats
    const userStats = await States.findOneAndUpdate(
      {
        userId: validation.validatedBy,
      },

      {
        $inc: {
          pinsSolved: 1,
          hoursServed: Number(timeTaken) || 0,
        },
      },

      {
        upsert: true,
        new: true,
        session,
        setDefaultsOnInsert: true,
      },
    );

    const totalPinsSolved = Number(userStats.pinsSolved || 0);

    const actionHeroRank = getActionHeroRank(totalPinsSolved);

    // Check whether a new rank was unlocked
    const actionHeroRankUnlocked =
      previousActionHeroRank.name !== actionHeroRank.name;

    let actionHeroNotification = null;

    if (actionHeroRankUnlocked) {
      actionHeroNotification = {
        tokens: user.fcmToken ? [user.fcmToken] : [],

        title: `${actionHeroRank.emoji} Action Hero Rank Unlocked!`,

        body:
          `Congratulations! You reached ${actionHeroRank.name} ` +
          `after solving ${totalPinsSolved} pins.`,

        data: {
          type: "ACTION_HERO_RANK_UNLOCKED",

          rank: actionHeroRank.name,

          emoji: actionHeroRank.emoji,

          skillLevel: String(actionHeroRank.level),

          pinsSolved: String(totalPinsSolved),
        },
      };

      await Notification.create(
        [
          {
            title: actionHeroNotification.title,

            description: actionHeroNotification.body,

            notificationType: "private",

            receivers: [user._id],

            senderRole: "system",

            isRead: false,
          },
        ],
        {
          session,
        },
      );
    }

    // =====================================================
    // SAVE REWARD INFO
    // =====================================================

    validation.rewardDistributed = true;

    validation.validatorReward = {
      bounty: validatorBounty,

      xp: validatorXP,

      baseBounty: baseValidatorBounty,

      baseXP: baseValidatorXP,

      beaconApplied,

      creditMagnetApplied,

      pioneerLuckApplied,

      doubleXPApplied,

      hexPartyActive,

      megaphoneBonusApplied,

      isFirstPin: !!pin.isFirstPin,
    };

    // =====================================================
    // SAVE DOCUMENTS
    // =====================================================

    await pin.save({
      session,
    });

    await validation.save({
      session,
    });

    // =====================================================
    // CREATE ACTIVITY LOG
    // =====================================================

    await Activity.create(
      [
        {
          userId: validation.validatedBy,

          activityType: "pin_solved",

          pinId: pin._id,

          pinTitle: pin.description || "Pin Solved",

          images: beforeImage ? [beforeImage] : pin.images || [],

          xpEarned: validatorXP,

          /*
           * Keeping your current field.
           * Semantically this is earned bounty,
           * not credits spent.
           */
          creditsSpent: validatorBounty,

          activityLocation: {
            latitude: pin.location.coordinates[1],

            longitude: pin.location.coordinates[0],
          },

          status: "completed",
        },
      ],
      {
        session,
      },
    );

    // =====================================================
    // PIN CREATOR
    // =====================================================

    const pinCreator = await User.findById(pin.createdBy)
      .select("fcmToken name")
      .session(session);

    // =====================================================
    // CREATOR NOTIFICATION
    // =====================================================

    const creatorNotification = {
      tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],

      title: "✅ Your Pin Has Been Solved!",

      body: "Someone has successfully solved your reported pin.",

      data: {
        type: "PIN_SOLVED",

        pinId: pin._id.toString(),

        solvedBy: user._id.toString(),
      },
    };

    // =====================================================
    // SOLVER REWARD NOTIFICATION
    // =====================================================

    const solverNotification = {
      tokens: user.fcmToken ? [user.fcmToken] : [],

      title: "🎉 Rewards Earned!",

      body:
        `You earned ${validatorXP} XP and ` +
        `${validatorBounty} Credits for solving a pin.`,

      data: {
        type: "PIN_SOLVED_REWARD",

        pinId: pin._id.toString(),

        xp: String(validatorXP),

        credits: String(validatorBounty),
      },
    };

    // =====================================================
    // SAVE SOLVER NOTIFICATION IN DATABASE
    // =====================================================

    await Notification.create(
      [
        {
          title: solverNotification.title,

          description: solverNotification.body,

          notificationType: "private",

          receivers: [user._id],

          senderRole: "system",

          isRead: false,
        },
      ],
      {
        session,
      },
    );

    // =====================================================
    // SAVE CREATOR NOTIFICATION
    // =====================================================

    if (pinCreator) {
      await Notification.create(
        [
          {
            title: creatorNotification.title,

            description: creatorNotification.body,

            notificationType: "private",

            receivers: [pinCreator._id],

            senderRole: "system",

            isRead: false,
          },
        ],
        {
          session,
        },
      );
    }

    // =====================================================
    // COMMIT TRANSACTION
    // =====================================================

    await session.commitTransaction();

    // =====================================================
    // SEND PUSH NOTIFICATIONS
    // =====================================================

    const notifications = [];

    // -----------------------------------------
    // Solver reward notification
    // -----------------------------------------

    if (solverNotification?.tokens?.length) {
      notifications.push(sendNotification(solverNotification));
    }

    // -----------------------------------------
    // Creator notification
    // -----------------------------------------

    if (creatorNotification?.tokens?.length) {
      notifications.push(sendNotification(creatorNotification));
    }

    // -----------------------------------------
    // LEVEL-UP NOTIFICATION
    // -----------------------------------------

    if (levelUpNotification?.tokens?.length) {
      notifications.push(sendNotification(levelUpNotification));
    }

    if (actionHeroNotification?.tokens?.length) {
      notifications.push(sendNotification(actionHeroNotification));
    }

    /*
     * Transaction already committed.
     * Push notification failure should not
     * make solvePin fail.
     */

    await Promise.allSettled(notifications);

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message: "Task solved successfully and rewards distributed",

      gainedReward: {
        xp: validatorXP,

        credits: validatorBounty,

        baseXP: baseValidatorXP,

        baseCredits: baseValidatorBounty,

        isFirstPin: !!pin.isFirstPin,

        boosts: {
          beacon: beaconApplied,

          doubleXP: doubleXPApplied,

          creditMagnet: creditMagnetApplied,

          pioneerLuck: pioneerLuckApplied,

          hexParty: hexPartyActive,

          megaphone: megaphoneBonusApplied,

          fastTrackJury: fastTrackJuryApplied,
        },
      },

      // ===================================================
      // LEVEL UP INFORMATION
      // ===================================================

      levelUp:
        Number(user.level) > oldLevel
          ? {
              previousLevel: oldLevel,

              newLevel: user.level,

              levelName: user.levelName,

              emoji: levelData.emoji || "",

              title: levelUpNotification?.title,

              message: levelUpNotification?.body,
            }
          : null,

      // ===================================================
      // CURRENT USER
      // ===================================================

      currentUser: {
        id: user._id,

        name: user.name,

        email: user.email,

        profileImage: user.profileImage,

        currentXP: user.xp,

        currentCredits: user.credits,

        level: user.level,

        levelName: user.levelName,
      },

      // ===================================================
      // PIN INFO
      // ===================================================

      pinInfo: {
        id: pin._id,

        status: pin.status,

        pinStatus: pin.pinStatus,

        solvedAt: pin.solvedAt,

        bounty: pin.bounty,

        xpScore: pin.xpScore,

        description: pin.description,

        location: pin.location,

        images: pin.images,
      },

      // ===================================================
      // VALIDATION INFO
      // ===================================================

      validationInfo: {
        beforeImage: validation.beforeImage,

        timeTaken: validation.timeTaken,

        solvedAt: validation.solvedAt,

        rewardDistributed: validation.rewardDistributed,

        validatorReward: validation.validatorReward,
      },

      activeBoosts,

      hexPartyActive,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("solvePin error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to solve pin",
    });
  } finally {
    await session.endSession();
  }
};

// export const solvePin = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const { pinId } = req.params;
//     const userId = req.user.id;

//     const { action, timeTaken } = req.body;

//     // multer uploaded image
//     const beforeImage = req.file?.path || null;

//     /*
//     |--------------------------------------------------------------------------
//     | FIND PIN
//     |--------------------------------------------------------------------------
//     */

//     const pin = await Pin.findById(pinId).session(session);

//     if (!pin) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "Pin not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CHECK IF RESOURCE PIN
//     |--------------------------------------------------------------------------
//     |
//     | Solve API is ONLY applicable to:
//     |
//     | Resources (Zero-Waste, Upcycling & Utilities)
//     |
//     */

//     const RESOURCE_CATEGORY =
//       "Resources (Zero-Waste, Upcycling & Utilities)";

//     const isResourcePin = pin.questions?.some(
//       (item) => item.category === RESOURCE_CATEGORY,
//     );

//     if (!isResourcePin) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message:
//           "Solve action is only available for Resource pins",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CHECK GONE
//     |--------------------------------------------------------------------------
//     */

//     if (pin.isGone) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "This pin is no longer available",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CHECK ALREADY SOLVED
//     |--------------------------------------------------------------------------
//     */

//     if (pin.solvedAt || pin.status === "green") {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "This resource pin has already been solved",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | RESOURCE MUST FIRST BE CLAIMED USING "IT'S MINE"
//     |--------------------------------------------------------------------------
//     */

//     if (!pin.claimedBy) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message:
//           "You must select It's Mine before solving this resource pin",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | ONLY CLAIM OWNER CAN SOLVE
//     |--------------------------------------------------------------------------
//     */

//     if (pin.claimedBy.toString() !== userId.toString()) {
//       await session.abortTransaction();

//       return res.status(403).json({
//         success: false,
//         message:
//           "Only the user who claimed this resource can solve it",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | FIND SOLVER
//     |--------------------------------------------------------------------------
//     */

//     const user = await User.findById(userId).session(session);

//     if (!user) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | GOLDEN CARGO RESERVATION CHECK
//     |--------------------------------------------------------------------------
//     */

//     if (
//       pin.reservationExpiresAt &&
//       pin.reservationExpiresAt > new Date()
//     ) {
//       const activeCargo = await GoldenCargo.findOne({
//         pinId: pin._id,
//         expiresAt: {
//           $gt: new Date(),
//         },
//       }).session(session);

//       if (
//         activeCargo &&
//         activeCargo.userId.toString() !== userId.toString()
//       ) {
//         await session.abortTransaction();

//         return res.status(403).json({
//           success: false,
//           message:
//             "This resource pin is currently reserved by another user",
//           reservationExpiresAt: pin.reservationExpiresAt,
//         });
//       }
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | VALID ACTION
//     |--------------------------------------------------------------------------
//     */

//     if (!["stop", "solve"].includes(action)) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "Invalid action. Use stop or solve",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | STOP RESOURCE TASK
//     |--------------------------------------------------------------------------
//     */

//     if (action === "stop") {
//       pin.status = "orange";
//       pin.stoppedAt = new Date();

//       await pin.save({
//         session,
//       });

//       /*
//       |--------------------------------------------------------------------------
//       | ACTIVITY
//       |--------------------------------------------------------------------------
//       */

//       await Activity.create(
//         [
//           {
//             userId,

//             activityType: "pin_stopped",

//             pinId: pin._id,

//             pinTitle:
//               pin.description || "Resource Task Stopped",

//             images: pin.images || [],

//             xpEarned: 0,

//             creditsSpent: 0,

//             activityLocation: {
//               latitude: pin.location.coordinates[1],
//               longitude: pin.location.coordinates[0],
//             },

//             status: "completed",
//           },
//         ],
//         {
//           session,
//         },
//       );

//       await session.commitTransaction();

//       return res.status(200).json({
//         success: true,
//         message: "Resource task stopped successfully",

//         data: {
//           pinId: pin._id,
//           status: pin.status,
//           stoppedAt: pin.stoppedAt,
//           claimedBy: pin.claimedBy,
//         },
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     |--------------------------------------------------------------------------
//     | SOLVE RESOURCE PIN
//     |--------------------------------------------------------------------------
//     |--------------------------------------------------------------------------
//     */

//     /*
//     |--------------------------------------------------------------------------
//     | ACTIVE BOOSTS
//     |--------------------------------------------------------------------------
//     */

//     const activeBoosts = await getActiveBoosts(userId);

//     const hexPartyActive = await isHexPartyActive(
//       pin.hexagonId,
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | BASE REWARD
//     |--------------------------------------------------------------------------
//     */

//     const baseSolverBounty = Number(pin.bounty) || 0;
//     const baseSolverXP = Number(pin.xpScore) || 0;

//     let solverBounty = baseSolverBounty;
//     let solverXP = baseSolverXP;

//     /*
//     |--------------------------------------------------------------------------
//     | BEACON
//     |--------------------------------------------------------------------------
//     |
//     | Existing behavior:
//     | Beacon = 3X XP
//     |
//     */

//     const beaconApplied = !!pin.isBeacon;

//     if (beaconApplied) {
//       solverXP *= 3;
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CREDIT MAGNET
//     |--------------------------------------------------------------------------
//     */

//     const creditMagnetApplied = !!activeBoosts.CreditMagnet;

//     solverBounty = calculateCreditBountyWithBoost({
//       bounty: solverBounty,
//       creditMagnet: creditMagnetApplied,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | PIONEER LUCK
//     |--------------------------------------------------------------------------
//     |
//     | First pin in hexagon + PioneerLuck:
//     |
//     | XP     × 3
//     | bounty × 3
//     |
//     */

//     let pioneerLuckApplied = false;

//     if (pin.isFirstPin && activeBoosts.PioneerLuck) {
//       solverXP *= 3;
//       solverBounty *= 3;

//       pioneerLuckApplied = true;
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | DOUBLE XP + HEX PARTY
//     |--------------------------------------------------------------------------
//     */

//     const doubleXPApplied = !!activeBoosts.Double_XP;

//     solverXP = calculateXPWithBoosts({
//       baseXP: solverXP,
//       doubleXP: doubleXPApplied,
//       hexParty: hexPartyActive,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | MEGAPHONE
//     |--------------------------------------------------------------------------
//     */

//     const activeMegaphone = await Megaphone.findOne({
//       pinId: pin._id,

//       expiresAt: {
//         $gt: new Date(),
//       },
//     }).session(session);

//     let megaphoneBonusApplied = false;

//     if (activeMegaphone) {
//       solverBounty *= 2;
//       solverXP *= 2;

//       megaphoneBonusApplied = true;
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | FAST TRACK JURY
//     |--------------------------------------------------------------------------
//     */

//     const fastTrackJuryApplied = !!activeBoosts.FastTrackJury;

//     if (beforeImage && fastTrackJuryApplied) {
//       pin.pinStatus = "verified";

//       /*
//       | Consume FastTrackJury boost
//       */

//       const inventory = await Inventory.findOne({
//         userId,
//       }).session(session);

//       if (inventory?.boosts?.FastTrackJury?.active) {
//         inventory.boosts.FastTrackJury.active.active = false;

//         await inventory.save({
//           session,
//         });
//       }
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | UPDATE PIN
//     |--------------------------------------------------------------------------
//     */

//     pin.status = "green";

//     pin.solvedAt = new Date();

//     pin.stoppedAt = null;

//     pin.pin_solve_time = Number(timeTaken) || 0;

//     /*
//     |--------------------------------------------------------------------------
//     | REWARD DISTRIBUTION FLAG
//     |--------------------------------------------------------------------------
//     */

//     if (pin.rewardDistributed) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message:
//           "Rewards have already been distributed for this pin",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | CHECK LEVEL BEFORE ADDING XP
//     |--------------------------------------------------------------------------
//     */

//     const updatedXP = user.xp + solverXP;

//     await checkLevelUp(
//       user,
//       updatedXP,
//       session,
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | GIVE SOLVER REWARD
//     |--------------------------------------------------------------------------
//     */

//     user.xp += solverXP;

//     user.credits += solverBounty;

//     await updateLeaderboardXP(
//       user._id,
//       solverXP,
//       session,
//     );

//     await user.save({
//       session,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | MARK REWARD DISTRIBUTED
//     |--------------------------------------------------------------------------
//     */

//     pin.rewardDistributed = true;

//     /*
//     |--------------------------------------------------------------------------
//     | SAVE PIN
//     |--------------------------------------------------------------------------
//     */

//     await pin.save({
//       session,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | REFERRAL BONUS
//     |--------------------------------------------------------------------------
//     |
//     | User must be within first 30 days.
//     |
//     | Referrer gets:
//     |
//     | 10% solver credits
//     | 10% solver XP
//     |
//     */

//     const validator = await User.findById(userId)
//       .select("createdAt refferredBy")
//       .session(session);

//     let referralReward = null;

//     if (validator) {
//       const accountAge =
//         Date.now() - validator.createdAt.getTime();

//       const thirtyDays =
//         30 * 24 * 60 * 60 * 1000;

//       const isReferralEligible =
//         accountAge <= thirtyDays;

//       if (
//         isReferralEligible &&
//         validator.refferredBy
//       ) {
//         const referrer = await User.findOne({
//           refferal_id: validator.refferredBy,
//         }).session(session);

//         if (referrer) {
//           const referralCredits = Math.floor(
//             solverBounty * 0.1,
//           );

//           const referralXP = Math.floor(
//             solverXP * 0.1,
//           );

//           const referrerUpdatedXP =
//             referrer.xp + referralXP;

//           await checkLevelUp(
//             referrer,
//             referrerUpdatedXP,
//             session,
//           );

//           referrer.xp += referralXP;

//           referrer.credits += referralCredits;

//           await updateLeaderboardXP(
//             referrer._id,
//             referralXP,
//             session,
//           );

//           await referrer.save({
//             session,
//           });

//           /*
//           |--------------------------------------------------------------------------
//           | REFERRER STATS
//           |--------------------------------------------------------------------------
//           */

//           await States.findOneAndUpdate(
//             {
//               userId: referrer._id,
//             },

//             {
//               $inc: {
//                 earnedByFriends: referralCredits,
//               },
//             },

//             {
//               upsert: true,
//               new: true,
//               session,
//             },
//           );

//           referralReward = {
//             referrerId: referrer._id,
//             xp: referralXP,
//             credits: referralCredits,
//           };
//         }
//       }
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | UPDATE SOLVER STATS
//     |--------------------------------------------------------------------------
//     */

//     await States.findOneAndUpdate(
//       {
//         userId,
//       },

//       {
//         $inc: {
//           pinsSolved: 1,

//           hoursServed: Number(timeTaken) || 0,
//         },
//       },

//       {
//         upsert: true,
//         new: true,
//         session,
//       },
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | CREATE ACTIVITY
//     |--------------------------------------------------------------------------
//     */

//     await Activity.create(
//       [
//         {
//           userId,

//           activityType: "pin_solved",

//           pinId: pin._id,

//           pinTitle:
//             pin.description || "Resource Pin Solved",

//           images: beforeImage
//             ? [beforeImage]
//             : pin.images || [],

//           xpEarned: solverXP,

//           /*
//           | Existing Activity model appears to call
//           | this creditsSpent even though this is
//           | actually earned bounty.
//           */

//           creditsSpent: solverBounty,

//           activityLocation: {
//             latitude: pin.location.coordinates[1],

//             longitude: pin.location.coordinates[0],
//           },

//           status: "completed",
//         },
//       ],

//       {
//         session,
//       },
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | PIN CREATOR
//     |--------------------------------------------------------------------------
//     */

//     const pinCreator = await User.findById(
//       pin.createdBy,
//     )
//       .select("fcmToken name")
//       .session(session);

//     /*
//     |--------------------------------------------------------------------------
//     | NOTIFICATIONS
//     |--------------------------------------------------------------------------
//     */

//     const creatorNotification = {
//       tokens: pinCreator?.fcmToken
//         ? [pinCreator.fcmToken]
//         : [],

//       title: "✅ Your Resource Has Been Collected!",

//       body:
//         "Someone successfully collected your resource.",

//       data: {
//         type: "RESOURCE_SOLVED",

//         pinId: pin._id.toString(),

//         solvedBy: user._id.toString(),
//       },
//     };

//     const solverNotification = {
//       tokens: user.fcmToken
//         ? [user.fcmToken]
//         : [],

//       title: "🎉 Rewards Earned!",

//       body:
//         `You earned ${solverXP} XP and ${solverBounty} Credits.`,

//       data: {
//         type: "RESOURCE_SOLVED_REWARD",

//         pinId: pin._id.toString(),

//         xp: solverXP,

//         credits: solverBounty,
//       },
//     };

//     /*
//     |--------------------------------------------------------------------------
//     | COMMIT
//     |--------------------------------------------------------------------------
//     */

//     await session.commitTransaction();

//     /*
//     |--------------------------------------------------------------------------
//     | SEND NOTIFICATIONS AFTER COMMIT
//     |--------------------------------------------------------------------------
//     */

//     const notifications = [];

//     if (creatorNotification.tokens.length) {
//       notifications.push(
//         sendNotification(
//           creatorNotification,
//         ),
//       );
//     }

//     if (solverNotification.tokens.length) {
//       notifications.push(
//         sendNotification(
//           solverNotification,
//         ),
//       );
//     }

//     await Promise.all(notifications);

//     /*
//     |--------------------------------------------------------------------------
//     | RESPONSE
//     |--------------------------------------------------------------------------
//     */

//     return res.status(200).json({
//       success: true,

//       message:
//         "Resource pin solved successfully and rewards distributed",

//       gainedReward: {
//         xp: solverXP,

//         credits: solverBounty,

//         baseXP: baseSolverXP,

//         baseCredits: baseSolverBounty,

//         boosts: {
//           beacon: beaconApplied,

//           doubleXP: doubleXPApplied,

//           creditMagnet: creditMagnetApplied,

//           pioneerLuck: pioneerLuckApplied,

//           hexParty: hexPartyActive,

//           megaphone: megaphoneBonusApplied,

//           fastTrackJury: fastTrackJuryApplied,
//         },
//       },

//       currentUser: {
//         id: user._id,

//         name: user.name,

//         email: user.email,

//         profileImage: user.profileImage,

//         currentXP: user.xp,

//         currentCredits: user.credits,
//       },

//       pinInfo: {
//         id: pin._id,

//         status: pin.status,

//         pinStatus: pin.pinStatus,

//         category: RESOURCE_CATEGORY,

//         claimedBy: pin.claimedBy,

//         claimedAt: pin.claimedAt,

//         solvedAt: pin.solvedAt,

//         bounty: pin.bounty,

//         xpScore: pin.xpScore,

//         description: pin.description,

//         location: pin.location,

//         images: pin.images,

//         rewardDistributed: pin.rewardDistributed,
//       },

//       referralReward,

//       activeBoosts,

//       hexPartyActive,
//     });
//   } catch (error) {
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }

//     console.error(
//       "Solve resource pin error:",
//       error,
//     );

//     return res.status(500).json({
//       success: false,

//       message:
//         error.message ||
//         "Failed to solve resource pin",
//     });
//   } finally {
//     await session.endSession();
//   }
// };

export const makePinBeacon = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user.id;
    const { pinId } = req.body;

    if (!pinId) {
      return res.status(400).json({
        success: false,
        message: "pinId is required",
      });
    }

    session.startTransaction();

    // Find the pin
    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // Check if pin is already a Beacon
    if (pin.isBeacon) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This pin is already a Beacon",
      });
    }

    // Find user's inventory
    const inventory = await Inventory.findOne({
      userId,
    }).session(session);

    if (!inventory) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    const beacon = inventory.boosts?.TheBeacon;

    // Check if Beacon boost is active
    if (!beacon?.active?.active) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The Beacon boost is not active",
      });
    }

    // Check expiration
    if (
      beacon.active.expiresAt &&
      new Date() >= new Date(beacon.active.expiresAt)
    ) {
      beacon.active.active = false;

      await inventory.save({ session });
      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: "The Beacon boost has expired",
      });
    }

    // =========================================
    // MAKE PIN A BEACON
    // =========================================

    pin.isBeacon = true;

    // Optional: if you want to track who activated it
    // pin.validatedBy = userId;

    await pin.save({ session });

    // =========================================
    // DEACTIVATE THE BEACON BOOST
    // =========================================

    beacon.active.active = false;
    beacon.active.expiresAt = new Date();

    await inventory.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Pin successfully converted to Beacon",
      data: {
        pinId: pin._id,
        isBeacon: pin.isBeacon,
        beaconActive: false,
        actionHero: {
          level: actionHeroRank.level,

          rank: actionHeroRank.name,

          emoji: actionHeroRank.emoji,

          pinsSolved: totalPinsSolved,

          rankUnlocked: actionHeroRankUnlocked,

          nextRank: actionHeroRank.nextRank,

          maxRankReached: actionHeroRank.maxRankReached,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("makePinBeacon error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    session.endSession();
  }
};

// export const fakePin = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     await session.startTransaction();

//     // ==========================================
//     // USER ID
//     // ==========================================
//     const userId = req.user.id;

//     // ==========================================
//     // PIN ID
//     // ==========================================
//     const { pinId } = req.params;

//     // ==========================================
//     // FIND USER
//     // ==========================================
//     const user = await User.findById(userId).session(session);

//     if (!user) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const { currentLatitude, currentLongitude } = req.body;

// if (
//   currentLatitude === undefined ||
//   currentLongitude === undefined
// ) {
//   await session.abortTransaction();

//   return res.status(400).json({
//     success: false,
//     message: "Current location is required",
//   });
// }

// const pinLongitude = pin.location.coordinates[0];
// const pinLatitude = pin.location.coordinates[1];

// const liveDistance = calculateDistanceInMeters(
//   Number(currentLatitude),
//   Number(currentLongitude),
//   pinLatitude,
//   pinLongitude,
// );

// if (liveDistance > VALIDATION_CONFIG.MAX_DISTANCE_METERS) {
//   await session.abortTransaction();

//   return res.status(403).json({
//     success: false,
//     message: `You must be within ${VALIDATION_CONFIG.MAX_DISTANCE_METERS} meters of the pin location`,
//     distance: `${liveDistance.toFixed(2)} meters`,
//   });
// }

//     // ==========================================
//     // CHECK PIN EXISTS
//     // ==========================================
//     const pin = await Pin.findById(pinId).session(session);

//     if (!pin) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: "Pin not found",
//       });
//     }

//     // ==========================================
//     // CHECK USER ALREADY REPORTED
//     // ==========================================
//     const alreadyReported = pin.fakereportingBy.some(
//       (id) => id.toString() === userId,
//     );

//     if (alreadyReported) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "You already reported this pin",
//       });
//     }

//     // ==========================================
//     // FIND ACTIVITY
//     // ==========================================
//     let activity = await Activity.findOne({
//       userId,
//       pinId,
//       status: "pending",
//     })
//       .sort({ createdAt: -1 })
//       .session(session);

//     if (!activity) {
//       const activeCargo = await GoldenCargo.findOne({
//         userId,
//         pinId: pin._id,
//         expiresAt: { $gt: new Date() },
//       }).session(session);

//       const isReservedResourcePin =
//         pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
//         activeCargo;

//       if (!isReservedResourcePin) {
//         await session.abortTransaction();
//         return res.status(404).json({
//           success: false,
//           message: "No pending activity found",
//         });
//       }
//     }

//     // ==========================================
//     // TRAVEL DISTANCE & XP
//     // ==========================================
//     const travelDistance = activity?.distance || 0;
//     const baseTravelXP = Math.max(1, Math.floor(travelDistance / 100));

//     const activeBoosts = await getActiveBoosts(userId);
//     const hexPartyActive = await isHexPartyActive(pin.hexagonId);

//     const travelXP = calculateXPWithBoosts({
//       baseXP: baseTravelXP,
//       doubleXP: activeBoosts.Double_XP,
//       hexParty: hexPartyActive,
//     });

//     console.log("Fake Pin XP:", {
//       baseTravelXP,
//       activeBoosts,
//       hexPartyActive,
//       finalTravelXP: travelXP,
//     });

//     // ==========================================
//     // FLAGS
//     // ==========================================
//     let pinDeleted = false;
//     const isVanguard = pin.activePinMode === "vanguard";

//     // ==========================================
//     // ADD USER TO FAKE REPORTING (common)
//     // ==========================================
//     pin.fakereportingBy.push(userId);

//     // ==========================================
//     // BRANCH: VANGUARD vs NORMAL
//     // ==========================================

//     let creatorForNotification = null;

//     if (isVanguard) {
//       // ------------------------------------------
//       // VANGUARD MODE
//       // ------------------------------------------

//       pin.vanguardFakeReports = (pin.vanguardFakeReports || 0) + 1;

//       // Fetch creator before possible deletion
//       // creatorForNotification = await User.findById(pin.createdBy)
//       //   .select("name fcmToken")
//       //   .session(session);

//       creatorForNotification = await User.findById(pin.createdBy).session(
//         session,
//       );

//       // ------------------------------------------
//       // DELETE PIN AFTER 3 FAKE REPORTS
//       // ------------------------------------------

//       if (pin.vanguardFakeReports >= 3) {
//         // ===== Creator penalty (once) =====

//         if (!pin.creatorPenalized) {
//           const creator = creatorForNotification;

//           if (creator) {
//             // -15 Trust Score
//             creator.trustScore = Math.max(
//               0,
//               Number((creator.trustScore - 15).toFixed(1)),
//             );

//             // Ban if trust score is below 40
//             if (creator.trustScore < 40) {
//               creator.status = "banned";
//             }

//             // Deduct XP granted during pin creation
//             const instantXP = pin.xpScore || 0;

//             creator.xp = Math.max(0, creator.xp - instantXP);

//             // Recalculate level
//             const levelData = getLevelData(creator.xp);

//             // creator.level = levelData.level;
//             // creator.levelName = levelData.name;

//             await creator.save({ session });

//             // Fine
//             await Fine.create(
//               [
//                 {
//                   userId: creator._id,
//                   amount: 15,
//                   reason: `Vanguard pin ${pin._id} deleted after 3 fake reports`,
//                 },
//               ],
//               { session },
//             );

//             pin.creatorPenalized = true;
//           }
//         }

//         // ------------------------------------------
//         // HARD DELETE PIN
//         // ------------------------------------------

//         await Pin.findByIdAndDelete(pin._id).session(session);

//         pinDeleted = true;
//       }
//     } else {
//       // ------------------------------------------
//       // NORMAL MODE
//       // ------------------------------------------

//       // pin.pinScore -= 10;

//       const voteWeight = getValidationWeight(user);

// pin.pinScore = Number(pin.pinScore || 0) - voteWeight;

//       if (pin.pinScore <= -60) {
//         pin.pinStatus = "fake";
//       }

//       // ------------------------------------------
//       // CREATOR PENALTY
//       // ------------------------------------------

//       if (pin.pinScore <= -60 && !pin.creatorPenalized) {
//         creatorForNotification = await User.findById(pin.createdBy)
//           .select("name fcmToken")
//           .session(session);

//         const creator = creatorForNotification;

//         if (creator) {
//           creator.trustScore = Math.max(
//             0,
//             Number((creator.trustScore - 15).toFixed(1)),
//           );

//           if (creator.trustScore < 40) {
//             creator.status = "banned";
//           }

//           await creator.save({ session });

//           await Fine.create(
//             [
//               {
//                 userId: creator._id,
//                 amount: 15,
//                 reason: `Pin ${pin._id} reached fake threshold score of -60`,
//               },
//             ],
//             { session },
//           );

//           pin.creatorPenalized = true;
//         }
//       }
//     }

//     // ==========================================
//     // REWARD THE REPORTER (both modes)
//     // ==========================================
//     const updated_level = user.xp + travelXP;
//     await checkLevelUp(user, updated_level, session);

//     user.xp += travelXP;
//     await updateLeaderboardXP(user._id, travelXP, session);

//     user.trustScore = Math.min(
//       99.9,
//       Number((user.trustScore + 0.1).toFixed(1)),
//     );

//     // const levelData = getLevelData(user.xp);
//     // user.level = levelData.level;
//     // user.levelName = levelData.name;

//     // ==========================================
//     // COMPLETE ACTIVITY
//     // ==========================================
//     if (activity) {
//       activity.status = "completed";
//     }

//     // ==========================================
//     // SAVE ALL
//     // ==========================================
//     if (!pinDeleted) {
//       await pin.save({ session });
//     }

//     await user.save({ session });

//     if (activity) {
//       await activity.save({ session });
//     }

//     // ==========================================
//     // PREPARE NOTIFICATIONS
//     // ==========================================
//     // const pinCreator = await User.findById(pin.createdBy)
//     //   .select("name fcmToken")
//     //   .session(session);

//     const reporterNotification = {
//       tokens: user.fcmToken ? [user.fcmToken] : [],
//       title: "🚩 Fake Report Submitted",
//       body: `Your fake report has been submitted successfully. You earned ${travelXP} XP.`,
//       data: {
//         type: "PIN_REPORTED_FAKE",
//         pinId: pin._id.toString(),
//         xp: travelXP,
//         mode: pin.activePinMode,
//       },
//     };

//     await Notification.create({
//       title: reporterNotification.title,
//       description: reporterNotification.body,
//       notificationType: "private",
//       receivers: [user._id],
//       senderRole: "system",
//     });

//     // ==========================================
//     // CREATOR NOTIFICATION
//     // ==========================================

//     let creatorNotification = null;

//     if (creatorForNotification?.fcmToken) {
//       if (pinDeleted) {
//         // ========================================
//         // PIN DELETED
//         // ========================================

//         creatorNotification = {
//           tokens: [creatorForNotification.fcmToken],

//           title: "🚨 Vanguard Pin Deleted",

//           body: "Your Vanguard pin was deleted after receiving 3 fake reports.",

//           data: {
//             type: "VANGUARD_PIN_DELETED",

//             pinId: pin._id.toString(),

//             reason: "THREE_FAKE_REPORTS",

//             fakeReports: "3",
//           },
//         };
//       } else {
//         // ========================================
//         // PIN REPORTED
//         // ========================================

//         const fakeReports = pin.vanguardFakeReports || 0;

//         const remainingReports = isVanguard
//           ? Math.max(0, 3 - fakeReports)
//           : null;

//         creatorNotification = {
//           tokens: [creatorForNotification.fcmToken],

//           title: isVanguard ? "🚩 Vanguard Pin Reported" : "🚩 Pin Reported",

//           body: isVanguard
//             ? `Your Vanguard pin received a fake report. ${remainingReports} fake report${
//                 remainingReports === 1 ? "" : "s"
//               } remaining before deletion.`
//             : `${user.name} reported your pin as fake.`,

//           data: {
//             type: isVanguard ? "VANGUARD_PIN_REPORTED" : "PIN_REPORTED_BY_USER",

//             pinId: pin._id.toString(),

//             reportedBy: user._id.toString(),

//             fakeReports: String(pin.vanguardFakeReports || 0),

//             remainingReports:
//               remainingReports !== null ? String(remainingReports) : "",
//           },
//         };
//       }
//     }

//     if (creatorNotification) {
//       await Notification.create({
//         title: creatorNotification.title,
//         description: creatorNotification.body,
//         notificationType: "private",
//         receivers: [creatorForNotification._id],
//         senderRole: "system",
//       });
//     }

//     // ==========================================
//     // COMMIT
//     // ==========================================
//     await session.commitTransaction();

//     // await Promise.all([
//     //   sendNotification(reporterNotification),
//     //   sendNotification(creatorNotification),
//     // ]);

//     const notifications = [sendNotification(reporterNotification)];

//     if (creatorNotification) {
//       notifications.push(sendNotification(creatorNotification));
//     }

//     await Promise.all(notifications);

//     return res.status(200).json({
//       success: true,
//       message: pinDeleted
//         ? "Pin deleted after 3 fake reports (Vanguard mode)"
//         : "Pin reported as fake successfully",
//       mode: pin.activePinMode,
//       rewards: {
//         baseXP: baseTravelXP,
//         xpEarned: travelXP,
//         trustScoreEarned: 0.1,
//       },

//       activeBoosts,
//       hexPartyActive,

//       pinData: {
//         pinScore: pin.pinScore,
//         pinStatus: pinDeleted ? "deleted" : pin.pinStatus,
//         vanguardFakeReports: pin.vanguardFakeReports,
//         activePinMode: pin.activePinMode,
//       },
//       data: pinDeleted ? null : pin,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.log("Fake Pin Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Server Error",
//       error: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

export const lockPinWithMultiLock = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user.id;
    const { pinId } = req.body;

    if (!pinId) {
      return res.status(400).json({
        success: false,
        message: "pinId is required",
      });
    }

    await session.startTransaction();

    // =========================================
    // FIND PIN
    // =========================================

    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // =========================================
    // CHECK IF PIN IS ALREADY LOCKED
    // =========================================

    if (pin.islocked) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This pin is already locked",
        data: {
          lockedBy: pin.lockedBy,
        },
      });
    }

    // =========================================
    // FIND MULTILOCK
    // =========================================

    const multiLock = await MultiLock.findOne({
      userId,
    }).session(session);

    if (!multiLock) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "MultiLock is not activated",
      });
    }

    const now = new Date();

    // =========================================
    // CHECK MULTILOCK EXPIRATION
    // =========================================

    if (!multiLock.expireAt || now >= new Date(multiLock.expireAt)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "MultiLock has expired",
      });
    }

    // =========================================
    // CHECK MAX 3 PINS
    // =========================================

    if (multiLock.activePinCount >= 3) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Maximum 3 pins can be locked with MultiLock",
      });
    }

    // =========================================
    // CHECK IF USER ALREADY LOCKED THIS PIN
    // =========================================

    const alreadyLocked = multiLock.activePins.some(
      (id) => id.toString() === pinId.toString(),
    );

    if (alreadyLocked) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You have already locked this pin",
      });
    }

    // =========================================
    // LOCK PIN
    // =========================================

    pin.islocked = true;
    pin.lockedBy = userId;
    pin.lockExpiresAt = multiLock.expireAt;

    await pin.save({ session });

    // =========================================
    // UPDATE MULTILOCK
    // =========================================

    multiLock.activePins.push(pin._id);
    multiLock.activePinCount += 1;

    await multiLock.save({ session });

    // =========================================
    // COMMIT
    // =========================================

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Pin locked successfully",
      data: {
        pinId: pin._id,
        islocked: true,
        lockedBy: userId,
        activePinCount: multiLock.activePinCount,
        maxPins: 3,
        expireAt: multiLock.expireAt,
      },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("lockPinWithMultiLock error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    session.endSession();
  }
};

// export const validatePin = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     await session.startTransaction();

//     const { pinId } = req.params;
//     const userId = req.user.id;
//     console.log(userId);

//     // =========================================
//     // CURRENT USER LIVE LOCATION (FRONTEND GPS)
//     // =========================================

//     const { currentLatitude, currentLongitude, hexagonId } = req.body;

// if (
//   currentLatitude === undefined ||
//   currentLongitude === undefined
// ) {
//   await session.abortTransaction();

//   return res.status(400).json({
//     success: false,
//     message: "Current location is required",
//   });
// }

//     // =========================================
//     // FIND USER
//     // =========================================

//     const user = await User.findById(userId).session(session);

//     if (!user) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // =========================================
//     // FIND PIN
//     // =========================================

//     const pin = await Pin.findById(pinId).session(session);

//     if (!pin) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "Pin not found",
//       });
//     }

//     if (
//       pin.islocked === true &&
//       pin.lockedBy?.toString() !== userId.toString()
//     ) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "This Pin is locked",
//         lockedBy: pin.lockedBy,
//       });
//     }

//     const activeBoosts = await getActiveBoosts(userId);
//     const hexPartyActive = await isHexPartyActive(pin.hexagonId);

//     console.log(activeBoosts);
//     console.log(hexPartyActive);

//     const reservedCargo = await GoldenCargo.findOne({
//       pinId: pin._id,
//       expiresAt: { $gt: new Date() },
//     }).session(session);

//     if (reservedCargo && reservedCargo.userId.toString() !== userId) {
//       await session.abortTransaction();

//       return res.status(403).json({
//         success: false,
//         message: "This resource pin is reserved by another Golden Cargo user",
//       });
//     }

//     // =====================================================
//     // GOLDEN CARGO RESERVATION CHECK
//     // =====================================================

//     if (pin.category === "Resources (Zero-Waste, Upcycling & Utilities)") {
//       const activeCargo = await GoldenCargo.findOne({
//         pinId: pin._id,
//         expiresAt: { $gt: new Date() },
//       }).session(session);

//       if (
//         pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
//         activeCargo
//       ) {
//         const alreadyReserved = activeCargo.pinId.some(
//           (id) => id.toString() === pin._id.toString(),
//         );

//         if (!alreadyReserved) {
//           if (activeCargo.pinId.length >= 3) {
//             await session.abortTransaction();

//             return res.status(400).json({
//               success: false,
//               message: "Golden Cargo can reserve maximum 3 resource pins",
//             });
//           }

//           activeCargo.pinId.push(pin._id);

//           await activeCargo.save({ session });

//           pin.reservationExpiresAt = activeCargo.expiresAt;

//           await pin.save({ session });
//         }
//       }

//       if (activeCargo) {
//         const isCargoOwner = activeCargo.userId.toString() === userId;

//         if (!isCargoOwner) {
//           await session.abortTransaction();

//           return res.status(403).json({
//             success: false,
//             message:
//               "This resource pin is reserved by Golden Cargo and cannot be validated until the reservation expires.",
//             reservedUntil: activeCargo.expiresAt,
//           });
//         }
//       }
//     }

//     // =========================================
//     // PREVENT CREATOR VALIDATION
//     // =========================================

//     if (pin.createdBy.toString() === userId) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "You cannot validate your own pin",
//       });
//     }

//     // =========================================
//     // PIN LOCATION
//     // =========================================

//     const pinLongitude = pin.location.coordinates[0];
//     const pinLatitude = pin.location.coordinates[1];

//     // =========================================
//     // LIVE GPS → PIN DISTANCE
//     // Used for 10 meter validation
//     // =========================================

//     const liveDistance = calculateDistanceInMeters(
//       Number(currentLatitude),
//       Number(currentLongitude),
//       pinLatitude,
//       pinLongitude,
//     );

//     // =========================================
//     // CHECK 10 METER RADIUS
//     // =========================================

//     // if (liveDistance > 10)
//     if (liveDistance > VALIDATION_CONFIG.MAX_DISTANCE_METERS)
//       {
//       await session.abortTransaction();

//       return res.status(403).json({
//         success: false,
//         message: `You must be within ${VALIDATION_CONFIG.MAX_DISTANCE_METERS} meters of the pin location`,
//         // message: "You must be within 10 meters of the pin location",
//         distance: `${liveDistance.toFixed(2)} meters`,
//       });
//     }

//     // =========================================
//     // FIND ACTIVITY
//     // =========================================

//     const activity = await Activity.findOne({
//       userId,
//       pinId,
//       status: "pending",
//     })
//       .sort({ createdAt: -1 })
//       .session(session);

//     // =========================================
//     // CHECK ACTIVITY
//     // =========================================

//     if (!activity) {
//       const activeCargo = await GoldenCargo.findOne({
//         userId,
//         pinId: pin._id,
//         expiresAt: { $gt: new Date() },
//       }).session(session);

//       const isReservedResourcePin =
//         pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
//         activeCargo;

//       if (!isReservedResourcePin) {
//         await session.abortTransaction();

//         return res.status(404).json({
//           success: false,
//           message: "No pending activity found",
//         });
//       }
//     }

//     // =========================================
//     // UPDATE STATUS
//     // =========================================

//     activity.status = "completed";

//     await activity.save({ session });

//     // =========================================
//     // TRAVEL DISTANCE FROM ACTIVITY
//     // =========================================

//     const travelDistance = activity.distance || 0;

//     const METER_PER_MILE = 1609.344;

// const milesTravelled =
//   travelDistance / METER_PER_MILE;

// const creditsEarned =
//   Number((milesTravelled * 5).toFixed(2));
//     const baseTravelXP = Math.max(1, Math.floor(travelDistance / 100));

//     const travelXP = calculateXPWithBoosts({
//       baseXP: baseTravelXP,
//       doubleXP: activeBoosts.Double_XP,
//       hexParty: hexPartyActive,
//     });

//     // =========================================
//     // FIND VALIDATION
//     // =========================================

//     let validation = await Validation.findOne({
//       pinID: pinId,
//     }).session(session);

//     // =====================================================
//     // FIRST VALIDATOR
//     // =====================================================

// //     if (!validation) {
// //       validation = new Validation({
// //         pinID: pinId,
// //         validatedBy: userId,
// //         status: "orange",
// //         beneficiaries: [],
// //       });

// //       await validation.save({ session });

// //       // =========================================
// //       // UPDATE PIN
// //       // =========================================

// //       pin.validatedBy = userId;
// //       pin.status = "orange";

// //       // increase score
// //       // pin.pinScore += 10;
// //       const voteWeight = getValidationWeight(user);

// // pin.pinScore = Number(pin.pinScore || 0) + voteWeight;

// //       // =========================================
// //       // AUTO VERIFY PIN
// //       // CREATOR REWARD ONLY ONCE
// //       // =========================================

// //       let pinVerifiedNotification = null;

// //       if (
// //         pin.pinScore >= 100 &&
// //         (!pin.pinStatus || pin.pinStatus === "pending")
// //       ) {
// //         // update pin status
// //         pin.pinStatus = "verified";
// //         pin.status = "green";

// //         // =========================================
// //         // REWARD PIN CREATOR
// //         // =========================================

// //         const pinCreator = await User.findById(pin.createdBy).session(session);

// //         if (pinCreator) {
// //           // give xp
// //           pinCreator.xp += 15;

// //           // increase trust score
// //           pinCreator.trustScore = Math.min(
// //             99.9,
// //             Number((pinCreator.trustScore + 0.5).toFixed(1)),
// //           );

// //           // =========================================
// //           // UPDATE LEVEL
// //           // =========================================

// //           const creatorLevelData = getLevelData(pinCreator.xp);

// //           pinCreator.level = creatorLevelData.level;
// //           pinCreator.levelName = creatorLevelData.name;

// //           await pinCreator.save({ session });

// //           pinVerifiedNotification = {
// //             tokens: pinCreator.fcmToken ? [pinCreator.fcmToken] : [],
// //             title: "🎉 Pin Verified",
// //             body: "Congratulations! Your pin has been verified. You earned 15 XP.",
// //             data: {
// //               type: "PIN_VERIFIED",
// //               pinId: pin._id.toString(),
// //               xp: 15,
// //             },
// //           };
// //         }
// //       }

// //       // =========================================
// //       // PENALIZE FAKE REPORTERS
// //       // =========================================

// //       if (pin.fakereportingBy.length > 0 && !pin.fakeReportersPenalized) {
// //         // get all fake reporters
// //         const fakeReporters = await User.find({
// //           _id: { $in: pin.fakereportingBy },
// //         }).session(session);

// //         for (const reporter of fakeReporters) {
// //           // =========================================
// //           // DECREASE TRUST SCORE
// //           // =========================================

// //           reporter.trustScore = Math.max(
// //             0,
// //             Number((reporter.trustScore - 15).toFixed(1)),
// //           );

// //           // =========================================
// //           // BAN USER IF BELOW 40
// //           // =========================================

// //           if (reporter.trustScore < 40) {
// //             reporter.status = "banned";
// //           }

// //           // =========================================
// //           // SAVE USER
// //           // =========================================

// //           await reporter.save({ session });

// //           // =========================================
// //           // CREATE FINE LOG
// //           // =========================================

// //           await Fine.create(
// //             [
// //               {
// //                 userId: reporter._id,
// //                 amount: 15,
// //                 reason: `False fake report on verified pin ${pin._id}`,
// //               },
// //             ],
// //             { session },
// //           );
// //         }

// //         // =========================================
// //         // PREVENT DUPLICATE PENALTY
// //         // =========================================

// //         pin.fakeReportersPenalized = true;
// //       }

// //       await pin.save({ session });

// //       // =========================================
// //       // REWARD VALIDATOR
// //       // =========================================

// //       const updated_lavel = user.xp + travelXP;
// //       await checkLevelUp(user, updated_lavel, session);

// //       user.xp += travelXP;
// //       user.credits += 5;
// //       await updateLeaderboardXP(user._id, travelXP, session);

// //       // trust score increase
// //       user.trustScore = Math.min(
// //         99.9,
// //         Number((user.trustScore + 0.1).toFixed(1)),
// //       );

// //       // =========================================
// //       // UPDATE LEVEL
// //       // =========================================

// //       await user.save({ session });

// //       // =========================================
// //       // UPDATE USER STATS
// //       // =========================================

// //       // =========================================
// //       // FIND USER STATS
// //       // =========================================
// //       let userStats = await States.findOne({
// //         userId: userId,
// //       }).session(session);

// //       // =========================================
// //       // CREATE IF NOT EXISTS
// //       // =========================================

// //       if (!userStats) {
// //         userStats = new States({
// //           user: userId,
// //           pinsValidated: 1,
// //         });
// //       } else {
// //         userStats.pinsValidated += 1;
// //       }

// //       // =========================================
// //       // SAVE
// //       // =========================================

// //       await userStats.save({ session });

// //       // =========================================
// //       // CREATE ACTIVITY LOG
// //       // =========================================

// //       await Activity.create(
// //         [
// //           {
// //             userId: userId,

// //             activityType: "pin_validated",

// //             pinId: pin._id,

// //             pinTitle: pin.description || "Pin Validation",

// //             images: pin.images || [],

// //             xpEarned: travelXP,

// //             creditsSpent: 5,

// //             distance: travelDistance,

// //             activityLocation: {
// //               latitude: pinLatitude,
// //               longitude: pinLongitude,
// //             },

// //             startLocation: {
// //               latitude: Number(currentLatitude),
// //               longitude: Number(currentLongitude),
// //             },

// //             endLocation: {
// //               latitude: pinLatitude,
// //               longitude: pinLongitude,
// //             },

// //             status: "completed",
// //           },
// //         ],
// //         { session },
// //       );

// //       // =========================================
// //       // PREPARE NOTIFICATIONS
// //       // =========================================

// //       const pinCreator = await User.findById(pin.createdBy)
// //         .select("fcmToken name")
// //         .session(session);

// //       const validatorRewardNotification = {
// //         tokens: user.fcmToken ? [user.fcmToken] : [],
// //         title: "✅ Pin Validated",
// //         body: `You earned ${travelXP} XP and 5 Credits for validating this pin.`,
// //         data: {
// //           type: "PIN_VALIDATED",
// //           pinId: pin._id.toString(),
// //           xp: travelXP,
// //           credits: 5,
// //         },
// //       };

// //       const creatorNotification = {
// //         tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],
// //         title: "📍 Pin Validation",
// //         body: `${user.name} validated your pin.`,
// //         data: {
// //           type: "PIN_VALIDATED_BY_USER",
// //           pinId: pin._id.toString(),
// //           validatorId: user._id.toString(),
// //         },
// //       };

// //       // =========================================
// //       // COMMIT
// //       // =========================================

// //       await session.commitTransaction();

// //       const notifications = [
// //         sendNotification(validatorRewardNotification),
// //         sendNotification(creatorNotification),
// //       ];

// //       if (pinVerifiedNotification) {
// //         notifications.push(sendNotification(pinVerifiedNotification));
// //       }

// //       await Promise.all(notifications);

// //       return res.status(200).json({
// //         success: true,
// //         message: "Pin validated successfully",

// //         rewards: {
// //           xpEarned: travelXP,
// //           creditsEarned: 5,
// //           trustScoreEarned: 0.1,
// //         },

// //         pinData: {
// //           pinScore: pin.pinScore,
// //           pinStatus: pin.pinStatus,
// //           status: pin.status,
// //         },

// //         distanceInfo: {
// //           liveDistanceMeters: liveDistance.toFixed(2),

// //           travelDistanceMeters: travelDistance.toFixed(2),
// //         },
// //         activeBoosts,
// //         hexPartyActive,
// //       });
// //     }

// if (!validation) {
//   // =====================================================
//   // FIRST VALIDATOR
//   // =====================================================

//   const voteWeight = getValidationWeight(user);

//   // =====================================================
//   // CREATE VALIDATION WITH FIRST WEIGHTED VOTE
//   // =====================================================

//   validation = new Validation({
//     pinID: pinId,

//     // Existing field - keep for backward compatibility
//     validatedBy: userId,

//     status: "orange",

//     beneficiaries: [],

//     // =====================================================
//     // WEIGHTED VOTE
//     // =====================================================

//     votes: [
//       {
//         userId: user._id,

//         vote: "VALID",

//         weight: voteWeight,

//         // Snapshot at the time of voting
//         trustScore: Number(user.trustScore || 0),

//         level: Number(user.level || 1),

//         levelName: user.levelName || null,

//         // GPS snapshot
//         location: {
//           latitude: Number(currentLatitude),
//           longitude: Number(currentLongitude),
//         },

//         distanceMeters: Number(liveDistance),

//         // First validator rewards
//         xpEarned: travelXP,

//         creditsEarned: 5,
//       },
//     ],

//     // =====================================================
//     // CONSENSUS VALUES
//     // =====================================================

//     validWeight: voteWeight,

//     fakeWeight: 0,

//     validVotes: 1,

//     fakeVotes: 0,

//     confidenceScore: voteWeight,

//     consensusStatus: "PENDING",
//   });

//   // =====================================================
//   // UPDATE PIN
//   // =====================================================

//   pin.validatedBy = userId;

//   pin.status = "orange";

//   /*
//   |--------------------------------------------------------------------------
//   | Validation is source of truth.
//   | Pin score is only synced from validation.
//   |--------------------------------------------------------------------------
//   */

//   pin.pinScore = validation.confidenceScore;

//   // =====================================================
//   // CHECK IF FIRST VOTE ALREADY VERIFIES PIN
//   // =====================================================

//   let pinVerifiedNotification = null;

//   if (
//     validation.confidenceScore >=
//       VALIDATION_CONFIG.VERIFIED_SCORE &&
//     validation.consensusStatus === "PENDING"
//   ) {
//     // =====================================================
//     // MARK VALIDATION VERIFIED
//     // =====================================================

//     validation.consensusStatus = "VERIFIED";

//     validation.consensusReachedAt = new Date();

//     validation.status = "green";

//     // =====================================================
//     // MARK PIN VERIFIED
//     // =====================================================

//     pin.pinStatus = "verified";

//     pin.status = "green";

//     // =====================================================
//     // REWARD PIN CREATOR
//     // =====================================================

//     const pinCreator = await User.findById(
//       pin.createdBy,
//     ).session(session);

//     if (pinCreator) {
//       pinCreator.xp += 15;

//       pinCreator.trustScore = Math.min(
//         99.9,
//         Number(
//           (
//             Number(pinCreator.trustScore || 0) + 0.5
//           ).toFixed(1),
//         ),
//       );

//       // =====================================================
//       // UPDATE CREATOR LEVEL
//       // =====================================================

//       const creatorLevelData = getLevelData(
//         pinCreator.xp,
//       );

//       pinCreator.level = creatorLevelData.level;

//       pinCreator.levelName =
//         creatorLevelData.name;

//       await pinCreator.save({ session });

//       // =====================================================
//       // PREPARE VERIFIED NOTIFICATION
//       // =====================================================

//       pinVerifiedNotification = {
//         tokens: pinCreator.fcmToken
//           ? [pinCreator.fcmToken]
//           : [],

//         title: "🎉 Pin Verified",

//         body:
//           "Congratulations! Your pin has been verified. You earned 15 XP.",

//         data: {
//           type: "PIN_VERIFIED",

//           pinId: pin._id.toString(),

//           xp: 15,
//         },
//       };
//     }
//   }

//   // =====================================================
//   // PENALIZE USERS WHO FALSELY REPORTED THIS PIN
//   // ONLY WHEN PIN IS ACTUALLY VERIFIED
//   // =====================================================

//   if (
//     validation.consensusStatus === "VERIFIED" &&
//     pin.fakereportingBy?.length > 0 &&
//     !pin.fakeReportersPenalized
//   ) {
//     const fakeReporters = await User.find({
//       _id: {
//         $in: pin.fakereportingBy,
//       },
//     }).session(session);

//     for (const reporter of fakeReporters) {
//       // =====================================================
//       // DECREASE TRUST SCORE
//       // =====================================================

//       reporter.trustScore = Math.max(
//         0,
//         Number(
//           (
//             Number(reporter.trustScore || 0) - 15
//           ).toFixed(1),
//         ),
//       );

//       // =====================================================
//       // CURRENT BAN RULE
//       // =====================================================
//       // Later this can be changed to shadowBan.

//       if (reporter.trustScore < 40) {
//         reporter.status = "banned";
//       }

//       await reporter.save({ session });

//       // =====================================================
//       // FINE LOG
//       // =====================================================

//       await Fine.create(
//         [
//           {
//             userId: reporter._id,

//             amount: 15,

//             reason: `False fake report on verified pin ${pin._id}`,
//           },
//         ],
//         {
//           session,
//         },
//       );
//     }

//     // Prevent duplicate penalty
//     pin.fakeReportersPenalized = true;
//   }

//   // =====================================================
//   // SAVE VALIDATION + PIN
//   // =====================================================

//   await validation.save({ session });

//   await pin.save({ session });

//   // =====================================================
//   // REWARD FIRST VALIDATOR
//   // =====================================================

//   const updated_level =
//     Number(user.xp || 0) + travelXP;

//   await checkLevelUp(
//     user,
//     updated_level,
//     session,
//   );

//   user.xp =
//     Number(user.xp || 0) + travelXP;

//   // user.credits =
//   //   Number(user.credits || 0) + 5;
// user.credits =
//   Number(user.credits || 0) + creditsEarned;
//   await updateLeaderboardXP(
//     user._id,
//     travelXP,
//     session,
//   );

//   // =====================================================
//   // VALIDATOR TRUST SCORE
//   // =====================================================

//   user.trustScore = Math.min(
//     99.9,
//     Number(
//       (
//         Number(user.trustScore || 0) + 0.1
//       ).toFixed(1),
//     ),
//   );

//   await user.save({ session });

//   // =====================================================
//   // UPDATE USER STATS
//   // =====================================================

//   let userStats = await States.findOne({
//     user: userId,
//   }).session(session);

//   if (!userStats) {
//     userStats = new States({
//       user: userId,

//       pinsValidated: 1,
//     });
//   } else {
//     userStats.pinsValidated =
//       Number(userStats.pinsValidated || 0) + 1;
//   }

//   await userStats.save({ session });

//   // =====================================================
//   // CREATE ACTIVITY LOG
//   // =====================================================

//   await Activity.create(
//     [
//       {
//         userId: userId,

//         activityType: "pin_validated",

//         pinId: pin._id,

//         pinTitle:
//           pin.description || "Pin Validation",

//         images: pin.images || [],

//         xpEarned: travelXP,

//         creditsSpent: 5,

//         distance: travelDistance,

//         activityLocation: {
//           latitude: pinLatitude,

//           longitude: pinLongitude,
//         },

//         startLocation: {
//           latitude: Number(currentLatitude),

//           longitude: Number(currentLongitude),
//         },

//         endLocation: {
//           latitude: pinLatitude,

//           longitude: pinLongitude,
//         },

//         status: "completed",
//       },
//     ],
//     {
//       session,
//     },
//   );

//   // =====================================================
//   // PIN CREATOR
//   // =====================================================

//   const pinCreator = await User.findById(
//     pin.createdBy,
//   )
//     .select("fcmToken name")
//     .session(session);

//   // =====================================================
//   // VALIDATOR NOTIFICATION
//   // =====================================================

//   const validatorRewardNotification = {
//     tokens: user.fcmToken
//       ? [user.fcmToken]
//       : [],

//     title: "✅ Pin Validated",

//     body: `You earned ${travelXP} XP and 5 Credits for validating this pin.`,

//     data: {
//       type: "PIN_VALIDATED",

//       pinId: pin._id.toString(),

//       xp: travelXP,

//       credits: 5,

//       voteWeight: String(voteWeight),
//     },
//   };

//   // =====================================================
//   // CREATOR NOTIFICATION
//   // =====================================================

//   const creatorNotification = {
//     tokens: pinCreator?.fcmToken
//       ? [pinCreator.fcmToken]
//       : [],

//     title: "📍 Pin Validation",

//     body: `${user.name} validated your pin.`,

//     data: {
//       type: "PIN_VALIDATED_BY_USER",

//       pinId: pin._id.toString(),

//       validatorId: user._id.toString(),

//       voteWeight: String(voteWeight),
//     },
//   };

//   // =====================================================
//   // COMMIT TRANSACTION
//   // =====================================================

//   await session.commitTransaction();

//   // =====================================================
//   // SEND NOTIFICATIONS AFTER COMMIT
//   // =====================================================

//   const notifications = [];

//   if (
//     validatorRewardNotification.tokens.length
//   ) {
//     notifications.push(
//       sendNotification(
//         validatorRewardNotification,
//       ),
//     );
//   }

//   if (creatorNotification.tokens.length) {
//     notifications.push(
//       sendNotification(creatorNotification),
//     );
//   }

//   if (
//     pinVerifiedNotification?.tokens?.length
//   ) {
//     notifications.push(
//       sendNotification(
//         pinVerifiedNotification,
//       ),
//     );
//   }

//   await Promise.all(notifications);

//   // =====================================================
//   // RESPONSE
//   // =====================================================

//   return res.status(200).json({
//     success: true,

//     message:
//       validation.consensusStatus === "VERIFIED"
//         ? "Pin validated and verified successfully"
//         : "Pin validated successfully",

//     vote: {
//       type: "VALID",

//       weight: voteWeight,

//       trustScore: user.trustScore,

//       level: user.level,

//       levelName: user.levelName,
//     },

//     consensus: {
//       validWeight: validation.validWeight,

//       fakeWeight: validation.fakeWeight,

//       validVotes: validation.validVotes,

//       fakeVotes: validation.fakeVotes,

//       confidenceScore:
//         validation.confidenceScore,

//       status:
//         validation.consensusStatus,
//     },

//     rewards: {
//       xpEarned: travelXP,

//       // creditsEarned: 5,
//       creditsEarned,

//       trustScoreEarned: 0.1,
//     },

//     pinData: {
//       pinScore: pin.pinScore,

//       pinStatus: pin.pinStatus,

//       status: pin.status,
//     },

//     distanceInfo: {
//       liveDistanceMeters:
//         liveDistance.toFixed(2),

//       travelDistanceMeters:
//         travelDistance.toFixed(2),
//     },

//     activeBoosts,

//     hexPartyActive,
//   });
// }

//     // =========================================
//     // UPDATE USER STATS
//     // =========================================

//     let userStats = await States.findOne({
//       user: userId,
//     }).session(session);

//     // create if not exists
//     if (!userStats) {
//       userStats = new States({
//         user: userId,
//         pinsValidated: 1,
//       });
//     } else {
//       userStats.pinsValidated += 1;
//     }

//     await userStats.save({ session });

//     // =====================================================
//     // PREVENT SAME VALIDATOR
//     // =====================================================

//     if (
//       validation.validatedBy &&
//       validation.validatedBy.toString() === userId
//     ) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "You already validated this pin",
//       });
//     }

//     // =====================================================
//     // CHECK 24 HOUR WINDOW
//     // =====================================================

//     const createdAt = new Date(validation.createdAt);

//     const now = new Date();

//     const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

//     if (diffHours > 24) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "Validation window expired",
//       });
//     }

//     // =====================================================
//     // ALREADY BENEFICIARY
//     // =====================================================

//     const alreadyBeneficiary = validation.beneficiaries.some(
//       (id) => id.toString() === userId,
//     );

//     if (alreadyBeneficiary) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "Already validated as beneficiary",
//       });
//     }

//     // =====================================================
//     // ADD BENEFICIARY
//     // =====================================================

//     // validation.beneficiaries.push(userId);

//     // await validation.save({ session });

//     // =========================================
//     // UPDATE PIN
//     // =========================================

//     // pin.beneficiaries.push(userId);

//     // increase score
//     // pin.pinScore += 10;

//     // const voteWeight = getValidationWeight(user);

// // pin.pinScore = Number(pin.pinScore || 0) + voteWeight;

// const voteWeight = getValidationWeight(user);

// /*
// |--------------------------------------------------------------------------
// | ADD BENEFICIARY
// |--------------------------------------------------------------------------
// */

// validation.beneficiaries.push(userId);

// pin.beneficiaries.push(userId);

// /*
// |--------------------------------------------------------------------------
// | ADD WEIGHTED VOTE
// |--------------------------------------------------------------------------
// */

// validation.votes.push({
//   userId: user._id,

//   vote: "VALID",

//   weight: voteWeight,

//   trustScore: Number(user.trustScore || 0),

//   level: Number(user.level || 1),

//   levelName: user.levelName || null,

//   location: {
//     latitude: Number(currentLatitude),
//     longitude: Number(currentLongitude),
//   },

//   distanceMeters: liveDistance,

//   xpEarned: travelXP,

//   creditsEarned: 2,
// });

// /*
// |--------------------------------------------------------------------------
// | RECALCULATE SCORE
// |--------------------------------------------------------------------------
// */

// const validVotes = validation.votes.filter(
//   (vote) => vote.vote === "VALID",
// );

// const fakeVotes = validation.votes.filter(
//   (vote) => vote.vote === "FAKE",
// );

// validation.validWeight = validVotes.reduce(
//   (total, vote) =>
//     total + Number(vote.weight || 0),
//   0,
// );

// validation.fakeWeight = fakeVotes.reduce(
//   (total, vote) =>
//     total + Number(vote.weight || 0),
//   0,
// );

// validation.validVotes = validVotes.length;

// validation.fakeVotes = fakeVotes.length;

// /*
// |--------------------------------------------------------------------------
// | FINAL CONFIDENCE SCORE
// |--------------------------------------------------------------------------
// */

// validation.confidenceScore =
//   validation.validWeight -
//   validation.fakeWeight;

// /*
// |--------------------------------------------------------------------------
// | SYNC PIN SCORE
// |--------------------------------------------------------------------------
// */

// pin.pinScore =
//   validation.confidenceScore;

//     // =========================================
//     // AUTO VERIFY PIN
//     // CREATOR REWARD ONLY ONCE
//     // =========================================

//     // if (
//     //   pin.pinScore >= 100 &&
//     //   (!pin.pinStatus || pin.pinStatus === "pending")
//     // ) {
//     if (
//   validation.confidenceScore >=
//     VALIDATION_CONFIG.VERIFIED_SCORE &&
//   validation.consensusStatus === "PENDING"
// ) {
//       // update pin status
//         validation.consensusStatus = "VERIFIED";

//   validation.consensusReachedAt = new Date();

//   validation.status = "green";

//   pin.pinStatus = "verified";

//   pin.status = "green";
//       // pin.pinStatus = "verified";
//       // pin.status = "green";

//       // =========================================
//       // REWARD PIN CREATOR
//       // =========================================

//       const pinCreator = await User.findById(pin.createdBy).session(session);

//       if (pinCreator) {
//         // give xp
//         pinCreator.xp += 15;

//         // increase trust score
//         pinCreator.trustScore = Math.min(
//           99.9,
//           Number((pinCreator.trustScore + 0.5).toFixed(1)),
//         );

//         // =========================================
//         // UPDATE LEVEL
//         // =========================================

//         const creatorLevelData = getLevelData(pinCreator.xp);

//         pinCreator.level = creatorLevelData.level;
//         pinCreator.levelName = creatorLevelData.name;

//         await pinCreator.save({ session });
//       }
//     }

//     // =========================================
//     // PENALIZE FAKE REPORTERS
//     // =========================================

//     if (pin.fakereportingBy.length > 0 && !pin.fakeReportersPenalized) {
//       // get all fake reporters
//       const fakeReporters = await User.find({
//         _id: { $in: pin.fakereportingBy },
//       }).session(session);

//       for (const reporter of fakeReporters) {
//         // =========================================
//         // DECREASE TRUST SCORE
//         // =========================================

//         reporter.trustScore = Math.max(
//           0,
//           Number((reporter.trustScore - 15).toFixed(1)),
//         );

//         // =========================================
//         // BAN USER IF BELOW 40
//         // =========================================

//         if (reporter.trustScore < 100) {
//           reporter.status = "banned";
//         }

//         // =========================================
//         // SAVE USER
//         // =========================================

//         await reporter.save({ session });

//         // =========================================
//         // CREATE FINE LOG
//         // =========================================

//         await Fine.create(
//           [
//             {
//               userId: reporter._id,
//               amount: 15,
//               reason: `False fake report on verified pin ${pin._id}`,
//             },
//           ],
//           { session },
//         );
//       }

//       // =========================================
//       // PREVENT DUPLICATE PENALTY
//       // =========================================

//       pin.fakeReportersPenalized = true;
//     }

//     await pin.save({ session });

//     // =========================================
//     // REWARD BENEFICIARY
//     // =========================================

//     const updated_lavel = user.xp + travelXP;

//     await checkLevelUp(user, updated_lavel, session);

//     user.xp += travelXP;
//     user.credits += 2;

//     await updateLeaderboardXP(user._id, travelXP, session);

//     // ======================================
//     // TRUST SCORE INCREASE
//     // ======================================

//     user.trustScore = Math.min(
//       99.9,
//       Number((user.trustScore + 0.1).toFixed(1)),
//     );

//     // =========================================
//     // UPDATE LEVEL
//     // =========================================

//     // const levelData = getLevelData(user.xp);

//     // user.level = levelData.level;
//     // user.levelName = levelData.name;

//     await user.save({ session });

//     // =========================================
//     // FETCH VALIDATOR
//     // =========================================

//     const validatorUser = await User.findById(validation.validatedBy).select(
//       "name email xp level levelName credits trustScore",
//     );

//     // =========================================
//     // CREATE BENEFICIARY ACTIVITY LOG
//     // =========================================
//     console.log("active", activeBoosts);

//     await Activity.create(
//       [
//         {
//           userId: userId,

//           activityType: "pin_validated",

//           pinId: pin._id,

//           pinTitle: pin.description || "Pin Validation",

//           images: pin.images || [],

//           xpEarned: travelXP,

//           creditsSpent: 2,

//           distance: travelDistance,

//           activityLocation: {
//             latitude: pinLatitude,
//             longitude: pinLongitude,
//           },

//           startLocation: {
//             latitude: Number(currentLatitude),
//             longitude: Number(currentLongitude),
//           },

//           endLocation: {
//             latitude: pinLatitude,
//             longitude: pinLongitude,
//           },

//           status: "completed",
//         },
//       ],
//       { session },
//     );

//     // =========================================
//     // PREPARE NOTIFICATIONS
//     // =========================================

//     const pinCreator = await User.findById(pin.createdBy)
//       .select("fcmToken name")
//       .session(session);

//     const beneficiaryRewardNotification = {
//       tokens: user.fcmToken ? [user.fcmToken] : [],
//       title: "✅ Validation Successful",
//       // body: `You earned ${travelXP} XP and 2 Credits for supporting this validation.`,
//       body: `You travelled ${milesTravelled.toFixed(
//   2,
// )} miles and earned ${creditsEarned} Credits for validating this pin.`,
//       data: {
//         type: "PIN_VALIDATION_SUPPORT",
//         pinId: pin._id.toString(),
//         xp: travelXP,
//         credits: 2,
//       },
//     };

//     const creatorNotification = {
//       tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],
//       title: "📍 Pin Validation",
//       body: `${user.name} also validated your pin.`,
//       data: {
//         type: "PIN_VALIDATED_BY_USER",
//         pinId: pin._id.toString(),
//         validatorId: user._id.toString(),
//       },
//     };

//     // =========================================
//     // COMMIT
//     // =========================================

//     await session.commitTransaction();

//     await Promise.all([
//       sendNotification(beneficiaryRewardNotification),
//       sendNotification(creatorNotification),
//     ]);

//     // =========================================
//     // RESPONSE
//     // =========================================

//     return res.status(200).json({
//       success: true,

//       message: "You successfully joined this validation task.",

//       validator: validatorUser,

//       rewards: {
//         xpEarned: travelXP,
//         creditsEarned: 2,
//       },

//       pinData: {
//         pinScore: pin.pinScore,
//         pinStatus: pin.pinStatus,
//         status: pin.status,
//       },

//       distanceInfo: {
//         liveDistanceMeters: liveDistance.toFixed(2),

//         travelDistanceMeters: travelDistance.toFixed(2),
//       },
//       activeBoosts,
//       hexPartyActive,
//     });
//   } catch (error) {
//     await session.abortTransaction();

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

export const markPinAsGone = async (req, res) => {
  try {
    const { pinId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(pinId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pin ID",
      });
    }

    const pin = await Pin.findById(pinId);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // Already gone
    if (pin.isGone) {
      return res.status(400).json({
        success: false,
        message: "Pin is already marked as gone",
      });
    }

    pin.isGone = true;

    await pin.save();

    return res.status(200).json({
      success: true,
      message: "Pin marked as gone successfully",
      data: {
        pinId: pin._id,
        isGone: pin.isGone,
      },
    });
  } catch (error) {
    console.error("Mark pin as gone error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const validatePin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // =====================================================
    // 1. BASIC DATA
    // =====================================================

    const { pinId } = req.params;
    const userId = req.user.id;

    const { currentLatitude, currentLongitude } = req.body;

    // =====================================================
    // 2. GPS REQUIRED
    // =====================================================

    if (
      currentLatitude === undefined ||
      currentLongitude === undefined ||
      currentLatitude === null ||
      currentLongitude === null
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Current location is required",
      });
    }

    // =====================================================
    // 3. FIND USER
    // =====================================================

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // 4. FIND PIN
    // =====================================================

    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // =====================================================
    // 5. PREVENT CREATOR FROM VALIDATING OWN PIN
    // =====================================================

    if (pin.createdBy?.toString() === userId.toString()) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You cannot validate your own pin",
      });
    }

    // =====================================================
    // 6. LOCK CHECK
    // =====================================================

    if (
      pin.islocked === true &&
      pin.lockedBy?.toString() !== userId.toString()
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This Pin is locked",
        lockedBy: pin.lockedBy,
      });
    }

    // =====================================================
    // 7. ACTIVE BOOSTS
    // =====================================================

    const activeBoosts = await getActiveBoosts(userId);

    const hexPartyActive = await isHexPartyActive(pin.hexagonId);

    // =====================================================
    // 8. GOLDEN CARGO RESERVATION
    // =====================================================

    const reservedCargo = await GoldenCargo.findOne({
      pinId: pin._id,
      expiresAt: {
        $gt: new Date(),
      },
    }).session(session);

    if (
      reservedCargo &&
      reservedCargo.userId?.toString() !== userId.toString()
    ) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message: "This resource pin is reserved by another Golden Cargo user",
      });
    }

    // =====================================================
    // 9. RESOURCE PIN / GOLDEN CARGO CHECK
    // =====================================================

    let activeCargo = null;

    if (pin.category === "Resources (Zero-Waste, Upcycling & Utilities)") {
      activeCargo = await GoldenCargo.findOne({
        userId,
        expiresAt: {
          $gt: new Date(),
        },
      }).session(session);

      if (activeCargo) {
        let cargoHasPin = false;

        if (Array.isArray(activeCargo.pinId)) {
          cargoHasPin = activeCargo.pinId.some(
            (id) => id.toString() === pin._id.toString(),
          );

          if (!cargoHasPin) {
            if (activeCargo.pinId.length >= 3) {
              await session.abortTransaction();

              return res.status(400).json({
                success: false,
                message: "Golden Cargo can reserve maximum 3 resource pins",
              });
            }

            activeCargo.pinId.push(pin._id);

            await activeCargo.save({
              session,
            });

            pin.reservationExpiresAt = activeCargo.expiresAt;
          }
        } else if (activeCargo.pinId) {
          cargoHasPin = activeCargo.pinId.toString() === pin._id.toString();
        }
      }
    }

    // =====================================================
    // 10. VALIDATE PIN LOCATION
    // =====================================================

    if (!pin.location?.coordinates || pin.location.coordinates.length < 2) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Pin location is invalid",
      });
    }

    const pinLongitude = Number(pin.location.coordinates[0]);

    const pinLatitude = Number(pin.location.coordinates[1]);

    // =====================================================
    // 11. LIVE GPS DISTANCE
    // =====================================================

    const liveDistance = calculateDistanceInMeters(
      Number(currentLatitude),
      Number(currentLongitude),
      pinLatitude,
      pinLongitude,
    );

    if (liveDistance > VALIDATION_CONFIG.MAX_DISTANCE_METERS) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,

        message:
          `You must be within ` +
          `${VALIDATION_CONFIG.MAX_DISTANCE_METERS} meters ` +
          `of the pin location`,

        distance: `${liveDistance.toFixed(2)} meters`,
      });
    }

    // =====================================================
    // 12. FIND PENDING TRAVEL ACTIVITY
    // =====================================================

    const activity = await Activity.findOne({
      userId,
      pinId,
      status: "pending",
    })
      .sort({
        createdAt: -1,
      })
      .session(session);

    // =====================================================
    // 13. ACTIVITY / GOLDEN CARGO CHECK
    // =====================================================

    if (!activity) {
      const cargo = await GoldenCargo.findOne({
        userId,
        expiresAt: {
          $gt: new Date(),
        },
      }).session(session);

      let cargoHasPin = false;

      if (cargo) {
        if (Array.isArray(cargo.pinId)) {
          cargoHasPin = cargo.pinId.some(
            (id) => id.toString() === pin._id.toString(),
          );
        } else if (cargo.pinId) {
          cargoHasPin = cargo.pinId.toString() === pin._id.toString();
        }
      }

      const isReservedResourcePin =
        pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
        cargo &&
        cargoHasPin;

      if (!isReservedResourcePin) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message: "No pending activity found",
        });
      }
    }

    // =====================================================
    // 14. COMPLETE PENDING ACTIVITY SAFELY
    // =====================================================

    if (activity) {
      activity.status = "completed";

      await activity.save({
        session,
      });
    }

    // =====================================================
    // 15. TRAVEL DISTANCE
    // =====================================================

    const travelDistance = Number(activity?.distance || 0);

    // =====================================================
    // 16. TRAVEL XP
    // =====================================================

    const baseTravelXP = Math.max(1, Math.floor(travelDistance / 100));

    const travelXP = calculateXPWithBoosts({
      baseXP: baseTravelXP,

      doubleXP: activeBoosts.Double_XP,

      hexParty: hexPartyActive,
    });

    // =====================================================
    // 17. 5 CREDITS PER MILE
    // =====================================================

    const METERS_PER_MILE = 1609.344;

    const milesTravelled = travelDistance / METERS_PER_MILE;

    const creditsEarned = Number((milesTravelled * 5).toFixed(2));

    // =====================================================
    // 18. FIND VALIDATION
    // =====================================================

    let validation = await Validation.findOne({
      pinID: pinId,
    }).session(session);
    // =====================================================
    // NORMAL MODE CONSENSUS IS FINAL
    // =====================================================

    if (
      pin.activePinMode !== "vanguard" &&
      validation?.consensusStatus === "VERIFIED"
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This pin has already been verified.",
      });
    }

    if (
      pin.activePinMode !== "vanguard" &&
      validation?.consensusStatus === "FAKE"
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This pin has already been marked as fake.",
      });
    }

    // =====================================================
    // 19. VALIDATION EXPIRY
    // =====================================================

    if (validation?.expiresAt && new Date() > new Date(validation.expiresAt)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Validation window expired",
      });
    }

    // =====================================================
    // 20. PREVENT DUPLICATE VOTE
    // =====================================================

    if (validation) {
      const alreadyVoted = validation.votes?.some(
        (vote) => vote.userId?.toString() === userId.toString(),
      );

      if (alreadyVoted) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "You already voted on this pin",
        });
      }

      // -----------------------------------------------
      // Backward compatibility
      // -----------------------------------------------

      if (validation.validatedBy?.toString() === userId.toString()) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "You already validated this pin",
        });
      }

      const alreadyBeneficiary = validation.beneficiaries?.some(
        (id) => id.toString() === userId.toString(),
      );

      if (alreadyBeneficiary) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "You already validated this pin",
        });
      }
    }

    // =====================================================
    // 21. USER'S WEIGHT
    // =====================================================

    const voteWeight = getValidationWeight(user);

    // =====================================================
    // 22. VOTE SNAPSHOT
    // =====================================================

    const voteData = {
      userId: user._id,

      vote: "VALID",

      weight: voteWeight,

      // Snapshot BEFORE trust reward
      trustScore: Number(user.trustScore || 0),

      level: Number(user.level || 1),

      levelName: user.levelName || null,

      location: {
        latitude: Number(currentLatitude),

        longitude: Number(currentLongitude),
      },

      distanceMeters: Number(liveDistance),

      xpEarned: travelXP,

      creditsEarned,
    };

    // =====================================================
    // 23. FIRST OR SUPPORTING VALIDATOR
    // =====================================================

    const isFirstValidator = !validation;

    if (!validation) {
      validation = new Validation({
        pinID: pinId,

        // Backward compatibility
        validatedBy: userId,

        beneficiaries: [],

        status: "orange",

        // Source of truth
        votes: [voteData],

        validWeight: voteWeight,

        fakeWeight: 0,

        validVotes: 1,

        fakeVotes: 0,

        confidenceScore: voteWeight,

        consensusStatus: "PENDING",
      });

      pin.validatedBy = userId;

      pin.status = "orange";
    } else {
      // ===================================================
      // MULTIPLE VALIDATOR
      // ===================================================

      if (!Array.isArray(validation.votes)) {
        validation.votes = [];
      }

      validation.votes.push(voteData);

      // -----------------------------------------------
      // Keep legacy beneficiaries
      // -----------------------------------------------

      if (!validation.beneficiaries) {
        validation.beneficiaries = [];
      }

      validation.beneficiaries.push(userId);

      if (!pin.beneficiaries) {
        pin.beneficiaries = [];
      }

      const existsInPin = pin.beneficiaries.some(
        (id) => id.toString() === userId.toString(),
      );

      if (!existsInPin) {
        pin.beneficiaries.push(userId);
      }
    }

    // =====================================================
    // 24. RECALCULATE CONSENSUS
    // =====================================================

    const validVotes = validation.votes.filter((vote) => vote.vote === "VALID");

    const fakeVotes = validation.votes.filter((vote) => vote.vote === "FAKE");

    validation.validWeight = validVotes.reduce(
      (total, vote) => total + Number(vote.weight || 0),
      0,
    );

    validation.fakeWeight = fakeVotes.reduce(
      (total, vote) => total + Number(vote.weight || 0),
      0,
    );

    validation.validVotes = validVotes.length;

    validation.fakeVotes = fakeVotes.length;

    validation.confidenceScore = validation.validWeight - validation.fakeWeight;

    // =====================================================
    // 25. SYNC PIN SCORE
    // =====================================================

    pin.pinScore = validation.confidenceScore;

    // =====================================================
    // NORMAL PIN VERIFIED CONSENSUS
    // =====================================================

    if (
      pin.activePinMode !== "vanguard" &&
      validation.consensusStatus === "PENDING" &&
      validation.confidenceScore >= VALIDATION_CONFIG.VERIFIED_SCORE
    ) {
      validation.consensusStatus = "VERIFIED";

      validation.consensusReachedAt = new Date();

      validation.status = "green";

      pin.pinStatus = "verified";
    }

    // =====================================================
    // 26. PREPARE NOTIFICATION VARIABLES
    // =====================================================

    let pinVerifiedNotification = null;

    let creatorLevelUpNotification = null;

    let validatorLevelUpNotification = null;

    // =====================================================
    // 27. CHECK IF PIN JUST BECAME VERIFIED
    // =====================================================

    const becameVerified =
      validation.consensusStatus !== "VERIFIED" &&
      validation.confidenceScore >= VALIDATION_CONFIG.VERIFIED_SCORE;

    if (becameVerified) {
      // ===================================================
      // MARK VERIFIED
      // ===================================================

      validation.consensusStatus = "VERIFIED";

      validation.consensusReachedAt = new Date();

      validation.status = "green";

      pin.pinStatus = "verified";

      pin.status = "green";

      // ===================================================
      // REWARD PIN CREATOR
      // ===================================================

      const pinCreator = await User.findById(pin.createdBy).session(session);

      if (pinCreator) {
        const creatorOldLevel = Number(pinCreator.level || 1);

        // -----------------------------------------------
        // Creator XP
        // -----------------------------------------------

        pinCreator.xp =
          Number(pinCreator.xp || 0) +
          Number(VALIDATION_CONFIG.CREATOR_VERIFIED_XP ?? 15);

        // -----------------------------------------------
        // Creator trust
        // -----------------------------------------------

        pinCreator.trustScore = Math.min(
          99.9,

          Number(
            (
              Number(pinCreator.trustScore || 0) +
              Number(VALIDATION_CONFIG.CREATOR_TRUST_REWARD ?? 0.5)
            ).toFixed(1),
          ),
        );

        // -----------------------------------------------
        // Recalculate creator level
        // -----------------------------------------------

        const creatorLevelData = getLevelData(pinCreator.xp);

        pinCreator.level = creatorLevelData.level;

        pinCreator.levelName = creatorLevelData.name;

        const oldCartographerRank =
          pinCreator.skillTrees?.cartographer?.rank || "Unranked";

        if (!pinCreator.skillTrees) {
          pinCreator.skillTrees = {};
        }

        if (!pinCreator.skillTrees.cartographer) {
          pinCreator.skillTrees.cartographer = {
            verifiedPins: 0,
            rank: "Unranked",
            emoji: "",
            level: 1,
          };
        }

        // Pin actually VERIFIED hua hai
        pinCreator.skillTrees.cartographer.verifiedPins =
          Number(pinCreator.skillTrees.cartographer.verifiedPins || 0) + 1;

        const cartographerData = getSkillRank(
          pinCreator.skillTrees.cartographer.verifiedPins,
          CARTOGRAPHER_RANKS,
        );

        pinCreator.skillTrees.cartographer.rank = cartographerData.name;
        pinCreator.skillTrees.cartographer.emoji = cartographerData.emoji;
        pinCreator.skillTrees.cartographer.level = cartographerData.level;

        pinCreator.markModified("skillTrees");

        const cartographerRankChanged =
          oldCartographerRank !== cartographerData.name;

        if (cartographerRankChanged) {
          const title = `${cartographerData.emoji} Cartographer Rank Unlocked!`;

          const body =
            `Congratulations! You are now ${cartographerData.name} ` +
            `after reaching ${pinCreator.skillTrees.cartographer.verifiedPins} verified pins.`;

          await Notification.create(
            [
              {
                title,
                description: body,
                notificationType: "private",
                receivers: [pinCreator._id],
                senderRole: "system",
              },
            ],
            { session },
          );
        }

        // -----------------------------------------------
        // Creator level-up notification
        // -----------------------------------------------

        if (Number(creatorLevelData.level) > creatorOldLevel) {
          const creatorLevelMessage = getLevelUpNotification({
            level: creatorLevelData.level,

            levelName: creatorLevelData.name,

            emoji: creatorLevelData.emoji || "",
          });

          creatorLevelUpNotification = {
            tokens: pinCreator.fcmToken ? [pinCreator.fcmToken] : [],

            title: creatorLevelMessage.title,

            body: creatorLevelMessage.body,

            data: {
              type: "LEVEL_UP",

              level: String(creatorLevelData.level),

              levelName: String(creatorLevelData.name || ""),

              emoji: String(creatorLevelData.emoji || ""),
            },
          };

          // Save DB notification
          await Notification.create(
            [
              {
                title: creatorLevelMessage.title,

                description: creatorLevelMessage.body,

                notificationType: "private",

                receivers: [pinCreator._id],

                senderRole: "system",
              },
            ],
            {
              session,
            },
          );
        }

        await pinCreator.save({
          session,
        });

        // -----------------------------------------------
        // Pin verified notification
        // -----------------------------------------------

        pinVerifiedNotification = {
          tokens: pinCreator.fcmToken ? [pinCreator.fcmToken] : [],

          title: "🎉 Pin Verified",

          body:
            `Congratulations! Your pin has been verified. ` +
            `You earned ${VALIDATION_CONFIG.CREATOR_VERIFIED_XP ?? 15} XP.`,

          data: {
            type: "PIN_VERIFIED",

            pinId: pin._id.toString(),

            xp: String(VALIDATION_CONFIG.CREATOR_VERIFIED_XP ?? 15),
          },
        };
      }
    }

    // =====================================================
    // 28. PENALIZE FALSE FAKE REPORTERS
    //
    // IMPORTANT:
    // Only after VALID consensus wins.
    // =====================================================

    if (
      validation.consensusStatus === "VERIFIED" &&
      pin.fakereportingBy?.length > 0 &&
      !pin.fakeReportersPenalized
    ) {
      const fakeReporters = await User.find({
        _id: {
          $in: pin.fakereportingBy,
        },
      }).session(session);

      for (const reporter of fakeReporters) {
        const penalty = Number(
          VALIDATION_CONFIG.FAKE_CREATOR_TRUST_PENALTY ?? 15,
        );

        reporter.trustScore = Math.max(
          0,

          Number((Number(reporter.trustScore || 0) - penalty).toFixed(1)),
        );

        // -----------------------------------------------
        // Current ban / shadowban rule
        // -----------------------------------------------

        if (
          reporter.trustScore <
          Number(VALIDATION_CONFIG.SHADOWBAN_TRUST_THRESHOLD ?? 40)
        ) {
          reporter.status = "banned";
        }

        await reporter.save({
          session,
        });

        await Fine.create(
          [
            {
              userId: reporter._id,

              amount: penalty,

              reason: `False fake report on verified pin ${pin._id}`,
            },
          ],
          {
            session,
          },
        );
      }

      pin.fakeReportersPenalized = true;
    }

    // =====================================================
    // 29. VALIDATOR REWARD + LEVEL UP
    // =====================================================

    const oldLevel = Number(user.level || 1);

    const updatedXP = Number(user.xp || 0) + Number(travelXP || 0);

    /*
     * Keep your existing helper because it may contain
     * other level-related logic.
     */

    await checkLevelUp(user, updatedXP, session);

    // -----------------------------------------------
    // Add XP
    // -----------------------------------------------

    user.xp = updatedXP;

    // -----------------------------------------------
    // 5 credits / mile
    // -----------------------------------------------

    user.credits = Number(user.credits || 0) + Number(creditsEarned || 0);

    // -----------------------------------------------
    // Leaderboard
    // -----------------------------------------------

    await updateLeaderboardXP(user._id, travelXP, session);

    // -----------------------------------------------
    // Trust reward
    // -----------------------------------------------

    user.trustScore = Math.min(
      99.9,

      Number((Number(user.trustScore || 0) + 0.1).toFixed(1)),
    );

    // =====================================================
    // 30. FINAL LEVEL
    // =====================================================

    const levelData = getLevelData(user.xp);

    user.level = levelData.level;

    user.levelName = levelData.name;

    // =====================================================
    // 31. VALIDATOR LEVEL-UP NOTIFICATION
    // =====================================================

    if (Number(levelData.level) > oldLevel) {
      const levelMessage = getLevelUpNotification({
        level: levelData.level,

        levelName: levelData.name,

        emoji: levelData.emoji || "",
      });

      validatorLevelUpNotification = {
        tokens: user.fcmToken ? [user.fcmToken] : [],

        title: levelMessage.title,

        body: levelMessage.body,

        data: {
          type: "LEVEL_UP",

          level: String(levelData.level),

          levelName: String(levelData.name || ""),

          emoji: String(levelData.emoji || ""),
        },
      };

      // -----------------------------------------------
      // Save level-up notification in DB
      // -----------------------------------------------

      await Notification.create(
        [
          {
            title: levelMessage.title,

            description: levelMessage.body,

            notificationType: "private",

            receivers: [user._id],

            senderRole: "system",
          },
        ],
        {
          session,
        },
      );
    }

    await user.save({
      session,
    });

    // =====================================================
    // 32. UPDATE USER STATS
    // =====================================================

    let userStats = await States.findOne({
      user: userId,
    }).session(session);

    if (!userStats) {
      userStats = new States({
        user: userId,

        pinsValidated: 1,
      });
    } else {
      userStats.pinsValidated = Number(userStats.pinsValidated || 0) + 1;
    }

    await userStats.save({
      session,
    });

    // =====================================================
    // 33. SAVE VALIDATION + PIN
    // =====================================================

    await validation.save({
      session,
    });

    await pin.save({
      session,
    });

    // =====================================================
    // 34. ACTIVITY LOG
    // =====================================================

    await Activity.create(
      [
        {
          userId,

          activityType: "pin_validated",

          pinId: pin._id,

          pinTitle: pin.description || "Pin Validation",

          images: pin.images || [],

          xpEarned: travelXP,

          /*
           * Your current Activity schema uses
           * creditsSpent.
           *
           * Validation is earning credits, so ideally
           * add creditsEarned to Activity schema.
           */

          creditsSpent: 0,

          distance: travelDistance,

          activityLocation: {
            latitude: pinLatitude,

            longitude: pinLongitude,
          },

          startLocation: {
            latitude: Number(currentLatitude),

            longitude: Number(currentLongitude),
          },

          endLocation: {
            latitude: pinLatitude,

            longitude: pinLongitude,
          },

          status: "completed",
        },
      ],
      {
        session,
      },
    );

    // =====================================================
    // 35. PIN CREATOR
    // =====================================================

    const pinCreator = await User.findById(pin.createdBy)
      .select("fcmToken name")
      .session(session);

    // =====================================================
    // 36. VALIDATOR REWARD NOTIFICATION
    // =====================================================

    const validatorRewardNotification = {
      tokens: user.fcmToken ? [user.fcmToken] : [],

      title: "✅ Pin Validated",

      body:
        `You travelled ${milesTravelled.toFixed(2)} miles and earned ` +
        `${travelXP} XP and ${creditsEarned} Credits.`,

      data: {
        type: "PIN_VALIDATED",

        pinId: pin._id.toString(),

        xp: String(travelXP),

        credits: String(creditsEarned),

        milesTravelled: String(Number(milesTravelled.toFixed(2))),

        voteWeight: String(voteWeight),

        confidenceScore: String(validation.confidenceScore),
      },
    };

    // =====================================================
    // 37. CREATOR NOTIFICATION
    // =====================================================

    const creatorNotification = {
      tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],

      title: "📍 Pin Validation",

      body: `${user.name} validated your pin.`,

      data: {
        type: "PIN_VALIDATED_BY_USER",

        pinId: pin._id.toString(),

        validatorId: user._id.toString(),

        voteWeight: String(voteWeight),

        confidenceScore: String(validation.confidenceScore),
      },
    };

    // =====================================================
    // 38. STORE VALIDATOR REWARD NOTIFICATION
    // =====================================================

    await Notification.create(
      [
        {
          title: validatorRewardNotification.title,

          description: validatorRewardNotification.body,

          notificationType: "private",

          receivers: [user._id],

          senderRole: "system",
        },
      ],
      {
        session,
      },
    );

    // =====================================================
    // 39. STORE CREATOR NOTIFICATION
    // =====================================================

    if (pinCreator) {
      await Notification.create(
        [
          {
            title: creatorNotification.title,

            description: creatorNotification.body,

            notificationType: "private",

            receivers: [pinCreator._id],

            senderRole: "system",
          },
        ],
        {
          session,
        },
      );
    }

    // =====================================================
    // 40. COMMIT
    // =====================================================

    await session.commitTransaction();

    // =====================================================
    // 41. PUSH NOTIFICATIONS AFTER COMMIT
    // =====================================================

    const notifications = [];

    // Validator reward
    if (validatorRewardNotification?.tokens?.length) {
      notifications.push(sendNotification(validatorRewardNotification));
    }

    // Creator validation
    if (creatorNotification?.tokens?.length) {
      notifications.push(sendNotification(creatorNotification));
    }

    // Pin verified
    if (pinVerifiedNotification?.tokens?.length) {
      notifications.push(sendNotification(pinVerifiedNotification));
    }

    // Validator level up
    if (validatorLevelUpNotification?.tokens?.length) {
      notifications.push(sendNotification(validatorLevelUpNotification));
    }

    // Creator level up
    if (creatorLevelUpNotification?.tokens?.length) {
      notifications.push(sendNotification(creatorLevelUpNotification));
    }

    /*
     * Important:
     * DB transaction already committed.
     * Push notification failure should NOT
     * make validation API fail.
     */

    await Promise.allSettled(notifications);

    // =====================================================
    // 42. RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message: becameVerified
        ? "Pin validated and verified successfully"
        : "Pin validated successfully",

      validatorType: isFirstValidator ? "PRIMARY" : "SUPPORTING",

      vote: {
        userId: user._id,

        type: "VALID",

        weight: voteWeight,

        /*
         * Snapshot used for vote was before
         * the +0.1 reward.
         */
        trustScore: user.trustScore,

        level: user.level,

        levelName: user.levelName,
      },

      consensus: {
        validWeight: validation.validWeight,

        fakeWeight: validation.fakeWeight,

        validVotes: validation.validVotes,

        fakeVotes: validation.fakeVotes,

        confidenceScore: validation.confidenceScore,

        verifiedThreshold: VALIDATION_CONFIG.VERIFIED_SCORE,

        fakeThreshold: VALIDATION_CONFIG.FAKE_SCORE,

        status: validation.consensusStatus,
      },

      rewards: {
        distanceMeters: travelDistance,

        milesTravelled: Number(milesTravelled.toFixed(2)),

        baseXP: baseTravelXP,

        xpEarned: travelXP,

        creditsEarned,

        creditRate: "5 credits per mile",

        trustScoreEarned: 0.1,
      },

      levelUp:
        Number(user.level) > oldLevel
          ? {
              previousLevel: oldLevel,

              newLevel: user.level,

              levelName: user.levelName,

              emoji: levelData.emoji || "",
            }
          : null,

      pinData: {
        pinScore: pin.pinScore,

        pinStatus: pin.pinStatus,

        status: pin.status,
      },

      distanceInfo: {
        liveDistanceMeters: Number(liveDistance.toFixed(2)),

        travelDistanceMeters: Number(travelDistance.toFixed(2)),

        travelDistanceMiles: Number(milesTravelled.toFixed(2)),
      },

      activeBoosts,

      hexPartyActive,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("validatePin error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to validate pin",
    });
  } finally {
    await session.endSession();
  }
};

export const fakePin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // =====================================================
    // 1. BASIC DATA
    // =====================================================

    const userId = req.user.id;
    const { pinId } = req.params;

    const { currentLatitude, currentLongitude } = req.body;

    // =====================================================
    // 2. GPS REQUIRED
    // =====================================================

    if (
      currentLatitude === undefined ||
      currentLongitude === undefined ||
      currentLatitude === null ||
      currentLongitude === null
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Current location is required",
      });
    }

    // =====================================================
    // 3. FIND USER
    // =====================================================

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // 4. FIND PIN
    // =====================================================

    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // =====================================================
    // 5. PREVENT CREATOR FROM REPORTING OWN PIN
    // =====================================================

    if (pin.createdBy?.toString() === userId.toString()) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You cannot report your own pin as fake",
      });
    }

    // =====================================================
    // 6. PIN LOCK CHECK
    // =====================================================

    if (
      pin.islocked === true &&
      pin.lockedBy?.toString() !== userId.toString()
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This Pin is locked",
        lockedBy: pin.lockedBy,
      });
    }

    // =====================================================
    // 7. ACTIVE BOOSTS
    // =====================================================

    const activeBoosts = await getActiveBoosts(userId);

    const hexPartyActive = await isHexPartyActive(pin.hexagonId);

    // =====================================================
    // 8. GOLDEN CARGO RESERVATION CHECK
    // =====================================================

    const reservedCargo = await GoldenCargo.findOne({
      pinId: pin._id,

      expiresAt: {
        $gt: new Date(),
      },
    }).session(session);

    if (
      reservedCargo &&
      reservedCargo.userId?.toString() !== userId.toString()
    ) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,

        message: "This resource pin is reserved by another Golden Cargo user",
      });
    }

    // =====================================================
    // 9. PIN LOCATION CHECK
    // =====================================================

    if (!pin.location?.coordinates || pin.location.coordinates.length < 2) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Pin location is invalid",
      });
    }

    const pinLongitude = Number(pin.location.coordinates[0]);

    const pinLatitude = Number(pin.location.coordinates[1]);

    // =====================================================
    // 10. LIVE GPS DISTANCE
    // =====================================================

    const liveDistance = calculateDistanceInMeters(
      Number(currentLatitude),
      Number(currentLongitude),
      pinLatitude,
      pinLongitude,
    );

    if (liveDistance > VALIDATION_CONFIG.MAX_DISTANCE_METERS) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,

        message:
          `You must be within ` +
          `${VALIDATION_CONFIG.MAX_DISTANCE_METERS} meters ` +
          `of the pin location`,

        distance: `${liveDistance.toFixed(2)} meters`,
      });
    }

    // =====================================================
    // 11. FIND PENDING ACTIVITY
    // =====================================================

    const activity = await Activity.findOne({
      userId,
      pinId,
      status: "pending",
    })
      .sort({
        createdAt: -1,
      })
      .session(session);

    // =====================================================
    // 12. ACTIVITY / GOLDEN CARGO EXCEPTION
    // =====================================================

    if (!activity) {
      const activeCargo = await GoldenCargo.findOne({
        userId,

        expiresAt: {
          $gt: new Date(),
        },
      }).session(session);

      let cargoHasPin = false;

      if (activeCargo) {
        if (Array.isArray(activeCargo.pinId)) {
          cargoHasPin = activeCargo.pinId.some(
            (id) => id.toString() === pin._id.toString(),
          );
        } else if (activeCargo.pinId) {
          cargoHasPin = activeCargo.pinId.toString() === pin._id.toString();
        }
      }

      const isReservedResourcePin =
        pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
        activeCargo &&
        cargoHasPin;

      if (!isReservedResourcePin) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message: "No pending activity found",
        });
      }
    }

    // =====================================================
    // 13. FIND VALIDATION
    //
    // IMPORTANT:
    // Do this before completing activity so duplicate
    // vote doesn't consume user's pending activity.
    // =====================================================

    let validation = await Validation.findOne({
      pinID: pinId,
    }).session(session);

    // =====================================================
    // 14. VALIDATION EXPIRY
    // =====================================================

    if (validation?.expiresAt && new Date() > new Date(validation.expiresAt)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Validation window expired",
      });
    }

    // =====================================================
    // 15. PREVENT DUPLICATE VOTE
    //
    // User cannot:
    // VALID -> FAKE
    // FAKE  -> VALID
    // FAKE  -> FAKE
    // VALID -> VALID
    // =====================================================

    if (validation) {
      const alreadyVoted = validation.votes?.some(
        (vote) => vote.userId?.toString() === userId.toString(),
      );

      if (alreadyVoted) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "You already voted on this pin",
        });
      }

      // -----------------------------------------------
      // Backward compatibility
      // -----------------------------------------------

      if (validation.validatedBy?.toString() === userId.toString()) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "You already voted on this pin",
        });
      }

      const alreadyBeneficiary = validation.beneficiaries?.some(
        (id) => id.toString() === userId.toString(),
      );

      if (alreadyBeneficiary) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "You already voted on this pin",
        });
      }
    }

    // =====================================================
    // 16. OLD FAKE REPORT DUPLICATE CHECK
    // =====================================================

    const alreadyReported = pin.fakereportingBy?.some(
      (id) => id.toString() === userId.toString(),
    );

    if (alreadyReported) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You already reported this pin",
      });
    }

    // =====================================================
    // 17. COMPLETE TRAVEL ACTIVITY
    // =====================================================

    if (activity) {
      activity.status = "completed";

      await activity.save({
        session,
      });
    }

    // =====================================================
    // 18. TRAVEL DISTANCE
    // =====================================================

    const travelDistance = Number(activity?.distance || 0);

    // =====================================================
    // 19. TRAVEL XP
    // =====================================================

    const baseTravelXP = Math.max(1, Math.floor(travelDistance / 100));

    const travelXP = calculateXPWithBoosts({
      baseXP: baseTravelXP,

      doubleXP: activeBoosts.Double_XP,

      hexParty: hexPartyActive,
    });

    // =====================================================
    // 20. 5 CREDITS PER MILE
    // =====================================================

    const METERS_PER_MILE = 1609.344;

    const milesTravelled = travelDistance / METERS_PER_MILE;

    const creditsEarned = Number((milesTravelled * 5).toFixed(2));

    // =====================================================
    // 21. GET WEIGHT
    // =====================================================

    const voteWeight = getValidationWeight(user);

    // =====================================================
    // 22. CREATE FAKE VOTE SNAPSHOT
    // =====================================================

    const fakeVote = {
      userId: user._id,

      vote: "FAKE",

      weight: voteWeight,

      // Snapshot before reward
      trustScore: Number(user.trustScore || 0),

      level: Number(user.level || 1),

      levelName: user.levelName || null,

      location: {
        latitude: Number(currentLatitude),

        longitude: Number(currentLongitude),
      },

      distanceMeters: Number(liveDistance),

      xpEarned: travelXP,

      creditsEarned,
    };

    // =====================================================
    // 23. CREATE VALIDATION OR ADD FAKE VOTE
    // =====================================================

    if (!validation) {
      validation = new Validation({
        pinID: pinId,

        beneficiaries: [],

        status: "orange",

        votes: [fakeVote],

        validWeight: 0,

        fakeWeight: voteWeight,

        validVotes: 0,

        fakeVotes: 1,

        confidenceScore: -voteWeight,

        consensusStatus: "PENDING",
      });
    } else {
      if (!Array.isArray(validation.votes)) {
        validation.votes = [];
      }

      validation.votes.push(fakeVote);
    }

    // =====================================================
    // 24. KEEP LEGACY FAKE REPORT ARRAY
    // =====================================================

    if (!pin.fakereportingBy) {
      pin.fakereportingBy = [];
    }

    pin.fakereportingBy.push(userId);

    // =====================================================
    // 25. RECALCULATE CONSENSUS
    // =====================================================

    const validVotes = validation.votes.filter((vote) => vote.vote === "VALID");

    const fakeVotes = validation.votes.filter((vote) => vote.vote === "FAKE");

    validation.validWeight = validVotes.reduce(
      (total, vote) => total + Number(vote.weight || 0),
      0,
    );

    validation.fakeWeight = fakeVotes.reduce(
      (total, vote) => total + Number(vote.weight || 0),
      0,
    );

    validation.validVotes = validVotes.length;

    validation.fakeVotes = fakeVotes.length;

    // =====================================================
    // 26. FINAL SCORE
    //
    // VALID weight - FAKE weight
    // =====================================================

    validation.confidenceScore = validation.validWeight - validation.fakeWeight;

    // =====================================================
    // 27. PIN SCORE IS ONLY CACHE
    // =====================================================

    pin.pinScore = validation.confidenceScore;

    // =====================================================
    // 28. MODE
    // =====================================================

    const isVanguard = pin.activePinMode === "vanguard";

    let pinDeleted = false;
    let becameFake = false;

    // =====================================================
    // 29. FIND CREATOR
    // =====================================================

    const creatorForNotification = await User.findById(pin.createdBy).session(
      session,
    );

    // =====================================================
    // 30. VANGUARD MODE
    //
    // Existing business rule:
    // 3 different FAKE votes -> delete Vanguard pin
    // =====================================================

    if (isVanguard) {
      pin.vanguardFakeReports = validation.fakeVotes;

      if (validation.fakeVotes >= 3) {
        validation.consensusStatus = "FAKE";

        validation.consensusReachedAt = new Date();

        becameFake = true;

        // =================================================
        // CREATOR PENALTY ONLY ONCE
        // =================================================

        if (!pin.creatorPenalized && creatorForNotification) {
          const creator = creatorForNotification;

          const penalty = Number(
            VALIDATION_CONFIG.FAKE_CREATOR_TRUST_PENALTY ?? 15,
          );

          creator.trustScore = Math.max(
            0,

            Number((Number(creator.trustScore || 0) - penalty).toFixed(1)),
          );

          // ---------------------------------------------
          // Ban / ShadowBan threshold
          // ---------------------------------------------

          if (
            creator.trustScore <
            Number(VALIDATION_CONFIG.SHADOWBAN_TRUST_THRESHOLD ?? 40)
          ) {
            /*
             * If you add:
             *
             * creator.isShadowBanned = true;
             *
             * use that instead.
             */

            creator.status = "banned";
          }

          // ---------------------------------------------
          // Remove instant Vanguard XP
          // ---------------------------------------------

          const instantXP = Number(pin.xpScore || 0);

          creator.xp = Math.max(
            0,

            Number(creator.xp || 0) - instantXP,
          );

          // ---------------------------------------------
          // Recalculate creator level
          // ---------------------------------------------

          const creatorLevelData = getLevelData(creator.xp);

          creator.level = creatorLevelData.level;

          creator.levelName = creatorLevelData.name;

          await creator.save({
            session,
          });

          // ---------------------------------------------
          // Fine
          // ---------------------------------------------

          await Fine.create(
            [
              {
                userId: creator._id,

                amount: penalty,

                reason: `Vanguard pin ${pin._id} deleted after 3 fake votes`,
              },
            ],
            {
              session,
            },
          );

          pin.creatorPenalized = true;
        }
      }
    } else {
      // ===================================================
      // 31. NORMAL MODE WEIGHTED FAKE CONSENSUS
      // ===================================================

      // if (
      //   validation.confidenceScore <=
      //     VALIDATION_CONFIG.FAKE_SCORE &&
      //   validation.consensusStatus !==
      //     "FAKE"
      // ) {
      //   validation.consensusStatus =
      //     "FAKE";

      //   validation.consensusReachedAt =
      //     new Date();

      //   /*
      //    * Your Validation.status currently supports
      //    * red/orange/green.
      //    *
      //    * So actual fake state is:
      //    *
      //    * consensusStatus = FAKE
      //    * pin.pinStatus = fake
      //    */

      //   validation.status =
      //     "orange";

      //   pin.pinStatus =
      //     "fake";

      //   becameFake =
      //     true;
      // }

      // =====================================================
      // DELETE / SAVE PIN
      // =====================================================

      const shouldDeleteVanguardPin = isVanguard && validation.fakeVotes >= 3;

      const shouldDeleteNormalFakePin =
        !isVanguard &&
        validation.consensusStatus === "FAKE" &&
        validation.confidenceScore <= VALIDATION_CONFIG.FAKE_SCORE;

      // =====================================================
      // DELETE PIN
      // =====================================================

      if (shouldDeleteVanguardPin || shouldDeleteNormalFakePin) {
        /*
         * Save Validation first so voting/audit history
         * remains available.
         */
        await validation.save({
          session,
        });

        await Pin.findByIdAndDelete(pin._id, {
          session,
        });

        pinDeleted = true;
      } else {
        await pin.save({
          session,
        });
      }

      // ===================================================
      // 32. PENALIZE CREATOR ONLY AFTER FAKE CONSENSUS
      // ===================================================

      if (
        validation.consensusStatus === "FAKE" &&
        !pin.creatorPenalized &&
        creatorForNotification
      ) {
        const creator = creatorForNotification;

        const penalty = Number(
          VALIDATION_CONFIG.FAKE_CREATOR_TRUST_PENALTY ?? 15,
        );

        creator.trustScore = Math.max(
          0,

          Number((Number(creator.trustScore || 0) - penalty).toFixed(1)),
        );

        if (
          creator.trustScore <
          Number(VALIDATION_CONFIG.SHADOWBAN_TRUST_THRESHOLD ?? 40)
        ) {
          creator.status = "banned";
        }

        await creator.save({
          session,
        });

        await Fine.create(
          [
            {
              userId: creator._id,

              amount: penalty,

              reason: `Pin ${pin._id} reached weighted fake consensus`,
            },
          ],
          {
            session,
          },
        );

        pin.creatorPenalized = true;
      }
    }

    // =====================================================
    // 33. REPORTER REWARD
    // =====================================================

    const oldLevel = Number(user.level || 1);

    const updatedXP = Number(user.xp || 0) + Number(travelXP || 0);

    // Keep existing helper
    await checkLevelUp(user, updatedXP, session);

    // =====================================================
    // 34. ADD XP
    // =====================================================

    user.xp = updatedXP;

    // =====================================================
    // 35. 5 CREDITS PER MILE
    // =====================================================

    user.credits = Number(user.credits || 0) + Number(creditsEarned || 0);

    // =====================================================
    // 36. LEADERBOARD
    // =====================================================

    await updateLeaderboardXP(user._id, travelXP, session);

    // =====================================================
    // 37. TRUST SCORE
    // =====================================================

    user.trustScore = Math.min(
      99.9,

      Number((Number(user.trustScore || 0) + 0.1).toFixed(1)),
    );

    // =====================================================
    // 38. RECALCULATE REPORTER LEVEL
    // =====================================================

    const levelData = getLevelData(user.xp);

    user.level = levelData.level;

    user.levelName = levelData.name;

    // =====================================================
    // 39. LEVEL-UP NOTIFICATION
    // =====================================================

    let levelUpNotification = null;

    if (Number(levelData.level) > oldLevel) {
      const levelMessage = getLevelUpNotification({
        level: levelData.level,

        levelName: levelData.name,

        emoji: levelData.emoji || "",
      });

      levelUpNotification = {
        tokens: user.fcmToken ? [user.fcmToken] : [],

        title: levelMessage.title,

        body: levelMessage.body,

        data: {
          type: "LEVEL_UP",

          level: String(levelData.level),

          levelName: String(levelData.name || ""),

          emoji: String(levelData.emoji || ""),
        },
      };

      // ---------------------------------------------
      // Store level-up notification
      // ---------------------------------------------

      await Notification.create(
        [
          {
            title: levelMessage.title,

            description: levelMessage.body,

            notificationType: "private",

            receivers: [user._id],

            senderRole: "system",
          },
        ],
        {
          session,
        },
      );
    }

    // =====================================================
    // 40. SAVE REPORTER
    // =====================================================

    await user.save({
      session,
    });

    // =====================================================
    // 41. USER STATS
    // =====================================================

    let userStats = await States.findOne({
      user: userId,
    }).session(session);

    if (!userStats) {
      userStats = new States({
        user: userId,

        /*
         * If you have pinsReportedFake in your
         * States schema, use it.
         *
         * Otherwise remove this field.
         */

        pinsReportedFake: 1,
      });
    } else {
      userStats.pinsReportedFake = Number(userStats.pinsReportedFake || 0) + 1;
    }

    await userStats.save({
      session,
    });

    // =====================================================
    // 42. SAVE VALIDATION
    //
    // VERY IMPORTANT:
    // votes[] must be persisted.
    // =====================================================

    await validation.save({
      session,
    });

    // =====================================================
    // 43. SAVE OR DELETE PIN
    // =====================================================

    if (isVanguard && validation.fakeVotes >= 3) {
      /*
       * Validation has already been saved above.
       * So fake-vote history remains available.
       */

      await Pin.findByIdAndDelete(pin._id, {
        session,
      });

      pinDeleted = true;
    } else {
      await pin.save({
        session,
      });
    }

    // =====================================================
    // 44. CREATE FAKE REPORT ACTIVITY
    // =====================================================

    await Activity.create(
      [
        {
          userId: userId,

          /*
           * If your Activity schema has
           * pin_reported_fake, prefer that.
           *
           * Otherwise keep pin_validated.
           */

          activityType: "pin_validated",

          pinId: pin._id,

          pinTitle: pin.description || "Fake Pin Report",

          images: pin.images || [],

          xpEarned: travelXP,

          /*
           * User earned credits.
           * Don't record them as spent.
           *
           * Add creditsEarned to Activity schema
           * if you want this persisted.
           */

          creditsSpent: 0,

          distance: travelDistance,

          activityLocation: {
            latitude: pinLatitude,

            longitude: pinLongitude,
          },

          startLocation: {
            latitude: Number(currentLatitude),

            longitude: Number(currentLongitude),
          },

          endLocation: {
            latitude: pinLatitude,

            longitude: pinLongitude,
          },

          status: "completed",
        },
      ],
      {
        session,
      },
    );

    // =====================================================
    // 45. REPORTER NOTIFICATION
    // =====================================================

    const reporterNotification = {
      tokens: user.fcmToken ? [user.fcmToken] : [],

      title: "🚩 Fake Report Submitted",

      body:
        `You travelled ${milesTravelled.toFixed(2)} miles and earned ` +
        `${travelXP} XP and ${creditsEarned} Credits.`,

      data: {
        type: "PIN_REPORTED_FAKE",

        pinId: pin._id.toString(),

        xp: String(travelXP),

        credits: String(creditsEarned),

        voteWeight: String(voteWeight),

        confidenceScore: String(validation.confidenceScore),

        mode: String(pin.activePinMode || ""),
      },
    };

    // =====================================================
    // 46. STORE REPORTER NOTIFICATION
    // =====================================================

    await Notification.create(
      [
        {
          title: reporterNotification.title,

          description: reporterNotification.body,

          notificationType: "private",

          receivers: [user._id],

          senderRole: "system",
        },
      ],
      {
        session,
      },
    );

    // =====================================================
    // 47. CREATOR NOTIFICATION
    // =====================================================

    let creatorNotification = null;

    if (creatorForNotification) {
      // -----------------------------------------------
      // Vanguard deleted
      // -----------------------------------------------

      if (pinDeleted) {
        creatorNotification = {
          tokens: creatorForNotification.fcmToken
            ? [creatorForNotification.fcmToken]
            : [],

          title: "🚨 Vanguard Pin Deleted",

          body: "Your Vanguard pin was deleted after receiving 3 fake votes.",

          data: {
            type: "VANGUARD_PIN_DELETED",

            pinId: pin._id.toString(),

            reason: "THREE_FAKE_VOTES",

            fakeVotes: String(validation.fakeVotes),

            fakeWeight: String(validation.fakeWeight),
          },
        };
      }

      // -----------------------------------------------
      // Normal pin became fake
      // -----------------------------------------------
      else if (validation.consensusStatus === "FAKE") {
        creatorNotification = {
          tokens: creatorForNotification.fcmToken
            ? [creatorForNotification.fcmToken]
            : [],

          title: "🚨 Pin Marked Fake",

          body: "Your pin reached the fake validation threshold.",

          data: {
            type: "PIN_MARKED_FAKE",

            pinId: pin._id.toString(),

            fakeVotes: String(validation.fakeVotes),

            fakeWeight: String(validation.fakeWeight),

            confidenceScore: String(validation.confidenceScore),
          },
        };
      }

      // -----------------------------------------------
      // Still pending
      // -----------------------------------------------
      else {
        const remainingReports = isVanguard
          ? Math.max(0, 3 - Number(validation.fakeVotes || 0))
          : null;

        creatorNotification = {
          tokens: creatorForNotification.fcmToken
            ? [creatorForNotification.fcmToken]
            : [],

          title: isVanguard ? "🚩 Vanguard Pin Reported" : "🚩 Pin Reported",

          body: isVanguard
            ? `Your Vanguard pin received a fake vote. ${remainingReports} fake vote(s) remaining before deletion.`
            : `${user.name} reported your pin as fake.`,

          data: {
            type: isVanguard ? "VANGUARD_PIN_REPORTED" : "PIN_REPORTED_BY_USER",

            pinId: pin._id.toString(),

            reportedBy: user._id.toString(),

            fakeVotes: String(validation.fakeVotes),

            fakeWeight: String(validation.fakeWeight),

            confidenceScore: String(validation.confidenceScore),

            remainingReports:
              remainingReports !== null ? String(remainingReports) : "",
          },
        };
      }
    }

    // =====================================================
    // 48. STORE CREATOR NOTIFICATION
    // =====================================================

    if (creatorNotification && creatorForNotification) {
      await Notification.create(
        [
          {
            title: creatorNotification.title,

            description: creatorNotification.body,

            notificationType: "private",

            receivers: [creatorForNotification._id],

            senderRole: "system",
          },
        ],
        {
          session,
        },
      );
    }

    // =====================================================
    // 49. COMMIT TRANSACTION
    // =====================================================

    await session.commitTransaction();

    // =====================================================
    // 50. SEND PUSH NOTIFICATIONS AFTER COMMIT
    // =====================================================

    const notifications = [];

    // Fake report reward
    if (reporterNotification?.tokens?.length) {
      notifications.push(sendNotification(reporterNotification));
    }

    // Creator
    if (creatorNotification?.tokens?.length) {
      notifications.push(sendNotification(creatorNotification));
    }

    // Level up
    if (levelUpNotification?.tokens?.length) {
      notifications.push(sendNotification(levelUpNotification));
    }

    /*
     * DB transaction is already committed.
     * FCM failure should not fail this API.
     */

    await Promise.allSettled(notifications);

    // =====================================================
    // 51. RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message: pinDeleted
        ? "Pin deleted after 3 fake votes (Vanguard mode)"
        : becameFake
          ? "Pin marked as fake"
          : "Fake vote submitted successfully",

      mode: pin.activePinMode,

      vote: {
        userId: user._id,

        type: "FAKE",

        weight: voteWeight,

        trustScore: user.trustScore,

        level: user.level,

        levelName: user.levelName,
      },

      consensus: {
        validWeight: validation.validWeight,

        fakeWeight: validation.fakeWeight,

        validVotes: validation.validVotes,

        fakeVotes: validation.fakeVotes,

        confidenceScore: validation.confidenceScore,

        verifiedThreshold: VALIDATION_CONFIG.VERIFIED_SCORE,

        fakeThreshold: VALIDATION_CONFIG.FAKE_SCORE,

        status: validation.consensusStatus,
      },

      rewards: {
        distanceMeters: travelDistance,

        milesTravelled: Number(milesTravelled.toFixed(2)),

        baseXP: baseTravelXP,

        xpEarned: travelXP,

        creditsEarned,

        creditRate: "5 credits per mile",

        trustScoreEarned: 0.1,
      },

      levelUp:
        Number(user.level) > oldLevel
          ? {
              previousLevel: oldLevel,

              newLevel: user.level,

              levelName: user.levelName,

              emoji: levelData.emoji || "",
            }
          : null,

      pinData: {
        pinScore: validation.confidenceScore,

        pinStatus: pinDeleted ? "deleted" : pin.pinStatus,

        vanguardFakeReports: isVanguard
          ? validation.fakeVotes
          : pin.vanguardFakeReports,

        activePinMode: pin.activePinMode,

        deleted: pinDeleted,
      },

      distanceInfo: {
        liveDistanceMeters: Number(liveDistance.toFixed(2)),

        travelDistanceMeters: Number(travelDistance.toFixed(2)),

        travelDistanceMiles: Number(milesTravelled.toFixed(2)),
      },

      activeBoosts,

      hexPartyActive,

      data: pinDeleted ? null : pin,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Fake Pin Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Server Error",
    });
  } finally {
    await session.endSession();
  }
};
