import mongoose from "mongoose";
import Pin from "../model/pin.model.js";
import States from "../model/states.model.js";
import User from "../model/user.model.js";
import { getLevelData, XP_CONFIG } from "../helper/constants.js";
import Activity from "../model/activity.model.js";
import Inventory from "../model/inventory.model.js";
import { updateLeaderboardXP } from "../helper/helper.js";
import { validateSubscription } from "../helper/subscription.js";
import { checkLevelUp } from "../helper/helper.js";
import { calculateDistanceInMeters } from "../helper/helper.js";
import { sendNotification } from "../helper/helper.js";
import PaidPlan from "../model/paidPlans.model.js";
import { getLevelUpNotification } from "../helper/helper.js";

// export const createPin = async (req, res) => {
//   try {
//     console.log("BODY:", req.body);
//     console.log("FILES:", req.files);

//     const {
//       description,
//       bounty,
//       xpScore,
//       latitude,
//       longitude
//     } = req.body || {};

//     const userId = req.user?.id;

//     // parse questions
//     let questions = [];
//     if (req.body.questions) {
//       questions = JSON.parse(req.body.questions);
//     }

//     if (!questions.length) {
//       return res.status(400).json({
//         success: false,
//         message: "Questions are required"
//       });
//     }

//     const imageUrls =
//       req.files?.map(file => file.path || file.filename) || [];

//     const newPin = await Pin.create({
//       questions,
//       description,
//       images: imageUrls,
//       bounty: bounty || 0,
//       xpScore: xpScore || 0,
//       createdBy: userId,
//       location: {
//         // type: "Point",
//         latitude,
//         longitude,
//         // coordinates: [Number(longitude), Number(latitude)]
//       }

//     });

//     res.status(201).json({
//       success: true,
//       message: "Pin created successfully",
//       data: newPin
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

export const createPin = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const { description, bounty, latitude, longitude } = req.body || {};

    const userId = req.user?.id;

    // =========================================
    // VALIDATION
    // =========================================

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // =========================================
    // GET USER
    // =========================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =========================================
    // CHECK USER CREDITS
    // =========================================

    const pinBounty = Number(bounty) || 0;

    // if (user.credits < pinBounty) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Insufficient credits to create pin",
    //   });
    // }

    // =========================================
    // PARSE QUESTIONS
    // =========================================

    let questions = [];

    if (req.body.questions) {
      questions = JSON.parse(req.body.questions);
    }

    if (!questions.length) {
      return res.status(400).json({
        success: false,
        message: "Questions are required",
      });
    }

    // =========================================
    // CALCULATE XP
    // =========================================

    let totalXP = 0;

    questions.forEach(() => {
      totalXP += 30;
    });

    // =========================================
    // IMAGE URLS
    // =========================================

    const imageUrls =
      req.files?.map((file) => file.path || file.filename) || [];

    // =========================================
    // CREATE PIN
    // =========================================

    // =========================================
    // DETERMINE CURRENT PIN MODE
    // =========================================

    // Check user's active subscription
    const activePlan = await PaidPlan.findOne({
      userID: userId,
      planType: "subscription",
      expiryDate: { $gt: new Date() },
    }).sort({ expiryDate: -1 });

    const activeRadius =
      activePlan &&
      ["Civic_Plus", "Civic_Pro"].includes(activePlan.subscriptionType)
        ? 5
        : 1;

    const radiusInMeters = activeRadius * 1609.34;

    // Bounding box
    const latDiff = activeRadius / 69;
    const lngDiff =
      activeRadius / (69 * Math.cos((Number(latitude) * Math.PI) / 180));

    // Active users within last 5 minutes
    const activeUsers = await User.find({
      _id: { $ne: userId },
      latitude: {
        $gte: Number(latitude) - latDiff,
        $lte: Number(latitude) + latDiff,
      },
      longitude: {
        $gte: Number(longitude) - lngDiff,
        $lte: Number(longitude) + lngDiff,
      },
      activeAt: {
        $gte: new Date(Date.now() - 5 * 60 * 1000),
      },
    }).select("latitude longitude");

    let nearbyUserCount = 0;

    for (const nearbyUser of activeUsers) {
      const distance = calculateDistanceInMeters(
        Number(latitude),
        Number(longitude),
        Number(nearbyUser.latitude),
        Number(nearbyUser.longitude),
      );

      if (distance <= radiusInMeters) {
        nearbyUserCount++;
      }
    }

    const activeMode = nearbyUserCount >= 5 ? "normal" : "vanguard";

    // Update latest mode on user
    user.activeRadius = activeRadius;
    user.activeMode = activeMode;

    const newPin = await Pin.create({
      questions,
      description,
      images: imageUrls,
      bounty: pinBounty,
      xpScore: totalXP,
      createdBy: userId,

      activePinMode: activeMode,

      pinStatus: activeMode === "vanguard" ? "verified" : "pending",

      validationType: activeMode === "vanguard" ? "auto" : "community",

      validatedBy: activeMode === "vanguard" ? userId : null,

      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
    });

    // =========================================
    // UPDATE USER REWARDS
    // =========================================
    // const xpReward = 10;
    // user.credits = user.credits - pinBounty + 5;
    // const update_level = user.xp + xpReward;
    // await checkLevelUp(user, update_level);

    // user.xp += xpReward;
    

    // max trust score should not exceed 99.9
    // user.trustScore = Math.min(
    //   99.9,
    //   Number((user.trustScore + 0.1).toFixed(1)),
    // );

    // =========================================
    // LEVEL SYSTEM (OPTIONAL)
    // =========================================

    // const levelData = getLevelData(user.xp);

    // user.level = levelData.level;
    // user.levelName = levelData.name;

    // await user.save();

    // =========================================
