import express from "express";
import {
  // buyBoost,

  purchaseBoost,
  useInventory,
  getAllInventories,
  getInventoryById,
  getInventoryByUserId,
  deleteInventory,
  getMyInventory,
  useMegaphone,
  useGoldenCargo,
  useHexParty,
  useFastTrackJury,
  getBoostPurchaseHistory,
  useBeacon,
  useMultiLock
} from "../controller/paidPlain.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middlewere.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// router.post("/buy-boost", protect, buyBoost);
router.post("/purchase-boost", protect, purchaseBoost);
router.post("/use-inventory", protect, useInventory);
router.get("/inventories", getAllInventories);
router.get("/inventories/user", protect, getMyInventory);
router.post("/use-megaphone", protect, useMegaphone);
router.post("/use-golden-cargo", protect, useGoldenCargo);
router.post("/use-hex-party", protect, useHexParty);
router.post("/use-fast-track-jury", protect, useFastTrackJury);
router.post("/use-beacon", protect, useBeacon);
router.post("/use-multi-lock",protect, useMultiLock);
router.get("/boosts", protect, getBoostPurchaseHistory);
router.get("/inventories/:inventoryId",getInventoryById);
router.delete("/inventories/:inventoryId", deleteInventory);

export default router;
