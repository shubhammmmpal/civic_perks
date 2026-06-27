import User from "../model/user.model.js"
export const getDashboardOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeToday,
      premiumUsers,
      freeUsers,
      suspendedUsers,
      bannedUsers,
      credits,
      xp,
      trust,
      level,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        activeAt: { $gte: today },
      }),

      User.countDocuments({
        tier: { $in: ["Civic_Plus", "Civic_Pro"] },
      }),

      User.countDocuments({
        tier: "Free_Tier",
      }),

      User.countDocuments({
        status: "suspended",
      }),

      User.countDocuments({
        status: "banned",
      }),

      User.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$credits",
            },
          },
        },
      ]),

      User.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$xp",
            },
          },
        },
      ]),

      User.aggregate([
        {
          $group: {
            _id: null,
            avg: {
              $avg: "$trustScore",
            },
          },
        },
      ]),

      User.aggregate([
        {
          $group: {
            _id: null,
            avg: {
              $avg: "$level",
            },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeToday,
        premiumUsers,
        freeUsers,
        suspendedUsers,
        bannedUsers,
        totalCredits: credits[0]?.total || 0,
        totalXP: xp[0]?.total || 0,
        averageTrustScore: Number((trust[0]?.avg || 0).toFixed(1)),
        averageLevel: Number((level[0]?.avg || 0).toFixed(1)),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getUserGrowth = async (req, res) => {
  const days = Number(req.query.days) || 30;

  const start = new Date();
  start.setDate(start.getDate() - days);

  const data = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        users: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  res.json(data);
};

export const getDailyActiveUsers = async (req, res) => {
  const days = Number(req.query.days) || 30;

  const start = new Date();
  start.setDate(start.getDate() - days);

  const data = await User.aggregate([
    {
      $match: {
        activeAt: {
          $gte: start,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$activeAt",
          },
        },
        users: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  res.json(data);
};

export const getSubscriptionDistribution = async(req,res)=>{

const data = await User.aggregate([
{
$group:{
_id:"$tier",
count:{
$sum:1
}
}
}
]);

res.json(data);

}

export const getTrustDistribution = async(req,res)=>{

const data = await User.aggregate([
{
$bucket:{
groupBy:"$trustScore",
boundaries:[0,20,40,60,80,100],
default:"Others",
output:{
count:{
$sum:1
}
}
}
}
]);

res.json(data);

}

export const getLevelDistribution = async(req,res)=>{

const data = await User.aggregate([
{
$group:{
_id:"$level",
users:{
$sum:1
}
}
},
{
$sort:{
_id:1
}
}
]);

res.json(data);

}

export const getRecentUsers = async(req,res)=>{

const users = await User.find()
.sort({
createdAt:-1
})
.limit(10)
.select("name nickname email image tier level credits trustScore createdAt");

res.json(users);

}

export const getTopUsers = async(req,res)=>{

const users = await User.find()
.sort({
xp:-1,
credits:-1
})
.limit(10)
.select("name image xp level credits trustScore");

res.json(users);

}

export const getRecentSuspensions = async(req,res)=>{

const users = await User.find({
status:"suspended"
})
.sort({
updatedAt:-1
})
.limit(10)
.select("name image suspendReason suspendedUntil");

res.json(users);

}

export const getLatestPremiumUsers = async(req,res)=>{

const users = await User.find({
tier:{
$in:["Civic_Plus","Civic_Pro"]
}
})
.sort({
subscriptionStartDate:-1
})
.limit(10)
.select("name image tier subscriptionStartDate subscriptionEndDate");

res.json(users);

}