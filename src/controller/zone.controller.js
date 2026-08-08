import Zone from "../model/zone.model.js";
import ZoneReporter from "../model/zoneReporter.model.js";
import User from "../model/user.model.js";
import mongoose from "mongoose";


// export const submitZoneTag = async (req, res) => {
//   try {
//     const {
//       hexagonId,
//       category,
//       latitude,
//       longitude,
//     } = req.body;

//         console.log(req.user.id)

//     const userId = req.user.id;

//     const user = await User.findById(userId);

//      const userLevel = user.level;

//     if (!hexagonId || !category) {
//       return res.status(400).json({
//         success: false,
//         message: "hexagonId and category are required",
//       });
//     }

//     // Prevent duplicate submissions
//     const existingReport = await ZoneReporter.findOne({
//       userId,
//       hexagonId,
//     });

//     if (existingReport) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "You have already submitted a tag for this zone.",
//       });
//     }

//     // Find or Create Zone
//     let zone = await Zone.findOne({ hexagonId });

//     if (!zone) {
//       zone = await Zone.create({
//         hexagonId,
//       });
//     }

//     // Create report
//     await ZoneReporter.create({
//       zoneId: zone._id,
//       hexagonId,
//       userId,
//       category,
//       voteWeight: userLevel,
//       userLevel,
//       gpsLocation: {
//         latitude,
//         longitude,
//       },
//       expiresAt: new Date(
//         Date.now() + 30 * 24 * 60 * 60 * 1000
//       ),
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Zone tag submitted successfully",
//       data: {
//         zoneId: zone._id,
//         hexagonId,
//         category,
//       },
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

export const submitZoneTag = async (req, res) => {
  try {
    const { hexagonId, category, latitude, longitude } = req.body;
    const userId = req.user.id;

    // --------------------------------
    // VALIDATION
    // --------------------------------

    if (!hexagonId || !category) {
      return res.status(400).json({
        success: false,
        message: "hexagonId and category are required",
      });
    }

    const validCategories = [
      "tourism",
      "commercial",
      "nature",
      "nightlife",
      "construction",
      "institutional",
      "industrial",
      "abandoned",
      "residential",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // --------------------------------
    // USER
    // --------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userLevel = user.level;

    // --------------------------------
    // FIND / CREATE ZONE
    // --------------------------------

    let zone = await Zone.findOne({ hexagonId });

    if (!zone) {
      zone = await Zone.create({
        hexagonId,
      });
    }

    // --------------------------------
    // FIND EXISTING REPORT
    // --------------------------------

    const existingReport = await ZoneReporter.findOne({
      userId,
      hexagonId,
    });

    let isNewTag = false;
    let xpShouldBeAwarded = false;

    // ================================================
    // EXISTING REPORT
    // ================================================

    if (existingReport) {
      // --------------------------------
      // SAME CATEGORY
      // --------------------------------

      if (existingReport.category === category) {
        return res.status(200).json({
          success: true,
          message: "You have already selected this tag for this zone.",
          data: {
            zone,
            isNewTag: false,
            xpAwarded: false,
          },
        });
      }

      // --------------------------------
      // CHANGE CATEGORY
      // --------------------------------

      console.log("UPDATING EXISTING REPORT");

      console.log({
        reportId: existingReport._id,
        userId,
        hexagonId,
        oldCategory: existingReport.category,
        newCategory: category,
      });

      existingReport.category = category;

      existingReport.gpsLocation = {
        latitude,
        longitude,
      };

      // IMPORTANT:
      // Do not change voteWeight
      // Do not change userLevel

      await existingReport.save();

      isNewTag = false;
      xpShouldBeAwarded = false;
    }

    // ================================================
    // NEW REPORT
    // ================================================

    else {
      console.log("CREATING NEW REPORT");

      console.log({
        userId,
        hexagonId,
        category,
      });

      await ZoneReporter.create({
        zoneId: zone._id,
        hexagonId,
        userId,
        category,

        voteWeight: userLevel,
        userLevel,

        gpsLocation: {
          latitude,
          longitude,
        },

        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
      });

      isNewTag = true;
      xpShouldBeAwarded = true;
    }

    // ==================================================
    // RECALCULATE ZONE FROM SCRATCH
    // ==================================================

    const reports = await ZoneReporter.find({
      hexagonId,
    });

    const categoryPoints = {
      tourism: 0,
      commercial: 0,
      nature: 0,
      nightlife: 0,
      construction: 0,
      institutional: 0,
      industrial: 0,
      abandoned: 0,
      residential: 0,
    };

    let totalPoints = 0;

    for (const report of reports) {
      if (categoryPoints[report.category] !== undefined) {
        categoryPoints[report.category] += report.voteWeight;

        totalPoints += report.voteWeight;
      }
    }

    // ==================================================
    // FIND WINNING CATEGORY
    // ==================================================

    let winningCategory = "mixed";
    let highestPoints = 0;

    Object.entries(categoryPoints).forEach(
      ([categoryName, points]) => {
        if (points > highestPoints) {
          highestPoints = points;
          winningCategory = categoryName;
        }
      }
    );

    // ==================================================
    // CONFIDENCE
    // ==================================================

    const confidenceScore =
      totalPoints > 0
        ? Number(
            ((highestPoints / totalPoints) * 100).toFixed(2)
          )
        : 0;

    // ==================================================
    // UPDATE ZONE
    // ==================================================

    zone.categoryPoints = categoryPoints;
    zone.totalPoints = totalPoints;
    zone.primaryCategory = winningCategory;
    zone.confidenceScore = confidenceScore;
    zone.lastCalculatedAt = new Date();

    await zone.save();

    // ==================================================
    // XP
    // ==================================================

    if (xpShouldBeAwarded) {
      // Your XP logic here
      //
      // await addXP(userId, 10);
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(isNewTag ? 201 : 200).json({
      success: true,

      message: isNewTag
        ? "Zone tag submitted successfully"
        : "Zone tag updated successfully",

      data: {
        zone,
        isNewTag,
        xpAwarded: xpShouldBeAwarded,
      },
    });
  } catch (error) {
    console.error("submitZoneTag error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({
      totalPoints: -1,
    });

    return res.status(200).json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (error) {
    console.error("Get All Zones Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getZoneById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid zone id",
      });
    }

    const zone = await Zone.findById(id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: zone,
    });
  } catch (error) {
    console.error("Get Zone By Id Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getZoneByHexagonId = async (req, res) => {
  try {
    const { hexagonId } = req.params;

    const zone = await Zone.findOne({ hexagonId });

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: zone,
    });
  } catch (error) {
    console.error("Get Zone By HexagonId Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};