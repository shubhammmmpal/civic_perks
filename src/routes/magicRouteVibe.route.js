import express from "express";
import {
  seedMagicRouteVibes,
  getMagicRouteVibes,
  getMagicRouteVibeById
} from "../controller/magicRouteVibe.controller.js";

const router = express.Router();

router.post("/seed", seedMagicRouteVibes);

router.get("/", getMagicRouteVibes);

router.get("/:id", getMagicRouteVibeById);

export default router;