import Zone from "../model/zone.model.js"
import ZoneReporter from "../model/zoneReporter.model.js"
import User from "../model/user.model.js"

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
    const {
      hexagonId,
      category,
      latitude,
      longitude,
    } = req.body;

    const userId = req.user.id;
     const user = await User.findById(userId);

     const userLevel = user.level;

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

    // Prevent duplicate reports
    const existingReport = await ZoneReporter.findOne({
      userId,
      hexagonId,
    });

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message:
          "You have already submitted a tag for this zone.",
      });
    }

    // Create zone if missing
    let zone = await Zone.findOne({ hexagonId });

    if (!zone) {
      zone = await Zone.create({
        hexagonId,
      });
    }

    // Save report
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

    // -----------------------------
    // RECALCULATE ZONE
    // -----------------------------

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

    reports.forEach((report) => {
      categoryPoints[report.category] +=
        report.voteWeight;

      totalPoints += report.voteWeight;
    });

    let winningCategory = "mixed";
    let highestPoints = 0;

    Object.entries(categoryPoints).forEach(
      ([category, points]) => {
        if (points > highestPoints) {
          highestPoints = points;
          winningCategory = category;
        }
      }
    );

    const confidenceScore =
      totalPoints > 0
        ? Number(
            (
              (highestPoints / totalPoints) *
              100
            ).toFixed(2)
          )
        : 0;

    const primaryCategory =
      confidenceScore >= 60
        ? winningCategory
        : "mixed";

    zone = await Zone.findByIdAndUpdate(
      zone._id,
      {
        categoryPoints,
        totalPoints,
        confidenceScore,
        primaryCategory,
        lastCalculatedAt: new Date(),
      },
      {
        new: true,
      }
    );

    // -----------------------------
    // RESPONSE
    // -----------------------------

    return res.status(201).json({
      success: true,
      message:
        "Zone tag submitted successfully",
      data: {
        zone,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};