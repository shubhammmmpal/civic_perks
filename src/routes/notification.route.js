import express from "express"
const router = express.Router();
import { protect } from "../middleware/auth.middlewere.js";
import { getUserNotifications, createNotification,getMyNotifications,sendPushNotificationToAllUsers } from"../controller/notification.controller.js";
router.get("/", protect, getUserNotifications);
router.post("/notification", protect , createNotification)
router.get("/my-notification", protect, getMyNotifications)
router.post("/push-notification/all", sendPushNotificationToAllUsers);
// router.post("/notification", auth , createNotification)
// router.get("/my", auth, getMyNotifications)
export default router;