import express from "express";
import {
  validatePin,
  solvePin,
  fakePin,
  makePinBeacon,
  lockPinWithMultiLock,
  markPinAsGone,
} from "../controller/validation.controller.js";
import { protect } from "../middleware/auth.middlewere.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.post("/validate/:pinId", protect, validatePin);
router.post("/solve/:pinId", protect, upload.single("beforeImage"), solvePin);

router.patch("/:pinId/gone", protect, markPinAsGone);

router.post("/fake/:pinId", protect, fakePin);
router.post("/make-beacon", protect, makePinBeacon);
router.post("/lock-pin", protect, lockPinWithMultiLock);

export default router;
