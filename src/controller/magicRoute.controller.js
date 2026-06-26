import mongoose from "mongoose";
import MagicRoute from "../model/magicRoute.model.js";
import MagicRouteFeedback from "../model/magicRouteFeedback.model.js";
import User from "../model/user.model.js";
import Inventory from "../model/inventory.model.js";
import Friend from "../model/friend.model.js";
import UserLeaderBoardLog from "../model/userLeaderBoardLog.model.js";
import { updateLeaderboard, processCreatorReward } from "../helper/helper.js";


const getRandomBooster = () => {
  const random = Math.random();

  if (random < 0.5) return "radarFlare";
  if (random < 0.8) return "XrayFilter";
  if (random < 0.95) return "goldenCargo";

  return "megaphone";
};

export const createMagicRoute = async (req, res) => {
  try {
    const { routeName, routes, status, scheduledDate, assignedFriends } =
      req.body;

    const creatorId = req.user.id;

    if (!routeName) {
      return res.status(400).json({
        success: false,
        message: "Route name is required",
      });
    }

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date is required",
      });
    }

    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one route point is required",
      });
    }

    if (routes.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 route points allowed",
      });
    }

    const booster = getRandomBooster();

    const magicRoute = await MagicRoute.create({
      creatorId,
      routeName,
      routes,
      status: status || "scheduled",
      scheduledDate,
      assignedFriends: assignedFriends || [],
      reward: {
        creator: {
          xpMultiplier: 2,
          trustScore: 0.5,
        },
        joinee: {
          baseXp: 100,
          xpMultiplier: 2,
          booster,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Magic Route created successfully",
      data: magicRoute,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMagicRoutes = async (req, res) => {
  try {
    const { userId } = req.query;

    let query = {};

    if (userId) {
      query = {
        $or: [
          {
            creatorId: new mongoose.Types.ObjectId(userId),
          },
          {
            "assignedFriends.userId": new mongoose.Types.ObjectId(userId),
          },
        ],
      };
    }

    const routes = await MagicRoute.find(query)
      .populate("creatorId", "name email profileImage")
      .populate("assignedFriends.userId", "name email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: routes.length,
      data: routes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMagicRouteById = async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await MagicRoute.findById(routeId)
      .populate(
        "creatorId",
        "name nickname image trustScore level xp"
      )
      .populate(
        "assignedFriends.userId",
        "name nickname image"
      );

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Magic Route not found",
      });
    }

    const userId = req.user?.id;

    const isLiked = userId
      ? route.likedBy.some(
          id => id.toString() === userId
        )
      : false;

    const isDisliked = userId
      ? route.dislikedBy.some(
          id => id.toString() === userId
        )
      : false;

    return res.status(200).json({
      success: true,
      data: {
        ...route.toObject(),

        likesCount: route.likedBy.length,

        dislikesCount: route.dislikedBy.length,

        isLiked,

        isDisliked,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMagicRouteInvitation = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { status } = req.body;

    const userId = req.user.id;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    const magicRoute = await MagicRoute.findById(routeId);

    if (!magicRoute) {
      return res.status(404).json({
        success: false,
        message: "Magic Route not found",
      });
    }

    const friendIndex = magicRoute.assignedFriends.findIndex(
      (friend) => friend.userId.toString() === userId,
    );

    if (friendIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this route",
      });
    }

    magicRoute.assignedFriends[friendIndex].status = status;
    magicRoute.assignedFriends[friendIndex].respondedAt = new Date();

    await magicRoute.save();

    return res.status(200).json({
      success: true,
      message: `Route ${status} successfully`,
      data: magicRoute,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const likeMagicRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const userId = req.user.id;

    const route = await MagicRoute.findById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Magic Route not found",
      });
    }

    const alreadyLiked = route.likedBy.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      route.likedBy = route.likedBy.filter((id) => id.toString() !== userId);

      await route.save();

      return res.status(200).json({
        success: true,
        message: "Like removed",
        likes: route.likedBy.length,
        dislikes: route.dislikedBy.length,
      });
    }

    route.dislikedBy = route.dislikedBy.filter(
      (id) => id.toString() !== userId,
    );

    route.likedBy.push(userId);

    await route.save();

    await processCreatorReward(route);

    return res.status(200).json({
      success: true,
      message: "Route liked successfully",
      likes: route.likedBy.length,
      dislikes: route.dislikedBy.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const dislikeMagicRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const userId = req.user.id;

    const route = await MagicRoute.findById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Magic Route not found",
      });
    }

    const alreadyDisliked = route.dislikedBy.some(
      (id) => id.toString() === userId,
    );

    if (alreadyDisliked) {
      route.dislikedBy = route.dislikedBy.filter(
        (id) => id.toString() !== userId,
      );

      await route.save();

      return res.status(200).json({
        success: true,
        message: "Dislike removed",
        likes: route.likedBy.length,
        dislikes: route.dislikedBy.length,
      });
    }

    route.likedBy = route.likedBy.filter((id) => id.toString() !== userId);

    route.dislikedBy.push(userId);

    await route.save();

    return res.status(200).json({
      success: true,
      message: "Route disliked successfully",
      likes: route.likedBy.length,
      dislikes: route.dislikedBy.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const submitMagicRouteFeedback = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { message } = req.body;

    const userId = req.user.id;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Feedback message is required",
      });
    }

    const route = await MagicRoute.findById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Magic Route not found",
      });
    }

    const assignedFriend = route.assignedFriends.find(
      (friend) =>
        friend.userId.toString() === userId && friend.status === "approved",
    );

    if (!assignedFriend) {
      return res.status(403).json({
        success: false,
        message: "Only approved assigned friends can submit feedback",
      });
    }

    const existing = await MagicRouteFeedback.findOne({
      routeId,
      userId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Feedback already submitted for this route",
      });
    }

    const booster = route.reward?.joinee?.booster;

    const feedback = await MagicRouteFeedback.create({
      routeId,
      userId,
      message,
      awardedXp: 100,
      awardedBooster: booster,
    });

    await User.findByIdAndUpdate(userId, {
      $inc: {
        xp: 100,
      },
    });

    await updateLeaderboard(userId, 100);

    let inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      inventory = await Inventory.create({
        userId,
      });
    }

    if (booster && inventory.boosts[booster]) {
      inventory.boosts[booster].quantity += 1;

      await inventory.save();
    }

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      rewards: {
        xp: 100,
        booster,
      },
      data: feedback,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyFriendList = async (req, res) => {
  try {
    console.log(req.user.id)
    const friends = await Friend.findOne({ userId: req.user.id })
      .populate("friendList", "name email profileImage username");

    return res.status(200).json({
      success: true,
      totalFriends: friends?.friendList?.length || 0,
      friends: friends?.friendList || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
