import UserLeaderBoardLog from "../model/userLeaderBoardLog.model.js";
import User from "../model/user.model.js";
import Friend from "../model/friend.model.js"

export const getLeaderboard = async (req, res) => {
  try {
    const { type = "currentWeek" } = req.query;

    const now = new Date();

    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let week = Math.ceil(now.getDate() / 7);

    // ==========================
    // HANDLE LAST PERIODS
    // ==========================

    if (type === "lastYear") {
      year -= 1;
    }

    if (type === "lastMonth") {
      month -= 1;

      if (month === 0) {
        month = 12;
        year -= 1;
      }
    }

    if (type === "lastWeek") {
      week -= 1;

      if (week === 0) {
        month -= 1;

        if (month === 0) {
          month = 12;
          year -= 1;
        }

        // assume max 5 weeks
        week = 5;
      }
    }

    // ==========================
    // FETCH LEADERBOARD
    // ==========================

    const leaderboardLogs =
      await UserLeaderBoardLog.find()
        .populate("userId", "name username profileImage")
        .lean();

    let leaderboard = [];

    for (const log of leaderboardLogs) {
      let points = 0;

      const yearData = log.years.find(
        (y) => y.year === year
      );

      if (!yearData) continue;

      switch (type) {
        case "currentYear":
        case "lastYear":
          points = yearData.yearlyPoints;
          break;

        case "currentMonth":
        case "lastMonth": {
          const monthData = yearData.months.find(
            (m) => m.month === month
          );

          points = monthData?.monthlyPoints || 0;
          break;
        }

        case "currentWeek":
        case "lastWeek": {
          const monthData = yearData.months.find(
            (m) => m.month === month
          );

          const weekData = monthData?.weeks.find(
            (w) => w.week === week
          );

          points = weekData?.points || 0;

          break;
        }

        default:
          points = log.totalPoints;
      }

      leaderboard.push({
        user: log.userId,
        points,
      });
    }

    // ==========================
    // SORT DESCENDING
    // ==========================

    leaderboard.sort(
      (a, b) => b.points - a.points
    );

    // ==========================
    // ADD RANK
    // ==========================

    leaderboard = leaderboard.map(
      (item, index) => ({
        rank: index + 1,
        ...item,
      })
    );

    return res.status(200).json({
      success: true,
      type,
      leaderboard,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFriendsLeaderboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "currentWeek" } = req.query;

    const now = new Date();

    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let week = Math.ceil(now.getDate() / 7);

    // ==========================
    // HANDLE LAST PERIODS
    // ==========================

    if (type === "lastYear") {
      year--;
    }

    if (type === "lastMonth") {
      month--;

      if (month === 0) {
        month = 12;
        year--;
      }
    }

    if (type === "lastWeek") {
      week--;

      if (week === 0) {
        month--;

        if (month === 0) {
          month = 12;
          year--;
        }

        week = 5;
      }
    }

    // ==========================
    // GET FRIENDS
    // ==========================

    const friendDoc = await Friend.findOne({
      userId,
    });

    const friendIds = friendDoc?.friendList || [];

    // Include self
    const userIds = [
      userId,
      ...friendIds.map((id) => id.toString()),
    ];

    // ==========================
    // GET LEADERBOARD DATA
    // ==========================

    const leaderboardLogs =
      await UserLeaderBoardLog.find({
        userId: { $in: userIds },
      })
        .populate(
          "userId",
          "name username profileImage xp level"
        )
        .lean();

    const leaderboard = [];

    for (const log of leaderboardLogs) {
      let points = 0;

      const yearData = log.years.find(
        (y) => y.year === year
      );

      if (!yearData) continue;

      switch (type) {
        case "currentYear":
        case "lastYear":
          points = yearData.yearlyPoints;
          break;

        case "currentMonth":
        case "lastMonth": {
          const monthData = yearData.months.find(
            (m) => m.month === month
          );

          points = monthData?.monthlyPoints || 0;
          break;
        }

        case "currentWeek":
        case "lastWeek": {
          const monthData = yearData.months.find(
            (m) => m.month === month
          );

          const weekData = monthData?.weeks.find(
            (w) => w.week === week
          );

          points = weekData?.points || 0;
          break;
        }

        default:
          points = log.totalPoints;
      }

      leaderboard.push({
        user: log.userId,
        points,
      });
    }

    // ==========================
    // SORT & RANK
    // ==========================

    leaderboard.sort(
      (a, b) => b.points - a.points
    );

    const rankedLeaderboard = leaderboard.map(
      (item, index) => ({
        rank: index + 1,
        ...item,
      })
    );

    return res.status(200).json({
      success: true,
      type,
      totalFriends: friendIds.length,
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};