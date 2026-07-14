import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import puppeteer from "puppeteer";
import QRCode from "qrcode";

import User from "../model/user.model.js";
import States from "../model/states.model.js";
import PdfDownload from "../model/pdfDownload.model.js";
import Validation from "../model/validation.model.js";

handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

export const downloadUserPdf = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
      // FREE: Only last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      dateFilter = { solvedAt: { $gte: oneWeekAgo } };

      // Check download limit
      const alreadyDownloaded = await PdfDownload.findOne({
        user: user._id,
        reportType: "FREE",
        downloadedAt: { $gte: oneWeekAgo },
      });

      if (alreadyDownloaded) {
        return res.status(403).json({
          success: false,
          message:
            "Free Tier users can download their report only once every 7 days.",
        });
      }
    } else if (reportType === "PRO" && startDate && endDate) {
      // PRO: Allow custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid date format" });
      }

      dateFilter = { solvedAt: { $gte: start, $lte: end } };
    } else {
      // HIGH or PRO without date range → default to last 365 days
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      dateFilter = { solvedAt: { $gte: oneYearAgo } };
    }

    // ==================== NEW: Fetch Validations ====================
    const validations = await Validation.find({
      $or: [
        { validatedBy: user._id }, // User was the validator
        { beneficiaries: user._id }, // User was a beneficiary
      ],
    })
      .sort({ solvedAt: -1, createdAt: -1 })
      .limit(6) // Show last 6 actions
      .populate(
        "pinID",
        "title description location address category status images",
      ) // adjust fields as per your Pin model
      .populate("validatedBy", "name nickname")
      .populate("beneficiaries", "name nickname");

    // Format for template
    const recentActions = validations.map((v) => ({
      id: v._id.toString(),
      date: v.solvedAt
        ? v.solvedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Pending",
      title: v.pinID?.title || "Community Action",
      description: v.pinID?.description?.substring(0, 120) + "..." || "",
      category: v.pinID?.category || "General",
      status: v.status,
      validator: v.validatedBy?.nickname || v.validatedBy?.name || "Anonymous",
      beneficiaries:
        v.beneficiaries?.map((b) => b.nickname || b.name).filter(Boolean) || [],
      timeTaken: v.timeTaken || null,
    }));

    // Determine report type

    await PdfDownload.create({
      user: user._id,
      reportType,
    });

    // const qrCode = await QRCode.toDataURL(
    //   JSON.stringify({
    //     qrToken: user.qrToken,
    //   }),
    // );

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "userProfile.hbs",
    );

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
      image: user.image, // if you want to use it
      totalInterventions: stats?.pinsValidated ?? 0,
      totalHoursServed: stats?.hoursServed ?? 0,
      qrCode: user.qrCode, // Assuming qrCode is a field in the User model
      recentActions,
      userId: user._id.toString(), // for Document ID in PRO
      // levelName: getLevelName(user.level), // optional
    });



console.log("Expected executable:", puppeteer.executablePath());

const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
  ],
});

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${user.name}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
