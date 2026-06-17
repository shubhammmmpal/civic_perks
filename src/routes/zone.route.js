import express from "express";
import {
  submitZoneTag
} from "../controller/zone.controller.js";
import { protect } from "../middleware/auth.middlewere.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.post("/report",protect, submitZoneTag);

export default router;