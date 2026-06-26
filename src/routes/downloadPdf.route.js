import express from "express";
import { downloadUserPdf } from "../controller/downloadPdf.controller.js";

const router = express.Router();

router.get("/download-pdf/:userId", downloadUserPdf);
export default router;