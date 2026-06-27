import express from "express";
import {
  getDashboardOverview,
  getUserGrowth,
  getDailyActiveUsers,
  getSubscriptionDistribution,
  getTrustDistribution,
  getLevelDistribution,
  getRecentUsers,
  getTopUsers,
  getRecentSuspensions,
  getLatestPremiumUsers
} from "../controller/dashBoard.controller.js";

// Optional middleware
// import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Apply middleware if needed
// router.use(verifyToken, isAdmin);

router.get("/overview", getDashboardOverview);

router.get("/user-growth", getUserGrowth);

router.get("/daily-active-users", getDailyActiveUsers);

router.get("/subscription-distribution", getSubscriptionDistribution);

router.get("/trust-score-distribution", getTrustDistribution);

router.get("/level-distribution", getLevelDistribution);

router.get("/recent-users", getRecentUsers);

router.get("/top-users", getTopUsers);

router.get("/recent-suspensions", getRecentSuspensions);

router.get("/latest-premium-users", getLatestPremiumUsers);

export default router;