// UPDATE USER REWARDS
// =========================================

const xpReward = 10;

user.credits = user.credits - pinBounty + 5;

// Store old level before adding XP
const previousLevel = user.level;

// Calculate new XP
const updatedXP = user.xp + xpReward;

// Existing level-up logic
await checkLevelUp(user, updatedXP);

// Update XP
user.xp = updatedXP;

// Calculate latest level
const levelData = getLevelData(user.xp);

user.level = levelData.level;
user.levelName = levelData.name;

// Trust score
user.trustScore = Math.min(
  99.9,
  Number((user.trustScore + 0.1).toFixed(1)),
);

await user.save();


    // =========================================
// LEVEL UP NOTIFICATION
// =========================================


    // if (user.fcmToken) {
    //   console.log(user.fcmToken);
    //   console.log("get notification");
    //   await sendNotification({
    //     tokens: [user.fcmToken],
    //     title: "🎉 Rewards Earned!",
    //     body: `You earned ${xpReward} XP, +5 Credits and +0.1 Trust Score for creating a pin.`,
    //     data: {
    //       type: "PIN_REWARD",
    //       pinId: newPin._id,
    //       xp: xpReward,
    //       credits: 5,
    //       trustScore: 0.1,
    //     },
    //   });
    // }



if (levelData.level > previousLevel && user.fcmToken) {
  const levelNotification = getLevelUpNotification({
    level: levelData.level,
    levelName: levelData.name,
    emoji: levelData.emoji,
  });

  await sendNotification({
    tokens: [user.fcmToken],

    title: levelNotification.title,

    body: levelNotification.body,

    data: {
      type: "LEVEL_UP",
      level: String(levelData.level),
      levelName: levelData.name,
      emoji: levelData.emoji,
      xp: String(user.xp),
    },
  });
}

    // =========================================
    // UPDATE STATES
    // =========================================

    await updateLeaderboardXP(
      userId,
      xpReward,
      // session // if using transactions
    );

    await States.findOneAndUpdate(
      { userId: userId },

      {
        $inc: {
          pinsDropped: 1,
        },
      },

      {
        new: true,
        upsert: true,
      },
    );

    // =========================================
    // CREATE ACTIVITY LOG
    // =========================================

    await Activity.create({
      userId: userId,

      activityType: "pin_dropped",

      pinId: newPin._id,

      pinTitle: description || "Pin Created",

      images: imageUrls,

      xpEarned: 10,

      creditsSpent: pinBounty,

      activityLocation: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },

      status: "completed",
    });

    // Fetch users having valid coordinates
    const users = await User.find({
      _id: { $ne: userId }, // Exclude pin creator
      latitude: { $ne: null },
      longitude: { $ne: null },
      fcmToken: { $ne: null },
    });

    const nearbyUsers = users.filter((user) => {
      const distance = calculateDistanceInMeters(
        Number(latitude),
        Number(longitude),
        Number(user.latitude),
        Number(user.longitude),
      );

      return distance <= 1609.34; // 1 mile
    });

    const tokens = nearbyUsers.map((user) => user.fcmToken).filter(Boolean);

    console.log("Nearby users:", nearbyUsers.length);
    console.log("FCM Tokens:", tokens);

    await sendNotification({
      tokens,
      title: "📍 New Pin Nearby",
      body: `${user.nickname} dropped a new pin near your location.`,
      data: {
        type: "NEW_PIN",
        pinId: newPin._id,
        userId: user._id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Pin created successfully",
      data: newPin,

      rewards: {
        gainedXP: 10,
        gainedCredits: 5,
        gainedTrustScore: 0.1,
      },

      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAllPins = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Search filter
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } }, // pin title
        { description: { $regex: search, $options: "i" } }, // pin description
        { address: { $regex: search, $options: "i" } }, // pin address
      ];
    }

    const totalRecords = await Pin.countDocuments(filter);

    const pins = await Pin.find(filter)
      .populate("createdBy", "name email")
      .populate("validatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    res.status(200).json({
      success: true,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / limitNumber),
      totalRecords,
      count: pins.length,
      data: pins,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPinById = async (req, res) => {
  try {
    const { id } = req.params;

    // =========================================
    // VALIDATE OBJECT ID
    // =========================================
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pin ID",
      });
    }

    // =========================================
    // GET PIN
    // =========================================
    const pin = await Pin.findById(id)
      .populate("createdBy", "name email profileImage")
      .populate("validatedBy", "name email profileImage xp wallet")
      .populate("beneficiaries", "name email profileImage");

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // =========================================
    // BASE RESPONSE
    // =========================================
    const responseData = {
      success: true,
      data: pin,
    };

    // =========================================
    // IF PIN IS UNDER VALIDATION
    // =========================================
    if (pin.validatedBy && pin.status === "orange") {
      responseData.validationInfo = {
        validator: pin.validatedBy,

        message:
          "This task is currently under validation. You can still join as a beneficiary within 24 hours. Rewards will be credited after successful task completion.",

        rewardInfo: {
          beneficiaryReward: {
            bounty: pin.bounty * 0.5,
            xp: pin.xpScore * 0.5,
          },

          note: "Beneficiary rewards are distributed only after the validator successfully completes the task.",
        },

        taskStatus: pin.status,
      };
    }

    // =========================================
    // IF TASK COMPLETED
    // =========================================
    if (pin.status === "green") {
      responseData.completionInfo = {
        message: "This task has already been completed successfully.",

        completedBy: pin.validatedBy,

        taskStatus: pin.status,
      };
    }

    // =========================================
    // SEND RESPONSE
    // =========================================
    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getNearbyPins = async (req, res) => {
  try {
    const userId = req.user.id;

    await validateSubscription(userId);

    const { latitude, longitude } = req.query;

    // ==============================
    // VALIDATION
    // ==============================

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    // ==============================
    // GET INVENTORY
    // ==============================

    const user = await User.findById(userId);

    const inventory = await Inventory.findOne({ userId });

    // ==============================
    // RADIUS LOGIC
    // ==============================

    //     let radiusInMiles = 1;

    // const radarFlareActive =
    //   inventory?.boosts?.radarFlare?.active?.expiresAt &&
    //   inventory.boosts.radarFlare.active.expiresAt > new Date();

    //     if (radarFlareActive) {
    //       radiusInMiles = 5;
    //     }

    const radarFlareActive =
      inventory?.boosts?.radarFlare?.active?.expiresAt &&
      inventory.boosts.radarFlare.active.expiresAt > new Date();

    let radiusInMiles = 1;
    let isGlobalAccess = false;

    switch (user.tier) {
      case "Civic_Plus":
        radiusInMiles = 10;
        break;

      case "Civic_Pro":
        isGlobalAccess = true;
        break;

      default:
        radiusInMiles = radarFlareActive ? 5 : 1;
    }

    // const radiusInMeters =
    //   radiusInMiles * 1609.34;

    // ==============================
    // XRAY FILTER
    // ==============================

    const xrayFilterActive =
      inventory?.boosts?.XrayFilter?.active?.expiresAt &&
      inventory.boosts.XrayFilter.active.expiresAt > new Date();

    const megaphoneActive =
      inventory?.boosts?.megaphone?.active?.expiresAt &&
      inventory.boosts.megaphone.active.expiresAt > new Date();

    const goldenCargoActive =
      inventory?.boosts?.goldenCargo?.active?.expiresAt &&
      inventory.boosts.goldenCargo.active.expiresAt > new Date();

    // ==============================
    // GET NEARBY PINS
    // ==============================

    // let nearbyPins = await Pin.find({
    //   location: {
    //     $near: {
    //       $geometry: {
    //         type: "Point",

    //         coordinates: [
    //           parseFloat(longitude),
    //           parseFloat(latitude)
    //         ]
    //       },

    //       $maxDistance: radiusInMeters
    //     }
    //   }
    // })
    // .lean();

    let nearbyPins = [];

    if (isGlobalAccess) {
      nearbyPins = await Pin.find({}).lean();
    } else {
      const radiusInMeters = radiusInMiles * 1609.34;

      nearbyPins = await Pin.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: radiusInMeters,
          },
        },
      }).lean();
    }

    // ==============================
    // XRAY FILTER LOGIC
    // ==============================

    if (xrayFilterActive) {
      // Only red pins
      let redPins = nearbyPins.filter((pin) => pin.status === "red");

      // Sort by highest bounty
      redPins.sort((a, b) => b.bounty - a.bounty);

      // If 10+ pins exist
      if (redPins.length >= 10) {
        nearbyPins = redPins.slice(0, 10);
      } else {
        // Show 50% of nearby pins
        const totalPins = nearbyPins.length;

        const halfPins = Math.ceil(totalPins * 0.5);

        nearbyPins = nearbyPins
          .sort((a, b) => b.bounty - a.bounty)
          .slice(0, halfPins);
      }
    }

    // ==============================
    // RESPONSE
    // ==============================

    return res.status(200).json({
      success: true,

      tier: user.tier,

      radius: isGlobalAccess ? "Global" : `${radiusInMiles} Miles`,

      radarFlareActive,

      xrayFilterActive,
      megaphoneActive,
      goldenCargoActive,
      totalPins: nearbyPins.length,

      data: nearbyPins,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const changePinStatus = async (req, res) => {
  try {
    const { pinId } = req.params;
    const { pinStatus } = req.body;

    const allowedStatuses = ["verified", "fake", "pending", "rejected"];

    if (!allowedStatuses.includes(pinStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pin status",
      });
    }

    const pin = await Pin.findById(pinId);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    pin.pinStatus = pinStatus;
    await pin.save();

    return res.status(200).json({
      success: true,
      message: "Pin status updated successfully",
      data: pin,
    });
  } catch (error) {
    console.error("Change Pin Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deletePin = async (req, res) => {
  try {
    const { pinId } = req.params;
    const userId = req.user.id; // From auth middleware

    if (!mongoose.Types.ObjectId.isValid(pinId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Pin ID",
      });
    }

    const pin = await Pin.findById(pinId);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // Only creator can delete
    if (pin.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this pin",
      });
    }

    await Pin.findByIdAndDelete(pinId);

    return res.status(200).json({
      success: true,
      message: "Pin deleted successfully",
    });
  } catch (error) {
    console.error("Delete Pin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
