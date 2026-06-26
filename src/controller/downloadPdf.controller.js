import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import puppeteer from "puppeteer";
import QRCode from "qrcode";

import User from "../model/user.model.js";

export const downloadUserPdf = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const qrCode = await QRCode.toDataURL(
      JSON.stringify({
        userId: user._id,
      })
    );

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "userProfile.hbs"
    );

    const source = fs.readFileSync(templatePath, "utf8");

    const template = handlebars.compile(source);

    const html = template({
      name: user.name,
      email: user.email,
      nickname: user.nickname,
      trustScore: user.trustScore,
      level: user.level,
      tier: user.tier,
      image: user.image,
      qrCode,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
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