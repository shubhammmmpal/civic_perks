// validation.controller.js

import Validation from "../model/validation.model.js";
import Pin from "../model/pin.model.js";
import User from "../model/user.model.js"; // assuming you have user model
import mongoose from "mongoose";
import { calculateDistanceInMeters } from "../helper/helper.js";
import { getLevelData } from "../helper/constants.js";
import States from "../model/states.model.js";
import Activity from "../model/activity.model.js";
import Fine from "../model/fine.model.js";
import Megaphone from "../model/megaphone.model.js";
import GoldenCargo from "../model/goldenCargo.model.js";
import { updateLeaderboardXP } from "../helper/helper.js";
import { checkLevelUp, sendNotification } from "../helper/helper.js";
import { createNotification } from "../helper/helper.js";
import Notification from "../model/notification.model.js";
/*
|--------------------------------------------------------------------------
| VALIDATE PIN API
|--------------------------------------------------------------------------
|
| FLOW:
|
| 1. First validator validates pin
|    -> Pin status = orange
|    -> Validation status = orange
|    -> validator becomes validatedBy
|
| 2. Within 24 hours another user can validate same pin
|    -> Second user becomes beneficiary
|    -> Both users get rewards
|    -> beneficiary gets 50%
|
| 3. If task solved later
|    -> status becomes green
|
*/

