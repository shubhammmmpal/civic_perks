// utils/subscription.js

import User from "../model/user.model.js";

export const validateSubscription = async (userId) => {
  const user = await User.findById(userId);

  if (!user) return null;

  if (
    user.subscriptionStatus === "active" &&
    user.subscriptionEndDate &&
    user.subscriptionEndDate <= new Date()
  ) {
    user.tier = "Free_Tier";
    user.subscriptionStatus = "expired";

    await user.save();
  }

  return user;
};