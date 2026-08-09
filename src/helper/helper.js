import UserLeaderBoardLog from "../model/userLeaderBoardLog.model.js";
import User from "../model/user.model.js";
import { xpSystem } from "../helper/constants.js";
import Notification from "../model/notification.model.js";
import { getLevelData } from "../helper/constants.js";
import { messaging } from "../config/firebase.js";


export const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;

  const toRad = (value) => (value * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);

  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const updateLeaderboardXP = async (userId, xp, session = null) => {
  const now = new Date();

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentWeek = Math.ceil(now.getDate() / 7);

  let leaderboard = await UserLeaderBoardLog.findOne({
    userId,
  }).session(session);

  // Create leaderboard document if not exists
  if (!leaderboard) {
    leaderboard = new UserLeaderBoardLog({
      userId,
      totalPoints: 0,
      years: [],
    });
  }

  // ==========================
  // YEAR
  // ==========================
  let yearData = leaderboard.years.find((y) => y.year === currentYear);

  if (!yearData) {
    leaderboard.years.push({
      year: currentYear,
      yearlyPoints: 0,
      months: [],
    });

    yearData = leaderboard.years[leaderboard.years.length - 1];
  }

  // ==========================
  // MONTH
  // ==========================
  let monthData = yearData.months.find((m) => m.month === currentMonth);

  if (!monthData) {
    yearData.months.push({
      month: currentMonth,
      monthlyPoints: 0,
      weeks: [],
    });

    monthData = yearData.months[yearData.months.length - 1];
  }

  // ==========================
  // WEEK
  // ==========================
  let weekData = monthData.weeks.find((w) => w.week === currentWeek);

  if (!weekData) {
    monthData.weeks.push({
      week: currentWeek,
      points: 0,
    });

    weekData = monthData.weeks[monthData.weeks.length - 1];
  }

  // ==========================
  // UPDATE POINTS
  // ==========================
  leaderboard.totalPoints += xp;
  yearData.yearlyPoints += xp;
  monthData.monthlyPoints += xp;
  weekData.points += xp;

  await leaderboard.save({ session });
};

export const getRandomBooster = () => {
  const random = Math.random();

  if (random < 0.5) {
    return "radarFlare"; // 50%
  }

  if (random < 0.8) {
    return "XrayFilter"; // 30%
  }

  if (random < 0.95) {
    return "goldenCargo"; // 15%
  }

  return "megaphone"; // 5%
};

export const updateLeaderboard = async (userId, points) => {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const firstDayOfYear = new Date(year, 0, 1);
  const week = Math.ceil(
    ((now - firstDayOfYear) / 86400000 + firstDayOfYear.getDay() + 1) / 7,
  );

  let log = await UserLeaderBoardLog.findOne({ userId });

  if (!log) {
    log = await UserLeaderBoardLog.create({
      userId,
      totalPoints: 0,
      years: [],
    });
  }

  log.totalPoints += points;

  let yearObj = log.years.find((y) => y.year === year);

  if (!yearObj) {
    yearObj = {
      year,
      yearlyPoints: 0,
      months: [],
    };

    log.years.push(yearObj);
  }

  yearObj.yearlyPoints += points;

  let monthObj = yearObj.months.find((m) => m.month === month);

  if (!monthObj) {
    monthObj = {
      month,
      monthlyPoints: 0,
      weeks: [],
    };

    yearObj.months.push(monthObj);
  }

  monthObj.monthlyPoints += points;

  let weekObj = monthObj.weeks.find((w) => w.week === week);

  if (!weekObj) {
    weekObj = {
      week,
      points: 0,
    };

    monthObj.weeks.push(weekObj);
  }

  weekObj.points += points;

  await log.save();
};

export const processCreatorReward = async (route) => {
  if (route.rewardStatus?.creatorRewardGiven) {
    return;
  }

  const approvedFriendsCount = route.assignedFriends.filter(
    (friend) => friend.status === "approved",
  ).length;

  if (approvedFriendsCount === 0) {
    return;
  }

  const requiredLikes = Math.ceil(approvedFriendsCount * 0.5);

  const currentLikes = route.likedBy.length;

  if (currentLikes < requiredLikes) {
    return;
  }

  const creatorRewardXp = route.reward.creator.xpMultiplier * 100;

  const creatorTrustScore = route.reward.creator.trustScore;

  await User.findByIdAndUpdate(route.creatorId, {
    $inc: {
      xp: creatorRewardXp,
      trustScore: creatorTrustScore,
    },
  });

  await updateLeaderboard(route.creatorId, creatorRewardXp);

  route.rewardStatus.creatorRewardGiven = true;
  route.rewardStatus.rewardedAt = new Date();

  await route.save();
};

