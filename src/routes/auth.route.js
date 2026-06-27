import express from "express";
import {
  loginWithOTP,
  verifyOTP,
  adminSignup,
  adminSignin,
  generateReferralId,
  getUserByQrToken
} from "../controller/auth.controller.js";
import {
  updateProfile,
  getProfile,
  changeAccountType,
  activeUser,
  getAllStates,
  getStatesByUserID,
  getAllActivities,
  getActivitiesByUserID,
  getUsers,
  deleteUser,
  getUserById,
  updateCredits,
  updateTrustScore,
  suspendUser,
  banUser,
  updateXp
  
} from "../controller/user.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middlewere.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.post("/login", loginWithOTP);
router.post("/verify-otp", verifyOTP);
router.post("/admin/signup", adminSignup);
router.post("/admin/signin", adminSignin);
router.patch("/change-account-type", protect, changeAccountType);

router.put("/update-profile", protect, upload.single("image"), updateProfile);
router.get("/profile", protect, getProfile);
router.put("/active-user", protect, activeUser);
router.get("/users", getUsers);
// router.delete("/users/:userId", deleteUser);
router.post("/generate-referral", generateReferralId);

router.delete("/delete-user/:userId", deleteUser);
// GET ALL STATES
router.get("/states", getAllStates);

// GET STATES BY USER ID
router.get("/states/:userId", getStatesByUserID);
router.get("/activities", getAllActivities);

router.get("/activities/:userId", getActivitiesByUserID);
router.get("/user/:qrToken", getUserByQrToken);

router.get("/:userId", getUserById);


  router.patch("/:userId/credits",  updateCredits);

  router.patch("/:userId/trust-score", updateTrustScore);

  router.patch("/:userId/suspend", suspendUser);

  router.patch("/:userId/ban", banUser);

  router.patch("/:userId/xp", updateXp);

export default router;
