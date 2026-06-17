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