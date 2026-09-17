import express from "express";
import {
  submitZoneTag,
  getAllZones,
  getZoneById,
  getZoneByHexagonId,
  voteZoneQuality,
} from "../controller/zone.controller.js";
import { protect } from "../middleware/auth.middlewere.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.post("/report", protect, submitZoneTag);
router.post(
  "/:hexagonId/vote",
  protect,
  voteZoneQuality,
);
router.get("/", getAllZones);

router.get("/id/:id", getZoneById);

router.get("/hexagon/:hexagonId", getZoneByHexagonId);

export default router;
