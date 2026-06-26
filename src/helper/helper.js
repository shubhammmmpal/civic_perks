import UserLeaderBoardLog from "../model/userLeaderBoardLog.model.js";


export const calculateDistanceInMeters = (
  lat1,
  lon1,
  lat2,
  lon2,
) => {
  const R = 6371e3;

  const toRad = (value) => (value * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);

  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};


export const updateLeaderboardXP = async (
  userId,
  xp,
  session = null
) => {
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
  let yearData = leaderboard.years.find(
    (y) => y.year === currentYear
  );

  if (!yearData) {
    leaderboard.years.push({
      year: currentYear,
      yearlyPoints: 0,
      months: [],
    });

    yearData =
      leaderboard.years[leaderboard.years.length - 1];
  }

  // ==========================
  // MONTH
  // ==========================
  let monthData = yearData.months.find(
    (m) => m.month === currentMonth
  );

  if (!monthData) {
    yearData.months.push({
      month: currentMonth,
      monthlyPoints: 0,
      weeks: [],
    });

    monthData =
      yearData.months[yearData.months.length - 1];
  }

  // ==========================
  // WEEK
  // ==========================
  let weekData = monthData.weeks.find(
    (w) => w.week === currentWeek
  );

  if (!weekData) {
    monthData.weeks.push({
      week: currentWeek,
      points: 0,
    });

    weekData =
      monthData.weeks[monthData.weeks.length - 1];
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
  const week =
    Math.ceil(
      ((now - firstDayOfYear) / 86400000 +
        firstDayOfYear.getDay() +
        1) /
        7
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

  let yearObj = log.years.find(y => y.year === year);

  if (!yearObj) {
    yearObj = {
      year,
      yearlyPoints: 0,
      months: [],
    };

    log.years.push(yearObj);
  }

  yearObj.yearlyPoints += points;

  let monthObj = yearObj.months.find(
    m => m.month === month
  );

  if (!monthObj) {
    monthObj = {
      month,
      monthlyPoints: 0,
      weeks: [],
    };

    yearObj.months.push(monthObj);
  }

  monthObj.monthlyPoints += points;

  let weekObj = monthObj.weeks.find(
    w => w.week === week
  );

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

  const approvedFriendsCount =
    route.assignedFriends.filter(
      friend => friend.status === "approved"
    ).length;

  if (approvedFriendsCount === 0) {
    return;
  }

  const requiredLikes =
    Math.ceil(approvedFriendsCount * 0.5);

  const currentLikes =
    route.likedBy.length;

  if (currentLikes < requiredLikes) {
    return;
  }

  const creatorRewardXp =
    route.reward.creator.xpMultiplier * 100;

  const creatorTrustScore =
    route.reward.creator.trustScore;

  await User.findByIdAndUpdate(
    route.creatorId,
    {
      $inc: {
        xp: creatorRewardXp,
        trustScore: creatorTrustScore
      }
    }
  );

  await updateLeaderboard(
    route.creatorId,
    creatorRewardXp
  );

  route.rewardStatus.creatorRewardGiven = true;
  route.rewardStatus.rewardedAt = new Date();

  await route.save();
};