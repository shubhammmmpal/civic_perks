import express from "express";
import {
  getLeaderboard,
  getFriendsLeaderboard,
} from "../controller/leaderboard.controller.js";
import { protect } from "../middleware/auth.middlewere.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.get(
  "/",
//   protect,
  getLeaderboard
);

router.get(
  "/friends-leaderboard",
  protect,
  getFriendsLeaderboard
);

export default router;




