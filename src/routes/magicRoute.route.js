import express from "express";
import { protect } from "../middleware/auth.middlewere.js";
import { createMagicRoute, getMagicRoutes,updateMagicRouteInvitation,likeMagicRoute,dislikeMagicRoute,submitMagicRouteFeedback,getMagicRouteById,getMyFriendList} from "../controller/magicRoute.controller.js";

const router = express.Router();

router.post("/", protect, createMagicRoute);
router.get("/", getMagicRoutes);
router.patch(
  "/:routeId/invitation",
  protect,
  updateMagicRouteInvitation
);

router.patch(
  "/:routeId/like",
  protect,
  likeMagicRoute
);

router.patch(
  "/:routeId/dislike",
  protect,
  dislikeMagicRoute
);

router.post(
  "/:routeId/feedback",
  protect,
  submitMagicRouteFeedback
);

router.get("/my-friends", protect, getMyFriendList);

router.get(
  "/:routeId",
//   protect, // optional
  getMagicRouteById
);



export default router;