import express from "express";

const router = express.Router();

import { createPin,getAllPins,getPinById,getNearbyPins,changePinStatus } from "../controller/pin.controller.js";


// middleware (JWT auth)
import { protect } from "../middleware/auth.middlewere.js";
import { upload } from "../config/multer.js";

// router.post("/pins", protect, createPin);
router.post(
  "/pins",
  protect,
  upload.array("images", 5), // 👈 ye missing hota hai mostly
  createPin
);

// Get all pins
router.get("/pins", getAllPins);

// Get single pin
router.get("/pins/:id", getPinById);

router.patch("/change-status/:pinId", changePinStatus);

router.get(
  "/nearby-pins",
  protect,
  getNearbyPins
);

export default router;