export const checkLevelUp = async (user,updated_lavel, session = null) => {
  console.log("entred");
  const levelData = getLevelData(updated_lavel);
  console.log(user.xp)
console.log("''''''''''''''''''''''")
console.log(user.level, levelData.level)
  // No level up
  if (user.level > levelData.level) {
    return false;
  }

  console.log("-------------")

  const oldLevel = user.level;
  console.log("==================")

  user.level = levelData.level;
  console.log("++++++++++++++++")
  user.levelName = levelData.name;

  try {
    await user.save({ session });
    console.log("entered 2");
  } catch (err) {
    console.error("User save failed:", err);
    throw err;
  }
  console.log("entered 2");

  await Notification.create(
    [
      {
        title: "🎉 Level Up!",
        description: `Congratulations! You reached Level ${levelData.level} (${levelData.name}).`,
        notificationType: "private",
        receivers: [user._id],
        senderRole: "system",
      },
    ],
    { session },
  );

  console.log("entred 3");

  if (user.fcmToken) {
    try {
      await messaging.send({
        token: user.fcmToken,
        notification: {
          title: "🎉 Level Up!",
          body: `You reached Level ${levelData.level} (${levelData.name})`,
        },
        data: {
          type: "LEVEL_UP",
          level: String(levelData.level),
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  console.log("entred 4");

  return {
    oldLevel,
    newLevel: levelData.level,
  };
};


// import admin from "../config/firebase.js";

/**
 * Send push notification to multiple users
 *
 * @param {Object} options
 * @param {string[]} options.tokens
 * @param {string} options.title
 * @param {string} options.body
 * @param {Object} options.data
 */
export const sendNotification = async ({
  tokens = [],
  title,
  body,
  data = {},
}) => {
  try {
    // Remove invalid tokens
    tokens = [...new Set(tokens.filter(Boolean))];

    if (!tokens.length) {
      return {
        success: false,
        message: "No valid FCM tokens found.",
      };
    }

    const message = {
      tokens,

      notification: {
        title,
        body,
      },

      data: Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {}),
    };

    const response = await messaging.sendEachForMulticast(message);

    console.log("Notifications sent:", response.successCount);
    console.log("Notifications failed:", response.failureCount);

    // Optional: Remove invalid tokens from DB
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        console.error(
          `Notification failed for token ${tokens[index]}`,
          resp.error.message
        );
      }
    });

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("FCM Notification Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};


export const getLevelUpNotification = ({
  level,
  levelName,
  emoji,
}) => {
  // =========================================
  // BIG MILESTONES
  // =========================================

  if (level === 5) {
    return {
      title: "The observer becomes the builder.",
      body: `Milestone reached: You are officially a verified ${levelName} ${emoji}. You’ve transitioned from simply recording data to actively shaping the physical reality of your neighborhood.`,
    };
  }

  if (level === 15) {
    return {
      title: "A profound weight accepted.",
      body: `You have unlocked the rank of ${levelName} ${emoji}. The scales of justice are in your hands—your moderation powers ("Jury Duty") are now live on the system. Rule with quiet clarity.`,
    };
  }

  if (level === 20) {
    return {
      title: "You are the City Soul.",
      body: `Absolute dedication achieved. You have ascended to ${levelName} ${emoji}. Thousands of hours, countless real-world actions. You are the living, breathing aura of the ecosystem.`,
    };
  }

  // =========================================
  // TIER 1 — LEVELS 1–5
  // =========================================

  if (level >= 1 && level <= 5) {
    return {
      title: "A new lens on your neighborhood",
      body: `You are expanding your presence. You have unlocked Level ${levelName} ${emoji}. The streets around you are starting to notice your attention.`,
    };
  }

  // =========================================
  // TIER 2 — LEVELS 6–10
  // =========================================

  if (level >= 6 && level <= 10) {
    return {
      title: "Responsibility deepened",
      body: `You are no longer just watching. As a ${levelName} ${emoji}, your efforts are actively piercing the blind spots of the city matrix. Check your private dashboard to see your footprint.`,
    };
  }

  // =========================================
  // TIER 3 — LEVELS 11–15
  // =========================================

  if (level >= 11 && level <= 15) {
    return {
      title: "A foundational pillar",
      body: `The community map stands firmer because of your consistency. You have achieved the rank of ${levelName} ${emoji}. You are holding the local grid together.`,
    };
  }

  // =========================================
  // TIER 4 — LEVELS 16–20
  // =========================================

  if (level >= 16 && level <= 20) {
    return {
      title: "The matrix shifts",
      body: `You aren't just navigating the city; you are fundamentally rewriting how it operates. You have ascended to ${levelName} ${emoji}. Your dedication radiates through the real world.`,
    };
  }

  // =========================================
  // FALLBACK
  // =========================================

  return {
    title: "Level Up! 🎉",
    body: `You reached Level ${level}: ${levelName} ${emoji}. Keep shaping your community.`,
  };
};