export const validatePin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { pinId } = req.params;
    const userId = req.user.id;

    // =========================================
    // CURRENT USER LIVE LOCATION (FRONTEND GPS)
    // =========================================

    const { currentLatitude, currentLongitude } = req.body;

    if (!currentLatitude || !currentLongitude) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Current location is required",
      });
    }

    console.log("line 58");

    // =========================================
    // FIND USER
    // =========================================

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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

    const reservedCargo = await GoldenCargo.findOne({
      pinId: pin._id,
      expiresAt: { $gt: new Date() },
    }).session(session);

    if (reservedCargo && reservedCargo.userId.toString() !== userId) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message: "This resource pin is reserved by another Golden Cargo user",
      });
    }

    // =====================================================
    // GOLDEN CARGO RESERVATION CHECK
    // =====================================================

    if (pin.category === "Resources (Zero-Waste, Upcycling & Utilities)") {
      const activeCargo = await GoldenCargo.findOne({
        pinId: pin._id,
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (
        pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
        activeCargo
      ) {
        const alreadyReserved = activeCargo.pinId.some(
          (id) => id.toString() === pin._id.toString(),
        );

        if (!alreadyReserved) {
          if (activeCargo.pinId.length >= 3) {
            await session.abortTransaction();

            return res.status(400).json({
              success: false,
              message: "Golden Cargo can reserve maximum 3 resource pins",
            });
          }

          activeCargo.pinId.push(pin._id);

          await activeCargo.save({ session });

          pin.reservationExpiresAt = activeCargo.expiresAt;

          await pin.save({ session });
        }
      }

      if (activeCargo) {
        const isCargoOwner = activeCargo.userId.toString() === userId;

        if (!isCargoOwner) {
          await session.abortTransaction();

          return res.status(403).json({
            success: false,
            message:
              "This resource pin is reserved by Golden Cargo and cannot be validated until the reservation expires.",
            reservedUntil: activeCargo.expiresAt,
          });
        }
      }
    }

    console.log("line 90");

    // =========================================
    // PREVENT CREATOR VALIDATION
    // =========================================

    if (pin.createdBy.toString() === userId) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You cannot validate your own pin",
      });
    }

    // =========================================
    // PIN LOCATION
    // =========================================

    const pinLongitude = pin.location.coordinates[0];
    const pinLatitude = pin.location.coordinates[1];

    // =========================================
    // LIVE GPS → PIN DISTANCE
    // Used for 10 meter validation
    // =========================================

    const liveDistance = calculateDistanceInMeters(
      Number(currentLatitude),
      Number(currentLongitude),
      pinLatitude,
      pinLongitude,
    );

    console.log("line 125");
    // =========================================
    // CHECK 10 METER RADIUS
    // =========================================

    if (liveDistance > 10) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message: "You must be within 10 meters of the pin location",
        distance: `${liveDistance.toFixed(2)} meters`,
      });
    }

    // =========================================
    // USER SAVED LOCATION
    // Used for travel XP
    // =========================================

    // const dbLatitude = user.latitude;
    // const dbLongitude = user.longitude;

    // if (!dbLatitude || !dbLongitude) {
    //   await session.abortTransaction();

    //   return res.status(400).json({
    //     success: false,
    //     message: "Saved user location not found",
    //   });
    // }

    // console.log("line 158")

    // =========================================
    // DB LOCATION → PIN DISTANCE
    // =========================================

    // const travelDistance = calculateDistanceInMeters(
    //   Number(dbLatitude),
    //   Number(dbLongitude),
    //   pinLatitude,
    //   pinLongitude,
    // );

    // =========================================
    // XP CALCULATION
    // 1 XP per 100 meters
    // =========================================

    // =========================================
    // FIND ACTIVITY
    // =========================================

    const activity = await Activity.findOne({
      userId,
      pinId,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .session(session);

    console.log("189");

    // =========================================
    // CHECK ACTIVITY
    // =========================================

    if (!activity) {
      const activeCargo = await GoldenCargo.findOne({
        userId,
        pinId: pin._id,
        expiresAt: { $gt: new Date() },
      }).session(session);

      const isReservedResourcePin =
        pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
        activeCargo;

      if (!isReservedResourcePin) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message: "No pending activity found",
        });
      }
    }

    console.log("190");

    // =========================================
    // UPDATE STATUS
    // =========================================

    activity.status = "completed";

    console.log("193");

    await activity.save({ session });

    // =========================================
    // TRAVEL DISTANCE FROM ACTIVITY
    // =========================================

    const travelDistance = activity.distance || 0;

    const travelXP = Math.max(1, Math.floor(travelDistance / 100));

    // =========================================
    // FIND VALIDATION
    // =========================================

    let validation = await Validation.findOne({
      pinID: pinId,
    }).session(session);

    // =====================================================
    // FIRST VALIDATOR
    // =====================================================

    console.log("line 190");

    console.log(validation);

    if (!validation) {
      validation = new Validation({
        pinID: pinId,
        validatedBy: userId,
        status: "orange",
        beneficiaries: [],
      });

      await validation.save({ session });

      // =========================================
      // UPDATE PIN
      // =========================================

      console.log("line 206");

      pin.validatedBy = userId;
      pin.status = "orange";

      // increase score
      pin.pinScore += 10;

      // =========================================
      // AUTO VERIFY PIN
      // CREATOR REWARD ONLY ONCE
      // =========================================

      let pinVerifiedNotification = null;

      if (
        pin.pinScore >= 100 &&
        (!pin.pinStatus || pin.pinStatus === "pending")
      ) {
        // update pin status
        pin.pinStatus = "verified";
        pin.status = "green";

        // =========================================
        // REWARD PIN CREATOR
        // =========================================

        const pinCreator = await User.findById(pin.createdBy).session(session);

        if (pinCreator) {
          // give xp
          pinCreator.xp += 15;

          // increase trust score
          pinCreator.trustScore = Math.min(
            99.9,
            Number((pinCreator.trustScore + 0.5).toFixed(1)),
          );

          // =========================================
          // UPDATE LEVEL
          // =========================================

          const creatorLevelData = getLevelData(pinCreator.xp);

          pinCreator.level = creatorLevelData.level;
          pinCreator.levelName = creatorLevelData.name;

          await pinCreator.save({ session });

          pinVerifiedNotification = {
            tokens: pinCreator.fcmToken ? [pinCreator.fcmToken] : [],
            title: "🎉 Pin Verified",
            body: "Congratulations! Your pin has been verified. You earned 15 XP.",
            data: {
              type: "PIN_VERIFIED",
              pinId: pin._id.toString(),
              xp: 15,
            },
          };
        }
      }

      // =========================================
      // PENALIZE FAKE REPORTERS
      // =========================================

      if (pin.fakereportingBy.length > 0 && !pin.fakeReportersPenalized) {
        // get all fake reporters
        const fakeReporters = await User.find({
          _id: { $in: pin.fakereportingBy },
        }).session(session);

        for (const reporter of fakeReporters) {
          // =========================================
          // DECREASE TRUST SCORE
          // =========================================

          reporter.trustScore = Math.max(
            0,
            Number((reporter.trustScore - 15).toFixed(1)),
          );

          // =========================================
          // BAN USER IF BELOW 40
          // =========================================

          if (reporter.trustScore < 40) {
            reporter.status = "banned";
          }

          // =========================================
          // SAVE USER
          // =========================================

          await reporter.save({ session });

          // =========================================
          // CREATE FINE LOG
          // =========================================

          await Fine.create(
            [
              {
                userId: reporter._id,
                amount: 15,
                reason: `False fake report on verified pin ${pin._id}`,
              },
            ],
            { session },
          );
        }

        // =========================================
        // PREVENT DUPLICATE PENALTY
        // =========================================

        pin.fakeReportersPenalized = true;
      }

      console.log("hit 4");

      await pin.save({ session });

      // =========================================
      // REWARD VALIDATOR
      // =========================================

      const updated_lavel = user.xp + travelXP;
      await checkLevelUp(user, updated_lavel, session);

      user.xp += travelXP;
      user.credits += 5;
      await updateLeaderboardXP(user._id, travelXP, session);

      // trust score increase
      user.trustScore = Math.min(
        99.9,
        Number((user.trustScore + 0.1).toFixed(1)),
      );

      console.log("hit 3");
      // =========================================
      // UPDATE LEVEL
      // =========================================

      // const levelData = getLevelData(user.xp);

      // user.level = levelData.level;
      // user.levelName = levelData.name;

      console.log("hit 1");

      await user.save({ session });

      // =========================================
      // UPDATE USER STATS
      // =========================================

      // =========================================
      // FIND USER STATS
      // =========================================
      console.log("hit 2");
      let userStats = await States.findOne({
        userId: userId,
      }).session(session);

      // =========================================
      // CREATE IF NOT EXISTS
      // =========================================

      console.log(userStats);

      if (!userStats) {
        userStats = new States({
          user: userId,
          pinsValidated: 1,
        });
      } else {
        userStats.pinsValidated += 1;
      }

      // =========================================
      // SAVE
      // =========================================

      await userStats.save({ session });

      // =========================================
      // CREATE ACTIVITY LOG
      // =========================================

      await Activity.create(
        [
          {
            userId: userId,

            activityType: "pin_validated",

            pinId: pin._id,

            pinTitle: pin.description || "Pin Validation",

            images: pin.images || [],

            xpEarned: travelXP,

            creditsSpent: 5,

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
        { session },
      );

      // =========================================
      // PREPARE NOTIFICATIONS
      // =========================================

      const pinCreator = await User.findById(pin.createdBy)
        .select("fcmToken name")
        .session(session);

      const validatorRewardNotification = {
        tokens: user.fcmToken ? [user.fcmToken] : [],
        title: "✅ Pin Validated",
        body: `You earned ${travelXP} XP and 5 Credits for validating this pin.`,
        data: {
          type: "PIN_VALIDATED",
          pinId: pin._id.toString(),
          xp: travelXP,
          credits: 5,
        },
      };

      const creatorNotification = {
        tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],
        title: "📍 Pin Validation",
        body: `${user.name} validated your pin.`,
        data: {
          type: "PIN_VALIDATED_BY_USER",
          pinId: pin._id.toString(),
          validatorId: user._id.toString(),
        },
      };

      // =========================================
      // COMMIT
      // =========================================

      await session.commitTransaction();

      const notifications = [
        sendNotification(validatorRewardNotification),
        sendNotification(creatorNotification),
      ];

      if (pinVerifiedNotification) {
        notifications.push(sendNotification(pinVerifiedNotification));
      }

      await Promise.all(notifications);

      return res.status(200).json({
        success: true,
        message: "Pin validated successfully",

        rewards: {
          xpEarned: travelXP,
          creditsEarned: 5,
          trustScoreEarned: 0.1,
        },

        pinData: {
          pinScore: pin.pinScore,
          pinStatus: pin.pinStatus,
          status: pin.status,
        },

        distanceInfo: {
          liveDistanceMeters: liveDistance.toFixed(2),

          travelDistanceMeters: travelDistance.toFixed(2),
        },
      });
    }

    // =========================================
    // UPDATE USER STATS
    // =========================================

    let userStats = await States.findOne({
      user: userId,
    }).session(session);

    // create if not exists
    if (!userStats) {
      userStats = new States({
        user: userId,
        pinsValidated: 1,
      });
    } else {
      userStats.pinsValidated += 1;
    }

    await userStats.save({ session });

    // =====================================================
    // PREVENT SAME VALIDATOR
    // =====================================================

    if (
      validation.validatedBy &&
      validation.validatedBy.toString() === userId
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You already validated this pin",
      });
    }

    // =====================================================
    // CHECK 24 HOUR WINDOW
    // =====================================================

    const createdAt = new Date(validation.createdAt);

    const now = new Date();

    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Validation window expired",
      });
    }

    // =====================================================
    // ALREADY BENEFICIARY
    // =====================================================

    const alreadyBeneficiary = validation.beneficiaries.some(
      (id) => id.toString() === userId,
    );

    if (alreadyBeneficiary) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Already validated as beneficiary",
      });
    }

    // =====================================================
    // ADD BENEFICIARY
    // =====================================================

    validation.beneficiaries.push(userId);

    await validation.save({ session });

    // =========================================
    // UPDATE PIN
    // =========================================

    pin.beneficiaries.push(userId);

    // increase score
    pin.pinScore += 10;

    // =========================================
    // AUTO VERIFY PIN
    // CREATOR REWARD ONLY ONCE
    // =========================================

    if (
      pin.pinScore >= 100 &&
      (!pin.pinStatus || pin.pinStatus === "pending")
    ) {
      // update pin status
      pin.pinStatus = "verified";
      pin.status = "green";

      // =========================================
      // REWARD PIN CREATOR
      // =========================================

      const pinCreator = await User.findById(pin.createdBy).session(session);

      if (pinCreator) {
        // give xp
        pinCreator.xp += 15;

        // increase trust score
        pinCreator.trustScore = Math.min(
          99.9,
          Number((pinCreator.trustScore + 0.5).toFixed(1)),
        );

        // =========================================
        // UPDATE LEVEL
        // =========================================

        const creatorLevelData = getLevelData(pinCreator.xp);

        pinCreator.level = creatorLevelData.level;
        pinCreator.levelName = creatorLevelData.name;

        await pinCreator.save({ session });
      }
    }

    // =========================================
    // PENALIZE FAKE REPORTERS
    // =========================================

    if (pin.fakereportingBy.length > 0 && !pin.fakeReportersPenalized) {
      // get all fake reporters
      const fakeReporters = await User.find({
        _id: { $in: pin.fakereportingBy },
      }).session(session);

      for (const reporter of fakeReporters) {
        // =========================================
        // DECREASE TRUST SCORE
        // =========================================

        reporter.trustScore = Math.max(
          0,
          Number((reporter.trustScore - 15).toFixed(1)),
        );

        // =========================================
        // BAN USER IF BELOW 40
        // =========================================

        if (reporter.trustScore < 100) {
          reporter.status = "banned";
        }

        // =========================================
        // SAVE USER
        // =========================================

        await reporter.save({ session });

        // =========================================
        // CREATE FINE LOG
        // =========================================

        await Fine.create(
          [
            {
              userId: reporter._id,
              amount: 15,
              reason: `False fake report on verified pin ${pin._id}`,
            },
          ],
          { session },
        );
      }

      // =========================================
      // PREVENT DUPLICATE PENALTY
      // =========================================

      pin.fakeReportersPenalized = true;
    }

    await pin.save({ session });

    // =========================================
    // REWARD BENEFICIARY
    // =========================================

    const updated_lavel = user.xp + travelXP;

    await checkLevelUp(user, updated_lavel, session);

    user.xp += travelXP;
    user.credits += 2;

    await updateLeaderboardXP(user._id, travelXP, session);

    // ======================================
    // TRUST SCORE INCREASE
    // ======================================

    user.trustScore = Math.min(
      99.9,
      Number((user.trustScore + 0.1).toFixed(1)),
    );

    // =========================================
    // UPDATE LEVEL
    // =========================================

    // const levelData = getLevelData(user.xp);

    // user.level = levelData.level;
    // user.levelName = levelData.name;

    await user.save({ session });

    // =========================================
    // FETCH VALIDATOR
    // =========================================

    const validatorUser = await User.findById(validation.validatedBy).select(
      "name email xp level levelName credits trustScore",
    );

    // =========================================
    // CREATE BENEFICIARY ACTIVITY LOG
    // =========================================

    await Activity.create(
      [
        {
          userId: userId,

          activityType: "pin_validated",

          pinId: pin._id,

          pinTitle: pin.description || "Pin Validation",

          images: pin.images || [],

          xpEarned: travelXP,

          creditsSpent: 2,

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
      { session },
    );

    // =========================================
    // PREPARE NOTIFICATIONS
    // =========================================

    const pinCreator = await User.findById(pin.createdBy)
      .select("fcmToken name")
      .session(session);

    const beneficiaryRewardNotification = {
      tokens: user.fcmToken ? [user.fcmToken] : [],
      title: "✅ Validation Successful",
      body: `You earned ${travelXP} XP and 2 Credits for supporting this validation.`,
      data: {
        type: "PIN_VALIDATION_SUPPORT",
        pinId: pin._id.toString(),
        xp: travelXP,
        credits: 2,
      },
    };

    const creatorNotification = {
      tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],
      title: "📍 Pin Validation",
      body: `${user.name} also validated your pin.`,
      data: {
        type: "PIN_VALIDATED_BY_USER",
        pinId: pin._id.toString(),
        validatorId: user._id.toString(),
      },
    };

    // =========================================
    // COMMIT
    // =========================================

    await session.commitTransaction();

    await Promise.all([
      sendNotification(beneficiaryRewardNotification),
      sendNotification(creatorNotification),
    ]);

    // =========================================
    // RESPONSE
    // =========================================

    return res.status(200).json({
      success: true,

      message: "You successfully joined this validation task.",

      validator: validatorUser,

      rewards: {
        xpEarned: travelXP,
        creditsEarned: 2,
      },

      pinData: {
        pinScore: pin.pinScore,
        pinStatus: pin.pinStatus,
        status: pin.status,
      },

      distanceInfo: {
        liveDistanceMeters: liveDistance.toFixed(2),

        travelDistanceMeters: travelDistance.toFixed(2),
      },
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const solvePin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { pinId } = req.params;

    const action = req.body.action;
    const timeTaken = req.body.timeTaken;

    const beforeImage = req.file?.path || null;

    const userId = req.user.id;

    //  return

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
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (activeCargo && activeCargo.userId.toString() !== userId) {
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

    if (!validation) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Validation not found",
      });
    }

    // =====================================================
    // ONLY VALIDATOR CAN SOLVE
    // =====================================================
    if (validation.validatedBy.toString() !== userId) {
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

      await pin.save({ session });

      await validation.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Task stopped successfully",
      });
    }

    // =====================================================
    // SOLVE TASK
    // =====================================================
    if (action === "solve") {
      // =================================================
      // ALREADY SOLVED
      // =================================================
      if (pin.status === "green") {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "Task already solved",
        });
      }

      // =================================================
      // SAVE OPTIONAL DATA
      // =================================================
      if (beforeImage) {
        validation.beforeImage = beforeImage;
      }

      if (timeTaken) {
        validation.timeTaken = timeTaken;
      }

      // =================================================
      // UPDATE STATUS
      // =================================================
      pin.status = "green";

      validation.status = "green";

      pin.solvedAt = new Date();
      pin.pin_solve_time = timeTaken || 0;

      validation.solvedAt = new Date();

      // =================================================
      // BASE REWARDS
      // =================================================
      let validatorBounty = pin.bounty || 0;
      let validatorXP = pin.xpScore || 0;

      // =================================================
      // CHECK MEGAPHONE BONUS
      // =================================================
      const activeMegaphone = await Megaphone.findOne({
        pinId: pin._id,
        expiresAt: { $gt: new Date() },
      }).session(session);

      let megaphoneBonusApplied = false;

      if (activeMegaphone) {
        validatorBounty *= 2;
        validatorXP *= 2;
        megaphoneBonusApplied = true;
      }

      // =================================================
      // GIVE REWARD
      // =================================================

      // const updatedUser = await User.findByIdAndUpdate(
      //   validation.validatedBy,
      //   {
      //     $inc: {
      //       credits: validatorBounty,
      //       xp: validatorXP,
      //     },
      //   },
      //   {
      //     new: true,
      //     session,
      //   },
      // ).select("name email profileImage credits xp level levelName fcmToken");

      // await updateLeaderboardXP(validation.validatedBy, validatorXP, session);

      const user = await User.findById(validation.validatedBy).session(session);

      const updated_lavel = user.xp + validatorXP;

      await checkLevelUp(user, updated_lavel, session);

      user.xp += validatorXP;
      user.credits += validatorBounty;

      await updateLeaderboardXP(user._id, validatorXP, session);

      await user.save({ session });

      // =================================================
      // REFERRAL BONUS
      // =================================================

      const validator = await User.findById(userId)
        .select("createdAt refferredBy")
        .session(session);

      if (validator) {
        const isEligible =
          Date.now() - validator.createdAt.getTime() <=
          30 * 24 * 60 * 60 * 1000;

        if (isEligible && validator.refferredBy) {
          const referrer = await User.findOne({
            refferal_id: validator.refferredBy,
          }).session(session);

          if (referrer) {
            const referralCredits = Math.floor(validatorBounty * 0.1);
            const referralXP = Math.floor(validatorXP * 0.1);

            // const updatedReferrer = await User.findByIdAndUpdate(
            //   referrer._id,
            //   {
            //     $inc: {
            //       credits: referralCredits,
            //       xp: referralXP,
            //     },
            //   },
            //   {
            //     new: true,
            //     session,
            //   },
            // ).select("level levelName xp fcmToken");

            const referrerUser = await User.findById(referrer._id).session(
              session,
            );

            const updated_lavel = referrerUser.xp + referralXP;

            await checkLevelUp(referrerUser, updated_lavel, session);

            referrerUser.xp += referralXP;
            referrerUser.credits += referralCredits;

            await updateLeaderboardXP(referrerUser._id, referralXP, session);

            await referrerUser.save({ session });

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

            // await updateLeaderboardXP(updatedReferrer._id, referralXP, session);

            // await checkLevelUp(updatedReferrer, session);
          }
        }
      }

      // =================================================
      // UPDATE STATS
      // =================================================
      await States.findOneAndUpdate(
        {
          userId: validation.validatedBy,
        },
        {
          $inc: {
            pinsSolved: 1,
            hoursServed: Number(timeTaken) || 0,
            // totalXP: validatorXP,
            // totalCredits: validatorBounty,
            // totalEarnedBounty: validatorBounty,
            // greenPinsSolved: 1,
          },
        },
        {
          upsert: true,
          new: true,
          session,
        },
      );

      // =================================================
      // SAVE REWARD INFO
      // =================================================
      validation.rewardDistributed = true;

      validation.validatorReward = {
        bounty: validatorBounty,
        xp: validatorXP,
        megaphoneBonusApplied,
      };

      // =================================================
      // SAVE DOCUMENTS
      // =================================================
      await pin.save({ session });

      await validation.save({ session });

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

            creditsSpent: validatorBounty,

            activityLocation: {
              latitude: pin.location.coordinates[1],
              longitude: pin.location.coordinates[0],
            },

            status: "completed",
          },
        ],
        { session },
      );

      // =================================================
      // COMMIT
      // =================================================

      const pinCreator = await User.findById(pin.createdBy)
        .select("fcmToken name")
        .session(session);

      const creatorNotification = {
        tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],
        title: "✅ Your Pin Has Been Solved!",
        body: `Someone has successfully solved your reported pin.`,
        data: {
          type: "PIN_SOLVED",
          pinId: pin._id.toString(),
          solvedBy: user._id.toString(),
        },
      };

      const solverNotification = {
        tokens: user.fcmToken ? [user.fcmToken] : [],
        title: "🎉 Rewards Earned!",
        body: `You earned ${validatorXP} XP and ${validatorBounty} Credits for solving a pin.`,
        data: {
          type: "PIN_SOLVED_REWARD",
          pinId: pin._id.toString(),
          xp: validatorXP,
          credits: validatorBounty,
        },
      };
      await session.commitTransaction();

      // await Promise.all([
      //   sendNotification(solverNotification),
      //   sendNotification(creatorNotification),
      // ]);

      const notifications = [
        sendNotification(solverNotification),
        sendNotification(creatorNotification),
      ];

      if (levelUpResult?.levelUp && levelUpResult.notification) {
        notifications.push(sendNotification(levelUpResult.notification));
      }

      await Promise.all(notifications);

      // =================================================
      // RESPONSE
      // =================================================
      return res.status(200).json({
        success: true,

        message: "Task solved successfully and rewards distributed",

        gainedReward: {
          xp: validatorXP,
          credits: validatorBounty,
          megaphoneBonusApplied,
        },

        currentUser: {
          id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          currentXP: user.xp,
          currentCredits: user.credits,
        },

        pinInfo: {
          id: pin._id,
          status: pin.status,
          solvedAt: pin.solvedAt,
          bounty: pin.bounty,
          xpScore: pin.xpScore,
          description: pin.description,
          location: pin.location,
          images: pin.images,
        },

        validationInfo: {
          beforeImage: validation.beforeImage,
          timeTaken: validation.timeTaken,
          solvedAt: validation.solvedAt,
        },
      });
    }

    // =====================================================
    // INVALID ACTION
    // =====================================================
    await session.abortTransaction();

    return res.status(400).json({
      success: false,
      message: "Invalid action. Use stop or solve",
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ==========================================
// FAKE PIN API
// ==========================================
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

//     const activity = await Activity.findOne({
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
//     // TRAVEL DISTANCE
//     // ==========================================

//     const travelDistance = activity.distance || 0;

//     // ==========================================
//     // XP CALCULATION
//     // ==========================================

//     const travelXP = Math.max(1, Math.floor(travelDistance / 100));

//     // ==========================================
//     // ADD USER TO FAKE REPORTING
//     // ==========================================

//     pin.fakereportingBy.push(userId);

//     // ==========================================
//     // DECREASE PIN SCORE
//     // ==========================================

//     pin.pinScore -= 10;

//     // safety
//     // if (pin.pinScore < 0) {
//     //   pin.pinScore = 0;
//     // }

//     // ==========================================
//     // CHANGE STATUS IF SCORE TOO LOW
//     // ==========================================

//     if (pin.pinScore <= -60) {
//       pin.pinStatus = "fake";
//     }

//     // ==========================================
//     // REWARD USER
//     // ==========================================

//     // ==========================================
//     // CREATOR PENALTY
//     // ==========================================

//     if (pin.pinScore <= -60 && !pin.creatorPenalized) {
//       // ==========================================
//       // FIND CREATOR
//       // ==========================================

//       const creator = await User.findById(pin.createdBy).session(session);

//       if (creator) {
//         // ==========================================
//         // DECREASE TRUST SCORE
//         // ==========================================

//         creator.trustScore = Math.max(
//           0,
//           Number((creator.trustScore - 15).toFixed(1)),
//         );

//         // ==========================================
//         // BAN USER IF BELOW 40
//         // ==========================================

//         if (creator.trustScore < 40) {
//           creator.status = "banned";
//         }

//         // ==========================================
//         // SAVE CREATOR
//         // ==========================================

//         await creator.save({ session });

//         // ==========================================
//         // CREATE FINE LOG
//         // ==========================================

//         await Fine.create(
//           [
//             {
//               userId: creator._id,
//               amount: 15,

//               reason: `Pin ${pin._id} reached fake threshold score of -60`,
//             },
//           ],
//           { session },
//         );

//         // ==========================================
//         // PREVENT DUPLICATE PENALTY
//         // ==========================================

//         pin.creatorPenalized = true;
//       }
//     }

//     const updated_lavel = user.xp + travelXP;
//     await checkLevelUp(user, updated_lavel, session);

//     user.xp += travelXP;

//     await updateLeaderboardXP(user._id, travelXP, session);

//     // trust score increase
//     user.trustScore = Math.min(
//       99.9,
//       Number((user.trustScore + 0.1).toFixed(1)),
//     );

//     // ==========================================
//     // UPDATE LEVEL
//     // ==========================================

//     const levelData = getLevelData(user.xp);

//     user.level = levelData.level;
//     user.levelName = levelData.name;

//     // ==========================================
//     // COMPLETE ACTIVITY
//     // ==========================================

//     activity.status = "completed";

//     // ==========================================
//     // SAVE ALL
//     // ==========================================

//     await pin.save({ session });

//     await user.save({ session });

//     await activity.save({ session });

//     // ==========================================
//     // COMMIT
//     // ==========================================

//     // ==========================================
//     // PREPARE NOTIFICATIONS
//     // ==========================================

//     // Pin creator
//     const pinCreator = await User.findById(pin.createdBy)
//       .select("name fcmToken")
//       .session(session);

//     // Notification for the user who reported fake
//     const reporterNotification = {
//       tokens: user.fcmToken ? [user.fcmToken] : [],
//       title: "🚩 Fake Report Submitted",
//       body: `Your fake report has been submitted successfully. You earned ${travelXP} XP.`,
//       data: {
//         type: "PIN_REPORTED_FAKE",
//         pinId: pin._id.toString(),
//         xp: travelXP,
//       },
//     };

//     // Notification for the pin creator
//     const creatorNotification = {
//       tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],
//       title: "🚩 Pin Reported",
//       body: `${user.name} reported your pin as fake.`,
//       data: {
//         type: "PIN_REPORTED_BY_USER",
//         pinId: pin._id.toString(),
//         reportedBy: user._id.toString(),
//       },
//     };

//     await session.commitTransaction();

//     await Promise.all([
//       sendNotification(reporterNotification),
//       sendNotification(creatorNotification),
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: "Pin reported as fake successfully",

//       rewards: {
//         xpEarned: travelXP,
//         trustScoreEarned: 0.1,
//       },

//       pinData: {
//         pinScore: pin.pinScore,
//         pinStatus: pin.pinStatus,
//       },

//       data: pin,
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
export const fakePin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // ==========================================
    // USER ID
    // ==========================================
    const userId = req.user.id;

    // ==========================================
    // PIN ID
    // ==========================================
    const { pinId } = req.params;

    // ==========================================
    // FIND USER
    // ==========================================
    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // CHECK PIN EXISTS
    // ==========================================
    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // ==========================================
    // CHECK USER ALREADY REPORTED
    // ==========================================
    const alreadyReported = pin.fakereportingBy.some(
      (id) => id.toString() === userId,
    );

    if (alreadyReported) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "You already reported this pin",
      });
    }

    // ==========================================
    // FIND ACTIVITY
    // ==========================================
    let activity = await Activity.findOne({
      userId,
      pinId,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .session(session);

    if (!activity) {
      const activeCargo = await GoldenCargo.findOne({
        userId,
        pinId: pin._id,
        expiresAt: { $gt: new Date() },
      }).session(session);

      const isReservedResourcePin =
        pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
        activeCargo;

      if (!isReservedResourcePin) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "No pending activity found",
        });
      }
    }

    // ==========================================
    // TRAVEL DISTANCE & XP
    // ==========================================
    const travelDistance = activity?.distance || 0;
    const travelXP = Math.max(1, Math.floor(travelDistance / 100));

    // ==========================================
    // FLAGS
    // ==========================================
    let pinDeleted = false;
    const isVanguard = pin.activePinMode === "vanguard";

    // ==========================================
    // ADD USER TO FAKE REPORTING (common)
    // ==========================================
    pin.fakereportingBy.push(userId);

    // ==========================================
    // BRANCH: VANGUARD vs NORMAL
    // ==========================================

    let creatorForNotification = null;

    if (isVanguard) {
      // ------------------------------------------
      // VANGUARD MODE
      // ------------------------------------------

      pin.vanguardFakeReports = (pin.vanguardFakeReports || 0) + 1;

      // Fetch creator before possible deletion
      // creatorForNotification = await User.findById(pin.createdBy)
      //   .select("name fcmToken")
      //   .session(session);

      creatorForNotification = await User.findById(pin.createdBy)
  .session(session);

      // ------------------------------------------
      // DELETE PIN AFTER 3 FAKE REPORTS
      // ------------------------------------------

      if (pin.vanguardFakeReports >= 3) {
        // ===== Creator penalty (once) =====

        if (!pin.creatorPenalized) {
          const creator = creatorForNotification;

          if (creator) {
            // -15 Trust Score
            creator.trustScore = Math.max(
              0,
              Number((creator.trustScore - 15).toFixed(1)),
            );

            // Ban if trust score is below 40
            if (creator.trustScore < 40) {
              creator.status = "banned";
            }

            // Deduct XP granted during pin creation
            const instantXP = pin.xpScore || 0;

            creator.xp = Math.max(0, creator.xp - instantXP);

            // Recalculate level
            const levelData = getLevelData(creator.xp);

            // creator.level = levelData.level;
            // creator.levelName = levelData.name;

            await creator.save({ session });

            // Fine
            await Fine.create(
              [
                {
                  userId: creator._id,
                  amount: 15,
                  reason: `Vanguard pin ${pin._id} deleted after 3 fake reports`,
                },
              ],
              { session },
            );

            pin.creatorPenalized = true;
          }
        }

        // ------------------------------------------
        // HARD DELETE PIN
        // ------------------------------------------

        await Pin.findByIdAndDelete(pin._id).session(session);

        pinDeleted = true;
      }
    } else {
      // ------------------------------------------
      // NORMAL MODE
      // ------------------------------------------

      pin.pinScore -= 10;

      if (pin.pinScore <= -60) {
        pin.pinStatus = "fake";
      }

      // ------------------------------------------
      // CREATOR PENALTY
      // ------------------------------------------

      if (pin.pinScore <= -60 && !pin.creatorPenalized) {
        creatorForNotification = await User.findById(pin.createdBy)
          .select("name fcmToken")
          .session(session);

        const creator = creatorForNotification;

        if (creator) {
          creator.trustScore = Math.max(
            0,
            Number((creator.trustScore - 15).toFixed(1)),
          );

          if (creator.trustScore < 40) {
            creator.status = "banned";
          }

          await creator.save({ session });

          await Fine.create(
            [
              {
                userId: creator._id,
                amount: 15,
                reason: `Pin ${pin._id} reached fake threshold score of -60`,
              },
            ],
            { session },
          );

          pin.creatorPenalized = true;
        }
      }
    }

    // ==========================================
    // REWARD THE REPORTER (both modes)
    // ==========================================
    const updated_level = user.xp + travelXP;
    await checkLevelUp(user, updated_level, session);

    user.xp += travelXP;
    await updateLeaderboardXP(user._id, travelXP, session);

    user.trustScore = Math.min(
      99.9,
      Number((user.trustScore + 0.1).toFixed(1)),
    );

    // const levelData = getLevelData(user.xp);
    // user.level = levelData.level;
    // user.levelName = levelData.name;

    // ==========================================
    // COMPLETE ACTIVITY
    // ==========================================
    if (activity) {
      activity.status = "completed";
    }

    // ==========================================
    // SAVE ALL
    // ==========================================
    if (!pinDeleted) {
      await pin.save({ session });
    }

    await user.save({ session });

    if (activity) {
      await activity.save({ session });
    }

    // ==========================================
    // PREPARE NOTIFICATIONS
    // ==========================================
    // const pinCreator = await User.findById(pin.createdBy)
    //   .select("name fcmToken")
    //   .session(session);

    const reporterNotification = {
      tokens: user.fcmToken ? [user.fcmToken] : [],
      title: "🚩 Fake Report Submitted",
      body: `Your fake report has been submitted successfully. You earned ${travelXP} XP.`,
      data: {
        type: "PIN_REPORTED_FAKE",
        pinId: pin._id.toString(),
        xp: travelXP,
        mode: pin.activePinMode,
      },
    };

    await Notification.create({
  title: reporterNotification.title,
  description: reporterNotification.body,
  notificationType: "private",
  receivers: [user._id],
  senderRole: "system",
});

    // ==========================================
    // CREATOR NOTIFICATION
    // ==========================================

    let creatorNotification = null;

    if (creatorForNotification?.fcmToken) {
      if (pinDeleted) {
        // ========================================
        // PIN DELETED
        // ========================================

        creatorNotification = {
          tokens: [creatorForNotification.fcmToken],

          title: "🚨 Vanguard Pin Deleted",

          body: "Your Vanguard pin was deleted after receiving 3 fake reports.",

          data: {
            type: "VANGUARD_PIN_DELETED",

            pinId: pin._id.toString(),

            reason: "THREE_FAKE_REPORTS",

            fakeReports: "3",
          },
        };
      } else {
        // ========================================
        // PIN REPORTED
        // ========================================

        const fakeReports = pin.vanguardFakeReports || 0;

        const remainingReports = isVanguard
          ? Math.max(0, 3 - fakeReports)
          : null;

        creatorNotification = {
          tokens: [creatorForNotification.fcmToken],

          title: isVanguard ? "🚩 Vanguard Pin Reported" : "🚩 Pin Reported",

          body: isVanguard
            ? `Your Vanguard pin received a fake report. ${remainingReports} fake report${
                remainingReports === 1 ? "" : "s"
              } remaining before deletion.`
            : `${user.name} reported your pin as fake.`,

          data: {
            type: isVanguard ? "VANGUARD_PIN_REPORTED" : "PIN_REPORTED_BY_USER",

            pinId: pin._id.toString(),

            reportedBy: user._id.toString(),

            fakeReports: String(pin.vanguardFakeReports || 0),

            remainingReports:
              remainingReports !== null ? String(remainingReports) : "",
          },
        };
      }
    }

    if (creatorNotification) {
  await Notification.create({
    title: creatorNotification.title,
    description: creatorNotification.body,
    notificationType: "private",
    receivers: [creatorForNotification._id],
    senderRole: "system",
  });
}

    // ==========================================
    // COMMIT
    // ==========================================
    await session.commitTransaction();

    // await Promise.all([
    //   sendNotification(reporterNotification),
    //   sendNotification(creatorNotification),
    // ]);

    const notifications = [sendNotification(reporterNotification)];

    if (creatorNotification) {
      notifications.push(sendNotification(creatorNotification));
    }

    await Promise.all(notifications);

    return res.status(200).json({
      success: true,
      message: pinDeleted
        ? "Pin deleted after 3 fake reports (Vanguard mode)"
        : "Pin reported as fake successfully",
      mode: pin.activePinMode,
      rewards: {
        xpEarned: travelXP,
        trustScoreEarned: 0.1,
      },
      pinData: {
        pinScore: pin.pinScore,
        pinStatus: pinDeleted ? "deleted" : pin.pinStatus,
        vanguardFakeReports: pin.vanguardFakeReports,
        activePinMode: pin.activePinMode,
      },
      data: pinDeleted ? null : pin,
    });
  } catch (error) {
    await session.abortTransaction();
    console.log("Fake Pin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
