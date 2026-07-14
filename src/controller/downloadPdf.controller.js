import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import QRCode from "qrcode";

import User from "../model/user.model.js";
import States from "../model/states.model.js";
import PdfDownload from "../model/pdfDownload.model.js";
import Validation from "../model/validation.model.js";

handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

export const downloadUserPdf = async (req, res) => {
  let browser = null;

  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const stats = await States.findOne({ userId: user._id });

    let reportType =
      user.tier === "Civic_Plus" || user.tier === "Civic_Pro"
        ? "PRO"
        : user.level >= 10
          ? "HIGH"
          : "FREE";

    let dateFilter = {};
    if (reportType === "FREE") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { solvedAt: { $gte: oneWeekAgo } };

      const alreadyDownloaded = await PdfDownload.findOne({
        user: user._id,
        reportType: "FREE",
        downloadedAt: { $gte: oneWeekAgo },
      });

      if (alreadyDownloaded) {
        return res.status(403).json({
          success: false,
          message: "Free Tier users can download their report only once every 7 days.",
        });
      }
    } else if (reportType === "PRO" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date format" });
      }

      dateFilter = { solvedAt: { $gte: start, $lte: end } };
    } else {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      dateFilter = { solvedAt: { $gte: oneYearAgo } };
    }

    // Fetch Validations
    const validations = await Validation.find({
      $or: [
        { validatedBy: user._id },
        { beneficiaries: user._id },
      ],
    })
      .sort({ solvedAt: -1, createdAt: -1 })
      .limit(6)
      .populate("pinID", "title description location address category status images")
      .populate("validatedBy", "name nickname")
      .populate("beneficiaries", "name nickname");

    const recentActions = validations.map((v) => ({
      id: v._id.toString(),
      date: v.solvedAt
        ? v.solvedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Pending",
      title: v.pinID?.title || "Community Action",
      description: v.pinID?.description?.substring(0, 120) + "..." || "",
      category: v.pinID?.category || "General",
      status: v.status,
      validator: v.validatedBy?.nickname || v.validatedBy?.name || "Anonymous",
      beneficiaries: v.beneficiaries?.map((b) => b.nickname || b.name).filter(Boolean) || [],
      timeTaken: v.timeTaken || null,
    }));

    await PdfDownload.create({ user: user._id, reportType });

    // Render HTML
    const templatePath = path.join(process.cwd(), "templates", "userProfile.hbs");
    const source = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(source);

    const html = template({
      reportType,
      name: user.name,
      email: user.email,
      nickname: user.nickname,
      trustScore: user.trustScore || 0,
      level: user.level,
      tier: user.tier,
      image: user.image,
      totalInterventions: stats?.pinsValidated ?? 0,
      totalHoursServed: stats?.hoursServed ?? 0,
      qrCode: user.qrCode,
      recentActions,
      userId: user._id.toString(),
    });

    // ==================== PUPPETEER LAUNCH (Render Optimized) ====================
    console.log("Launching Puppeteer with @sparticuz/chromium...");

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    });

    await browser.close();
    browser = null;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${user.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate PDF",
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("Browser close error:", e);
      }
    }
  }
};