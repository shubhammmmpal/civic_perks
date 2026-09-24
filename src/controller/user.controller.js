import mongoose from "mongoose";
import User from '../model/user.model.js';
import PaidPlan from '../model/paidPlans.model.js';
import States from '../model/states.model.js';
import Activity from "../model/activity.model.js";
import { validateSubscription } from '../helper/subscription.js';
import { calculateDistanceInMeters } from "../helper/helper.js";


// export const updateProfile = async (req, res) => {
//   try {
//     const userId = req.user.id; // auth middleware se aayega

//     const { name, email, nickname } = req.body;

//     // 👇 find user
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 🔒 Email uniqueness check
//     if (email && email !== user.email) {
//       const emailExists = await User.findOne({ email });
//       if (emailExists) {
//         return res.status(400).json({ message: "Email already in use" });
//       }
//       user.email = email;
//     }

//     // 🔒 nickname uniqueness check
//     if (nickname && nickname !== user.nickname) {
//       const nicknamezExists = await User.findOne({ nickname });
//       if (nicknameExists) {
//         return res.status(400).json({ message: "Nickname Already Taken" });
//       }
//       user.nickname = nickname;
//     }

//     // ✏️ Update optional fields
//     if (name) user.name = name;

//     // 🖼️ Image update (if using multer)
//     if (req.file) {
//       user.image = req.file.path; // ya cloud URL
//     }

//     await user.save();

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       user
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// export const updateProfile = async (req, res) => {
//   try {
//     const userId = req.user.id; // auth middleware se aayega

//     const { fullName, email, nickname, mobile, street, country, city } = req.body;

//     // 👇 find user
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 🔒 Email uniqueness check
//     if (email && email !== user.email) {
//       const emailExists = await User.findOne({ email });
//       if (emailExists) {
//         return res.status(400).json({ message: "Email already in use" });
//       }
//       user.email = email;
//     }

//     // 🔒 nickname uniqueness check
//    if (nickname && nickname !== user.nickname) {

//   const nicknameExists = await User.findOne({
//     nickname,
//     _id: { $ne: userId }
//   });

//   if (nicknameExists) {
//     return res.status(400).json({
//       message: "Nickname already taken"
//     });
//   }

//   user.nickname = nickname;
// }
//     // ✏️ Update optional fields
//     if (fullName) user.fullName = fullName;
//      if (street) user.street = street;
//      if (country) user.country = country;
//      if (mobile) user.mobile = mobile;
//      if(city) user.city = city;

//     // 🖼️ Image update (if using multer)
//     if (req.file) {
//       user.image = req.file.path; // ya cloud URL
//     }


//     await user.save();

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       user
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// export const getProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     await validateSubscription(userId);

//     const user = await User.findById(userId)
//     //   .populate("perks")
//       .populate("plans"); // optional (all plans)

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ⚡ Active Boost
//     const activeBoost = await PaidPlan.findOne({
//       userID: userId,
//       planType: "boost",
//       expiryDate: { $gt: new Date() }
//     }).sort({ expiryDate: -1 });

//     // 💎 Active Subscription
//     const activeSubscription = await PaidPlan.findOne({
//       userID: userId,
//       planType: "subscription",
//       expiryDate: { $gt: new Date() }
//     }).sort({ expiryDate: -1 });

//     // 🧼 Sensitive fields remove
//     const userObj = user.toObject();
//     delete userObj.otp;
//     delete userObj.otpExpiry;

//     return res.status(200).json({
//       message: "Profile fetched successfully",
//       user: userObj,
//       activeBoost: activeBoost
//         ? {
//             type: activeBoost.boostType,
//             expiryDate: activeBoost.expiryDate
//           }
//         : null,
//       activeSubscription: activeSubscription
//         ? {
//             type: activeSubscription.subscriptionType,
//             expiryDate: activeSubscription.expiryDate
//           }
//         : null
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      fullName,
      email,
      nickname,
      mobile,
      street,
      country,
      city,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userLevel = user.level || 1;

    /*
      PROFILE FIELD RULES

      Nickname
      - Level 1+
      - Always editable

      Full Name
      City
      Country
      - Level 5+

      Email
      Mobile
      - Level 10+
    */

    // =========================
    // NICKNAME - ALWAYS EDITABLE
    // =========================

    if (
      nickname !== undefined &&
      nickname !== null &&
      nickname.trim() !== "" &&
      nickname !== user.nickname
    ) {
      const cleanNickname = nickname.trim();

      const nicknameExists = await User.findOne({
        nickname: cleanNickname,
        _id: { $ne: userId },
      });

      if (nicknameExists) {
        return res.status(400).json({
          success: false,
          message: "Nickname already taken",
        });
      }

      user.nickname = cleanNickname;
    }

    // =========================
    // LEVEL 5+ FIELDS
    // =========================

    if (fullName !== undefined && userLevel < 5) {
      return res.status(403).json({
        success: false,
        message: "Full name can be changed after reaching level 5",
        requiredLevel: 5,
        currentLevel: userLevel,
        field: "fullName",
      });
    }

    if (city !== undefined && userLevel < 5) {
      return res.status(403).json({
        success: false,
        message: "City can be changed after reaching level 5",
        requiredLevel: 5,
        currentLevel: userLevel,
        field: "city",
      });
    }

    if (country !== undefined && userLevel < 5) {
      return res.status(403).json({
        success: false,
        message: "Country can be changed after reaching level 5",
        requiredLevel: 5,
        currentLevel: userLevel,
        field: "country",
      });
    }

    // =========================
    // LEVEL 10+ FIELDS
    // =========================

    if (email !== undefined && email !== user.email && userLevel < 10) {
      return res.status(403).json({
        success: false,
        message: "Email can be changed after reaching level 10",
        requiredLevel: 10,
        currentLevel: userLevel,
        field: "email",
      });
    }

    if (mobile !== undefined && userLevel < 10) {
      return res.status(403).json({
        success: false,
        message: "Phone number can be changed after reaching level 10",
        requiredLevel: 10,
        currentLevel: userLevel,
        field: "mobile",
      });
    }

    // =========================
    // EMAIL UPDATE
    // =========================

    if (
      email !== undefined &&
      email.trim() !== "" &&
      email.toLowerCase() !== user.email
    ) {
      const cleanEmail = email.trim().toLowerCase();

      const emailExists = await User.findOne({
        email: cleanEmail,
        _id: { $ne: userId },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      user.email = cleanEmail;
    }

    // =========================
    // UPDATE LEVEL 5+ FIELDS
    // =========================

    if (userLevel >= 5) {
      if (fullName !== undefined) {
        user.fullName = fullName.trim();
      }

      if (city !== undefined) {
        user.city = city.trim();
      }

      if (country !== undefined) {
        user.country = country.trim();
      }
    }

    // =========================
    // UPDATE LEVEL 10+ FIELD
    // =========================

    if (userLevel >= 10 && mobile !== undefined) {
      user.mobile = mobile;
    }

    // Street has no level restriction currently
    if (street !== undefined) {
      user.street = street.trim();
    }

    // =========================
    // PROFILE IMAGE
    // =========================

    if (req.file) {
      user.image = req.file.path;
    }

    await user.save();

    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.otp;
    delete userObj.otpExpiry;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",

      user: userObj,

      profileAccess: {
        nickname: {
          unlocked: true,
          requiredLevel: 1,
        },

        fullName: {
          unlocked: user.level >= 5,
          requiredLevel: 5,
        },

        city: {
          unlocked: user.level >= 5,
          requiredLevel: 5,
        },

        country: {
          unlocked: user.level >= 5,
          requiredLevel: 5,
        },

        email: {
          unlocked: user.level >= 10,
          requiredLevel: 10,
        },

        mobile: {
          unlocked: user.level >= 10,
          requiredLevel: 10,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    await validateSubscription(userId);

    const user = await User.findById(userId).populate("plans");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Active Boost
    const activeBoost = await PaidPlan.findOne({
      userID: userId,
      planType: "boost",
      expiryDate: { $gt: new Date() },
    }).sort({
      expiryDate: -1,
    });

    // Active Subscription
    const activeSubscription = await PaidPlan.findOne({
      userID: userId,
      planType: "subscription",
      expiryDate: { $gt: new Date() },
    }).sort({
      expiryDate: -1,
    });

    const userObj = user.toObject();

    // Sensitive fields remove
    delete userObj.password;
    delete userObj.otp;
    delete userObj.otpExpiry;

    const currentLevel = user.level || 1;

    // ======================================
    // CONDITIONAL PROFILE FIELDS
    // ======================================

    // Level below 5
    if (currentLevel < 5) {
      delete userObj.name;
      delete userObj.city;
      delete userObj.country;
    }

    // Level below 10
    if (currentLevel < 10) {
      delete userObj.email;
      delete userObj.mobile;
    }

    // nickname is always available
    // so we don't delete userObj.nickname

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",

      user: userObj,

      // profileAccess: {
      //   nickname: {
      //     unlocked: true,
      //     requiredLevel: 1,
      //   },

      //   fullName: {
      //     unlocked: currentLevel >= 5,
      //     requiredLevel: 5,
      //   },

      //   city: {
      //     unlocked: currentLevel >= 5,
      //     requiredLevel: 5,
      //   },

      //   country: {
      //     unlocked: currentLevel >= 5,
      //     requiredLevel: 5,
      //   },

      //   email: {
      //     unlocked: currentLevel >= 10,
      //     requiredLevel: 10,
      //   },

      //   mobile: {
      //     unlocked: currentLevel >= 10,
      //     requiredLevel: 10,
      //   },
      // },

      // activeBoost: activeBoost
      //   ? {
      //       type: activeBoost.boostType,
      //       expiryDate: activeBoost.expiryDate,
      //     }
      //   : null,

      // activeSubscription: activeSubscription
      //   ? {
      //       type: activeSubscription.subscriptionType,
      //       expiryDate: activeSubscription.expiryDate,
      //     }
      //   : null,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const changeAccountType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountType } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { accountType },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Account type updated",
      data: updatedUser
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const activeUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // CHECK ACTIVE SUBSCRIPTION
    // ==========================================

    const activeSubscription = await PaidPlan.findOne({
      userID: userId,
      planType: "subscription",
      expiryDate: { $gt: new Date() },
    }).sort({ expiryDate: -1 });

    // ==========================================
    // SET ACTIVE RADIUS
    // ==========================================

    let activeRadius = 1; // Free Tier = 1 Mile

    if (
      activeSubscription &&
      ["Civic_Plus", "Civic_Pro"].includes(
        activeSubscription.subscriptionType
      )
    ) {
      activeRadius = 5; // Paid Plans = 5 Miles
    }

    // Convert Miles → Meters
    const radiusInMeters = activeRadius * 1609.34;

    // ==========================================
    // UPDATE CURRENT USER LOCATION
    // ==========================================

    await User.findByIdAndUpdate(userId, {
      latitude,
      longitude,
      activeAt: new Date(),
      activeRadius,
    });

    // ==========================================
    // CREATE BOUNDING BOX
    // ==========================================

    const latDiff = activeRadius / 69;

    const lngDiff =
      activeRadius /
      (69 * Math.cos((latitude * Math.PI) / 180));

    // ==========================================
    // FIND ACTIVE USERS
    // ==========================================

    const activeUsers = await User.find({
      _id: { $ne: userId },

      latitude: {
        $gte: latitude - latDiff,
        $lte: latitude + latDiff,
      },

      longitude: {
        $gte: longitude - lngDiff,
        $lte: longitude + lngDiff,
      },

      activeAt: {
        $gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    }).select("_id latitude longitude");

    // ==========================================
    // COUNT USERS INSIDE RADIUS
    // ==========================================

    let nearbyUsersCount = 0;

    for (const otherUser of activeUsers) {
      const distance = calculateDistanceInMeters(
        latitude,
        longitude,
        otherUser.latitude,
        otherUser.longitude
      );

      if (distance <= radiusInMeters) {
        nearbyUsersCount++;
      }
    }

    let activeUserTag = "no_user";

if (nearbyUsersCount === 1) {
  activeUserTag = "single_user";
} else if (nearbyUsersCount > 1) {
  activeUserTag = "multiple_user";
}

    // ==========================================
    // SET ACTIVE MODE
    // ==========================================

    const activeMode =
      nearbyUsersCount > 5 ? "normal" : "vanguard";

    // ==========================================
    // UPDATE USER
    // ==========================================

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        activeRadius,
        activeMode,
        activeAt: new Date(),
      },
      {
        new: true,
      }
    ).select("-otp -otpExpiry");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "User activity updated successfully",
        active_user_count: nearbyUsersCount,
  active_user_tag: activeUserTag,
      nearbyUsersCount,
      activeRadius,
      activeMode,
      data: updatedUser,
    });
  } catch (error) {
    console.error("activeUser error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL STATES
// ======================================================

export const getAllStates = async (req, res) => {
  try {
    const states = await States.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: states.length,
      data: states,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch states",
      error: error.message,
    });
  }
};

// ======================================================
// GET STATES BY USER ID
// ======================================================

export const getStatesByUserID = async (req, res) => {
  try {
    const { userId } = req.params;

    const state = await States.findOne({ userId }).populate(
      "userId",
      "name email"
    );

    if (!state) {
      return res.status(404).json({
        success: false,
        message: "States not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user states",
      error: error.message,
    });
  }
};

export const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate("userId", "name email profileImage")
      .populate("pinId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ======================================================
// GET ACTIVITIES BY USER ID
// ======================================================

export const getActivitiesByUserID = async (req, res) => {
  try {
    const { userId } = req.params;

    const activities = await Activity.find({ userId })
      .populate("userId", "name email profileImage")
      .populate("pinId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status,
      sort,
      fromDate,
      toDate
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = {
      role: "USER"
    };

    // Search by name, email, nickname
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { nickname: { $regex: search, $options: "i" } },
        { levelName: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Date filter
    if (fromDate || toDate) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    // Sorting
    let sortOption = {};

    if (sort === "asc") {
      sortOption.name = 1;
    } else if (sort === "desc") {
      sortOption.name = -1;
    } else {
      sortOption.createdAt = -1;
    }

    const users = await User.find(filter)
      .select(
        "_id image name email nickname role status xp trustScore level levelName createdAt"
      )
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUsers = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      users
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent admin deletion
    // if (user.role === "ADMIN") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Admin account cannot be deleted"
    //   });
    // }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(userId)

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(userId)
      // .populate("perks")
      // .populate("plans")
      .select("-password -otp -otpExpiry -__v");

      console.log(user)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateCredits = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, amount } = req.body;

        if (!["grant", "deduct"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid operation"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (type === "grant") {
            user.credits += Number(amount);
        } else {
            user.credits = Math.max(0, user.credits - Number(amount));
        }

        await user.save();

        return res.json({
            success: true,
            message: "Credits updated successfully",
            credits: user.credits
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const updateXp = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, amount } = req.body;

    if (!["grant", "deduct"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'grant' or 'deduct'."
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0."
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (type === "grant") {
      user.xp += Number(amount);
    } else {
      user.xp = Math.max(0, user.xp - Number(amount));
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `XP ${type === "grant" ? "granted" : "deducted"} successfully.`,
      data: {
        userId: user._id,
        xp: user.xp
      }
    });

  } catch (error) {
    console.error("Update XP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

export const updateTrustScore = async (req, res) => {
    try {

        const { userId } = req.params;
        const { action, trustScore } = req.body;

        const user = await User.findById(userId);

        if (!user)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        if (action === "reset") {
            user.trustScore = 75;
        } else if (action === "change") {

            if (trustScore < 0 || trustScore > 99.9) {
                return res.status(400).json({
                    success: false,
                    message: "Trust score must be between 0 and 99.9"
                });
            }

            user.trustScore = trustScore;
        }

        await user.save();

        return res.json({
            success: true,
            message: "Trust score updated",
            trustScore: user.trustScore
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

export const suspendUser = async (req, res) => {

    try {

        const { userId } = req.params;
        const { days, reason } = req.body;

        const user = await User.findById(userId);

        if (!user)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + Number(days));

        user.status = "suspended";
        user.suspendReason = reason;
        user.suspendedUntil = suspendedUntil;

        await user.save();

        return res.json({
            success: true,
            message: "User suspended successfully",
            suspendedUntil
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


export const banUser = async (req, res) => {

    try {

        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId);

        if (!user)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        user.status = "banned";
        user.banReason = reason;
        user.bannedAt = new Date();

        // Remove QR if needed
        user.qrToken = null;
        user.qrUrl = null;

        // Remove refresh/session tokens if stored
        // user.refreshToken = null;

        // Save IP if available
        user.blacklistedIp = req.ip;

        await user.save();

        return res.json({
            success: true,
            message: "User permanently banned"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// export const validatePin = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     await session.startTransaction();

//     const { pinId } = req.params;
//     const userId = req.user.id;
//     console.log(userId);

//     // =========================================
//     // CURRENT USER LIVE LOCATION (FRONTEND GPS)
//     // =========================================

//     const { currentLatitude, currentLongitude, hexagonId } = req.body;

// if (
//   currentLatitude === undefined ||
//   currentLongitude === undefined
// ) {
//   await session.abortTransaction();

//   return res.status(400).json({
//     success: false,
//     message: "Current location is required",
//   });
// }

//     // =========================================
//     // FIND USER
//     // =========================================

//     const user = await User.findById(userId).session(session);

//     if (!user) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // =========================================
//     // FIND PIN
//     // =========================================

//     const pin = await Pin.findById(pinId).session(session);

//     if (!pin) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "Pin not found",
//       });
//     }

//     if (
//       pin.islocked === true &&
//       pin.lockedBy?.toString() !== userId.toString()
//     ) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "This Pin is locked",
//         lockedBy: pin.lockedBy,
//       });
//     }

//     const activeBoosts = await getActiveBoosts(userId);
//     const hexPartyActive = await isHexPartyActive(pin.hexagonId);

//     console.log(activeBoosts);
//     console.log(hexPartyActive);

//     const reservedCargo = await GoldenCargo.findOne({
//       pinId: pin._id,
//       expiresAt: { $gt: new Date() },
//     }).session(session);

//     if (reservedCargo && reservedCargo.userId.toString() !== userId) {
//       await session.abortTransaction();

//       return res.status(403).json({
//         success: false,
//         message: "This resource pin is reserved by another Golden Cargo user",
//       });
//     }

//     // =====================================================
//     // GOLDEN CARGO RESERVATION CHECK
//     // =====================================================

//     if (pin.category === "Resources (Zero-Waste, Upcycling & Utilities)") {
//       const activeCargo = await GoldenCargo.findOne({
//         pinId: pin._id,
//         expiresAt: { $gt: new Date() },
//       }).session(session);

//       if (
//         pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
//         activeCargo
//       ) {
//         const alreadyReserved = activeCargo.pinId.some(
//           (id) => id.toString() === pin._id.toString(),
//         );

//         if (!alreadyReserved) {
//           if (activeCargo.pinId.length >= 3) {
//             await session.abortTransaction();

//             return res.status(400).json({
//               success: false,
//               message: "Golden Cargo can reserve maximum 3 resource pins",
//             });
//           }

//           activeCargo.pinId.push(pin._id);

//           await activeCargo.save({ session });

//           pin.reservationExpiresAt = activeCargo.expiresAt;

//           await pin.save({ session });
//         }
//       }

//       if (activeCargo) {
//         const isCargoOwner = activeCargo.userId.toString() === userId;

//         if (!isCargoOwner) {
//           await session.abortTransaction();

//           return res.status(403).json({
//             success: false,
//             message:
//               "This resource pin is reserved by Golden Cargo and cannot be validated until the reservation expires.",
//             reservedUntil: activeCargo.expiresAt,
//           });
//         }
//       }
//     }

//     // =========================================
//     // PREVENT CREATOR VALIDATION
//     // =========================================

//     if (pin.createdBy.toString() === userId) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "You cannot validate your own pin",
//       });
//     }

//     // =========================================
//     // PIN LOCATION
//     // =========================================

//     const pinLongitude = pin.location.coordinates[0];
//     const pinLatitude = pin.location.coordinates[1];

//     // =========================================
//     // LIVE GPS → PIN DISTANCE
//     // Used for 10 meter validation
//     // =========================================

//     const liveDistance = calculateDistanceInMeters(
//       Number(currentLatitude),
//       Number(currentLongitude),
//       pinLatitude,
//       pinLongitude,
//     );

//     // =========================================
//     // CHECK 10 METER RADIUS
//     // =========================================

//     // if (liveDistance > 10) 
//     if (liveDistance > VALIDATION_CONFIG.MAX_DISTANCE_METERS)
//       {
//       await session.abortTransaction();

//       return res.status(403).json({
//         success: false,
//         message: `You must be within ${VALIDATION_CONFIG.MAX_DISTANCE_METERS} meters of the pin location`,
//         // message: "You must be within 10 meters of the pin location",
//         distance: `${liveDistance.toFixed(2)} meters`,
//       });
//     }

//     // =========================================
//     // FIND ACTIVITY
//     // =========================================

//     const activity = await Activity.findOne({
//       userId,
//       pinId,
//       status: "pending",
//     })
//       .sort({ createdAt: -1 })
//       .session(session);

//     // =========================================
//     // CHECK ACTIVITY
//     // =========================================

//     if (!activity) {
//       const activeCargo = await GoldenCargo.findOne({
//         userId,
//         pinId: pin._id,
//         expiresAt: { $gt: new Date() },
//       }).session(session);

//       const isReservedResourcePin =
//         pin.category === "Resources (Zero-Waste, Upcycling & Utilities)" &&
//         activeCargo;

//       if (!isReservedResourcePin) {
//         await session.abortTransaction();

//         return res.status(404).json({
//           success: false,
//           message: "No pending activity found",
//         });
//       }
//     }

//     // =========================================
//     // UPDATE STATUS
//     // =========================================

//     activity.status = "completed";

//     await activity.save({ session });

//     // =========================================
//     // TRAVEL DISTANCE FROM ACTIVITY
//     // =========================================

//     const travelDistance = activity.distance || 0;

//     const METER_PER_MILE = 1609.344;

// const milesTravelled =
//   travelDistance / METER_PER_MILE;

// const creditsEarned =
//   Number((milesTravelled * 5).toFixed(2));
//     const baseTravelXP = Math.max(1, Math.floor(travelDistance / 100));

//     const travelXP = calculateXPWithBoosts({
//       baseXP: baseTravelXP,
//       doubleXP: activeBoosts.Double_XP,
//       hexParty: hexPartyActive,
//     });

//     // =========================================
//     // FIND VALIDATION
//     // =========================================

//     let validation = await Validation.findOne({
//       pinID: pinId,
//     }).session(session);

//     // =====================================================
//     // FIRST VALIDATOR
//     // =====================================================

// //     if (!validation) {
// //       validation = new Validation({
// //         pinID: pinId,
// //         validatedBy: userId,
// //         status: "orange",
// //         beneficiaries: [],
// //       });

// //       await validation.save({ session });

// //       // =========================================
// //       // UPDATE PIN
// //       // =========================================

// //       pin.validatedBy = userId;
// //       pin.status = "orange";

// //       // increase score
// //       // pin.pinScore += 10;
// //       const voteWeight = getValidationWeight(user);

// // pin.pinScore = Number(pin.pinScore || 0) + voteWeight;

// //       // =========================================
// //       // AUTO VERIFY PIN
// //       // CREATOR REWARD ONLY ONCE
// //       // =========================================

// //       let pinVerifiedNotification = null;

// //       if (
// //         pin.pinScore >= 100 &&
// //         (!pin.pinStatus || pin.pinStatus === "pending")
// //       ) {
// //         // update pin status
// //         pin.pinStatus = "verified";
// //         pin.status = "green";

// //         // =========================================
// //         // REWARD PIN CREATOR
// //         // =========================================

// //         const pinCreator = await User.findById(pin.createdBy).session(session);

// //         if (pinCreator) {
// //           // give xp
// //           pinCreator.xp += 15;

// //           // increase trust score
// //           pinCreator.trustScore = Math.min(
// //             99.9,
// //             Number((pinCreator.trustScore + 0.5).toFixed(1)),
// //           );

// //           // =========================================
// //           // UPDATE LEVEL
// //           // =========================================

// //           const creatorLevelData = getLevelData(pinCreator.xp);

// //           pinCreator.level = creatorLevelData.level;
// //           pinCreator.levelName = creatorLevelData.name;

// //           await pinCreator.save({ session });

// //           pinVerifiedNotification = {
// //             tokens: pinCreator.fcmToken ? [pinCreator.fcmToken] : [],
// //             title: "🎉 Pin Verified",
// //             body: "Congratulations! Your pin has been verified. You earned 15 XP.",
// //             data: {
// //               type: "PIN_VERIFIED",
// //               pinId: pin._id.toString(),
// //               xp: 15,
// //             },
// //           };
// //         }
// //       }

// //       // =========================================
// //       // PENALIZE FAKE REPORTERS
// //       // =========================================

// //       if (pin.fakereportingBy.length > 0 && !pin.fakeReportersPenalized) {
// //         // get all fake reporters
// //         const fakeReporters = await User.find({
// //           _id: { $in: pin.fakereportingBy },
// //         }).session(session);

// //         for (const reporter of fakeReporters) {
// //           // =========================================
// //           // DECREASE TRUST SCORE
// //           // =========================================

// //           reporter.trustScore = Math.max(
// //             0,
// //             Number((reporter.trustScore - 15).toFixed(1)),
// //           );

// //           // =========================================
// //           // BAN USER IF BELOW 40
// //           // =========================================

// //           if (reporter.trustScore < 40) {
// //             reporter.status = "banned";
// //           }

// //           // =========================================
// //           // SAVE USER
// //           // =========================================

// //           await reporter.save({ session });

// //           // =========================================
// //           // CREATE FINE LOG
// //           // =========================================

// //           await Fine.create(
// //             [
// //               {
// //                 userId: reporter._id,
// //                 amount: 15,
// //                 reason: `False fake report on verified pin ${pin._id}`,
// //               },
// //             ],
// //             { session },
// //           );
// //         }

// //         // =========================================
// //         // PREVENT DUPLICATE PENALTY
// //         // =========================================

// //         pin.fakeReportersPenalized = true;
// //       }

// //       await pin.save({ session });

// //       // =========================================
// //       // REWARD VALIDATOR
// //       // =========================================

// //       const updated_lavel = user.xp + travelXP;
// //       await checkLevelUp(user, updated_lavel, session);

// //       user.xp += travelXP;
// //       user.credits += 5;
// //       await updateLeaderboardXP(user._id, travelXP, session);

// //       // trust score increase
// //       user.trustScore = Math.min(
// //         99.9,
// //         Number((user.trustScore + 0.1).toFixed(1)),
// //       );

// //       // =========================================
// //       // UPDATE LEVEL
// //       // =========================================

// //       await user.save({ session });

// //       // =========================================
// //       // UPDATE USER STATS
// //       // =========================================

// //       // =========================================
// //       // FIND USER STATS
// //       // =========================================
// //       let userStats = await States.findOne({
// //         userId: userId,
// //       }).session(session);

// //       // =========================================
// //       // CREATE IF NOT EXISTS
// //       // =========================================

// //       if (!userStats) {
// //         userStats = new States({
// //           user: userId,
// //           pinsValidated: 1,
// //         });
// //       } else {
// //         userStats.pinsValidated += 1;
// //       }

// //       // =========================================
// //       // SAVE
// //       // =========================================

// //       await userStats.save({ session });

// //       // =========================================
// //       // CREATE ACTIVITY LOG
// //       // =========================================

// //       await Activity.create(
// //         [
// //           {
// //             userId: userId,

// //             activityType: "pin_validated",

// //             pinId: pin._id,

// //             pinTitle: pin.description || "Pin Validation",

// //             images: pin.images || [],

// //             xpEarned: travelXP,

// //             creditsSpent: 5,

// //             distance: travelDistance,

// //             activityLocation: {
// //               latitude: pinLatitude,
// //               longitude: pinLongitude,
// //             },

// //             startLocation: {
// //               latitude: Number(currentLatitude),
// //               longitude: Number(currentLongitude),
// //             },

// //             endLocation: {
// //               latitude: pinLatitude,
// //               longitude: pinLongitude,
// //             },

// //             status: "completed",
// //           },
// //         ],
// //         { session },
// //       );

// //       // =========================================
// //       // PREPARE NOTIFICATIONS
// //       // =========================================

// //       const pinCreator = await User.findById(pin.createdBy)
// //         .select("fcmToken name")
// //         .session(session);

// //       const validatorRewardNotification = {
// //         tokens: user.fcmToken ? [user.fcmToken] : [],
// //         title: "✅ Pin Validated",
// //         body: `You earned ${travelXP} XP and 5 Credits for validating this pin.`,
// //         data: {
// //           type: "PIN_VALIDATED",
// //           pinId: pin._id.toString(),
// //           xp: travelXP,
// //           credits: 5,
// //         },
// //       };

// //       const creatorNotification = {
// //         tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],
// //         title: "📍 Pin Validation",
// //         body: `${user.name} validated your pin.`,
// //         data: {
// //           type: "PIN_VALIDATED_BY_USER",
// //           pinId: pin._id.toString(),
// //           validatorId: user._id.toString(),
// //         },
// //       };

// //       // =========================================
// //       // COMMIT
// //       // =========================================

// //       await session.commitTransaction();

// //       const notifications = [
// //         sendNotification(validatorRewardNotification),
// //         sendNotification(creatorNotification),
// //       ];

// //       if (pinVerifiedNotification) {
// //         notifications.push(sendNotification(pinVerifiedNotification));
// //       }

// //       await Promise.all(notifications);

// //       return res.status(200).json({
// //         success: true,
// //         message: "Pin validated successfully",

// //         rewards: {
// //           xpEarned: travelXP,
// //           creditsEarned: 5,
// //           trustScoreEarned: 0.1,
// //         },

// //         pinData: {
// //           pinScore: pin.pinScore,
// //           pinStatus: pin.pinStatus,
// //           status: pin.status,
// //         },

// //         distanceInfo: {
// //           liveDistanceMeters: liveDistance.toFixed(2),

// //           travelDistanceMeters: travelDistance.toFixed(2),
// //         },
// //         activeBoosts,
// //         hexPartyActive,
// //       });
// //     }


// if (!validation) {
//   // =====================================================
//   // FIRST VALIDATOR
//   // =====================================================

//   const voteWeight = getValidationWeight(user);

//   // =====================================================
//   // CREATE VALIDATION WITH FIRST WEIGHTED VOTE
//   // =====================================================

//   validation = new Validation({
//     pinID: pinId,

//     // Existing field - keep for backward compatibility
//     validatedBy: userId,

//     status: "orange",

//     beneficiaries: [],

//     // =====================================================
//     // WEIGHTED VOTE
//     // =====================================================

//     votes: [
//       {
//         userId: user._id,

//         vote: "VALID",

//         weight: voteWeight,

//         // Snapshot at the time of voting
//         trustScore: Number(user.trustScore || 0),

//         level: Number(user.level || 1),

//         levelName: user.levelName || null,

//         // GPS snapshot
//         location: {
//           latitude: Number(currentLatitude),
//           longitude: Number(currentLongitude),
//         },

//         distanceMeters: Number(liveDistance),

//         // First validator rewards
//         xpEarned: travelXP,

//         creditsEarned: 5,
//       },
//     ],

//     // =====================================================
//     // CONSENSUS VALUES
//     // =====================================================

//     validWeight: voteWeight,

//     fakeWeight: 0,

//     validVotes: 1,

//     fakeVotes: 0,

//     confidenceScore: voteWeight,

//     consensusStatus: "PENDING",
//   });

//   // =====================================================
//   // UPDATE PIN
//   // =====================================================

//   pin.validatedBy = userId;

//   pin.status = "orange";

//   /*
//   |--------------------------------------------------------------------------
//   | Validation is source of truth.
//   | Pin score is only synced from validation.
//   |--------------------------------------------------------------------------
//   */

//   pin.pinScore = validation.confidenceScore;

//   // =====================================================
//   // CHECK IF FIRST VOTE ALREADY VERIFIES PIN
//   // =====================================================

//   let pinVerifiedNotification = null;

//   if (
//     validation.confidenceScore >=
//       VALIDATION_CONFIG.VERIFIED_SCORE &&
//     validation.consensusStatus === "PENDING"
//   ) {
//     // =====================================================
//     // MARK VALIDATION VERIFIED
//     // =====================================================

//     validation.consensusStatus = "VERIFIED";

//     validation.consensusReachedAt = new Date();

//     validation.status = "green";

//     // =====================================================
//     // MARK PIN VERIFIED
//     // =====================================================

//     pin.pinStatus = "verified";

//     pin.status = "green";

//     // =====================================================
//     // REWARD PIN CREATOR
//     // =====================================================

//     const pinCreator = await User.findById(
//       pin.createdBy,
//     ).session(session);

//     if (pinCreator) {
//       pinCreator.xp += 15;

//       pinCreator.trustScore = Math.min(
//         99.9,
//         Number(
//           (
//             Number(pinCreator.trustScore || 0) + 0.5
//           ).toFixed(1),
//         ),
//       );

//       // =====================================================
//       // UPDATE CREATOR LEVEL
//       // =====================================================

//       const creatorLevelData = getLevelData(
//         pinCreator.xp,
//       );

//       pinCreator.level = creatorLevelData.level;

//       pinCreator.levelName =
//         creatorLevelData.name;

//       await pinCreator.save({ session });

//       // =====================================================
//       // PREPARE VERIFIED NOTIFICATION
//       // =====================================================

//       pinVerifiedNotification = {
//         tokens: pinCreator.fcmToken
//           ? [pinCreator.fcmToken]
//           : [],

//         title: "🎉 Pin Verified",

//         body:
//           "Congratulations! Your pin has been verified. You earned 15 XP.",

//         data: {
//           type: "PIN_VERIFIED",

//           pinId: pin._id.toString(),

//           xp: 15,
//         },
//       };
//     }
//   }

//   // =====================================================
//   // PENALIZE USERS WHO FALSELY REPORTED THIS PIN
//   // ONLY WHEN PIN IS ACTUALLY VERIFIED
//   // =====================================================

//   if (
//     validation.consensusStatus === "VERIFIED" &&
//     pin.fakereportingBy?.length > 0 &&
//     !pin.fakeReportersPenalized
//   ) {
//     const fakeReporters = await User.find({
//       _id: {
//         $in: pin.fakereportingBy,
//       },
//     }).session(session);

//     for (const reporter of fakeReporters) {
//       // =====================================================
//       // DECREASE TRUST SCORE
//       // =====================================================

//       reporter.trustScore = Math.max(
//         0,
//         Number(
//           (
//             Number(reporter.trustScore || 0) - 15
//           ).toFixed(1),
//         ),
//       );

//       // =====================================================
//       // CURRENT BAN RULE
//       // =====================================================
//       // Later this can be changed to shadowBan.

//       if (reporter.trustScore < 40) {
//         reporter.status = "banned";
//       }

//       await reporter.save({ session });

//       // =====================================================
//       // FINE LOG
//       // =====================================================

//       await Fine.create(
//         [
//           {
//             userId: reporter._id,

//             amount: 15,

//             reason: `False fake report on verified pin ${pin._id}`,
//           },
//         ],
//         {
//           session,
//         },
//       );
//     }

//     // Prevent duplicate penalty
//     pin.fakeReportersPenalized = true;
//   }

//   // =====================================================
//   // SAVE VALIDATION + PIN
//   // =====================================================

//   await validation.save({ session });

//   await pin.save({ session });

//   // =====================================================
//   // REWARD FIRST VALIDATOR
//   // =====================================================

//   const updated_level =
//     Number(user.xp || 0) + travelXP;

//   await checkLevelUp(
//     user,
//     updated_level,
//     session,
//   );

//   user.xp =
//     Number(user.xp || 0) + travelXP;

//   // user.credits =
//   //   Number(user.credits || 0) + 5;
// user.credits =
//   Number(user.credits || 0) + creditsEarned;
//   await updateLeaderboardXP(
//     user._id,
//     travelXP,
//     session,
//   );

//   // =====================================================
//   // VALIDATOR TRUST SCORE
//   // =====================================================

//   user.trustScore = Math.min(
//     99.9,
//     Number(
//       (
//         Number(user.trustScore || 0) + 0.1
//       ).toFixed(1),
//     ),
//   );

//   await user.save({ session });

//   // =====================================================
//   // UPDATE USER STATS
//   // =====================================================

//   let userStats = await States.findOne({
//     user: userId,
//   }).session(session);

//   if (!userStats) {
//     userStats = new States({
//       user: userId,

//       pinsValidated: 1,
//     });
//   } else {
//     userStats.pinsValidated =
//       Number(userStats.pinsValidated || 0) + 1;
//   }

//   await userStats.save({ session });

//   // =====================================================
//   // CREATE ACTIVITY LOG
//   // =====================================================

//   await Activity.create(
//     [
//       {
//         userId: userId,

//         activityType: "pin_validated",

//         pinId: pin._id,

//         pinTitle:
//           pin.description || "Pin Validation",

//         images: pin.images || [],

//         xpEarned: travelXP,

//         creditsSpent: 5,

//         distance: travelDistance,

//         activityLocation: {
//           latitude: pinLatitude,

//           longitude: pinLongitude,
//         },

//         startLocation: {
//           latitude: Number(currentLatitude),

//           longitude: Number(currentLongitude),
//         },

//         endLocation: {
//           latitude: pinLatitude,

//           longitude: pinLongitude,
//         },

//         status: "completed",
//       },
//     ],
//     {
//       session,
//     },
//   );

//   // =====================================================
//   // PIN CREATOR
//   // =====================================================

//   const pinCreator = await User.findById(
//     pin.createdBy,
//   )
//     .select("fcmToken name")
//     .session(session);

//   // =====================================================
//   // VALIDATOR NOTIFICATION
//   // =====================================================

//   const validatorRewardNotification = {
//     tokens: user.fcmToken
//       ? [user.fcmToken]
//       : [],

//     title: "✅ Pin Validated",

//     body: `You earned ${travelXP} XP and 5 Credits for validating this pin.`,

//     data: {
//       type: "PIN_VALIDATED",

//       pinId: pin._id.toString(),

//       xp: travelXP,

//       credits: 5,

//       voteWeight: String(voteWeight),
//     },
//   };

//   // =====================================================
//   // CREATOR NOTIFICATION
//   // =====================================================

//   const creatorNotification = {
//     tokens: pinCreator?.fcmToken
//       ? [pinCreator.fcmToken]
//       : [],

//     title: "📍 Pin Validation",

//     body: `${user.name} validated your pin.`,

//     data: {
//       type: "PIN_VALIDATED_BY_USER",

//       pinId: pin._id.toString(),

//       validatorId: user._id.toString(),

//       voteWeight: String(voteWeight),
//     },
//   };

//   // =====================================================
//   // COMMIT TRANSACTION
//   // =====================================================

//   await session.commitTransaction();

//   // =====================================================
//   // SEND NOTIFICATIONS AFTER COMMIT
//   // =====================================================

//   const notifications = [];

//   if (
//     validatorRewardNotification.tokens.length
//   ) {
//     notifications.push(
//       sendNotification(
//         validatorRewardNotification,
//       ),
//     );
//   }

//   if (creatorNotification.tokens.length) {
//     notifications.push(
//       sendNotification(creatorNotification),
//     );
//   }

//   if (
//     pinVerifiedNotification?.tokens?.length
//   ) {
//     notifications.push(
//       sendNotification(
//         pinVerifiedNotification,
//       ),
//     );
//   }

//   await Promise.all(notifications);

//   // =====================================================
//   // RESPONSE
//   // =====================================================

//   return res.status(200).json({
//     success: true,

//     message:
//       validation.consensusStatus === "VERIFIED"
//         ? "Pin validated and verified successfully"
//         : "Pin validated successfully",

//     vote: {
//       type: "VALID",

//       weight: voteWeight,

//       trustScore: user.trustScore,

//       level: user.level,

//       levelName: user.levelName,
//     },

//     consensus: {
//       validWeight: validation.validWeight,

//       fakeWeight: validation.fakeWeight,

//       validVotes: validation.validVotes,

//       fakeVotes: validation.fakeVotes,

//       confidenceScore:
//         validation.confidenceScore,

//       status:
//         validation.consensusStatus,
//     },

//     rewards: {
//       xpEarned: travelXP,

//       // creditsEarned: 5,
//       creditsEarned,

//       trustScoreEarned: 0.1,
//     },

//     pinData: {
//       pinScore: pin.pinScore,

//       pinStatus: pin.pinStatus,

//       status: pin.status,
//     },

//     distanceInfo: {
//       liveDistanceMeters:
//         liveDistance.toFixed(2),

//       travelDistanceMeters:
//         travelDistance.toFixed(2),
//     },

//     activeBoosts,

//     hexPartyActive,
//   });
// }

//     // =========================================
//     // UPDATE USER STATS
//     // =========================================

//     let userStats = await States.findOne({
//       user: userId,
//     }).session(session);

//     // create if not exists
//     if (!userStats) {
//       userStats = new States({
//         user: userId,
//         pinsValidated: 1,
//       });
//     } else {
//       userStats.pinsValidated += 1;
//     }

//     await userStats.save({ session });

//     // =====================================================
//     // PREVENT SAME VALIDATOR
//     // =====================================================

//     if (
//       validation.validatedBy &&
//       validation.validatedBy.toString() === userId
//     ) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "You already validated this pin",
//       });
//     }

//     // =====================================================
//     // CHECK 24 HOUR WINDOW
//     // =====================================================

//     const createdAt = new Date(validation.createdAt);

//     const now = new Date();

//     const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

//     if (diffHours > 24) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "Validation window expired",
//       });
//     }

//     // =====================================================
//     // ALREADY BENEFICIARY
//     // =====================================================

//     const alreadyBeneficiary = validation.beneficiaries.some(
//       (id) => id.toString() === userId,
//     );

//     if (alreadyBeneficiary) {
//       await session.abortTransaction();

//       return res.status(400).json({
//         success: false,
//         message: "Already validated as beneficiary",
//       });
//     }

//     // =====================================================
//     // ADD BENEFICIARY
//     // =====================================================

//     // validation.beneficiaries.push(userId);

//     // await validation.save({ session });

//     // =========================================
//     // UPDATE PIN
//     // =========================================

//     // pin.beneficiaries.push(userId);

//     // increase score
//     // pin.pinScore += 10;
    
//     // const voteWeight = getValidationWeight(user);

// // pin.pinScore = Number(pin.pinScore || 0) + voteWeight;

// const voteWeight = getValidationWeight(user);

// /*
// |--------------------------------------------------------------------------
// | ADD BENEFICIARY
// |--------------------------------------------------------------------------
// */

// validation.beneficiaries.push(userId);

// pin.beneficiaries.push(userId);

// /*
// |--------------------------------------------------------------------------
// | ADD WEIGHTED VOTE
// |--------------------------------------------------------------------------
// */

// validation.votes.push({
//   userId: user._id,

//   vote: "VALID",

//   weight: voteWeight,

//   trustScore: Number(user.trustScore || 0),

//   level: Number(user.level || 1),

//   levelName: user.levelName || null,

//   location: {
//     latitude: Number(currentLatitude),
//     longitude: Number(currentLongitude),
//   },

//   distanceMeters: liveDistance,

//   xpEarned: travelXP,

//   creditsEarned: 2,
// });

// /*
// |--------------------------------------------------------------------------
// | RECALCULATE SCORE
// |--------------------------------------------------------------------------
// */

// const validVotes = validation.votes.filter(
//   (vote) => vote.vote === "VALID",
// );

// const fakeVotes = validation.votes.filter(
//   (vote) => vote.vote === "FAKE",
// );

// validation.validWeight = validVotes.reduce(
//   (total, vote) =>
//     total + Number(vote.weight || 0),
//   0,
// );

// validation.fakeWeight = fakeVotes.reduce(
//   (total, vote) =>
//     total + Number(vote.weight || 0),
//   0,
// );

// validation.validVotes = validVotes.length;

// validation.fakeVotes = fakeVotes.length;

// /*
// |--------------------------------------------------------------------------
// | FINAL CONFIDENCE SCORE
// |--------------------------------------------------------------------------
// */

// validation.confidenceScore =
//   validation.validWeight -
//   validation.fakeWeight;

// /*
// |--------------------------------------------------------------------------
// | SYNC PIN SCORE
// |--------------------------------------------------------------------------
// */

// pin.pinScore =
//   validation.confidenceScore;

//     // =========================================
//     // AUTO VERIFY PIN
//     // CREATOR REWARD ONLY ONCE
//     // =========================================

//     // if (
//     //   pin.pinScore >= 100 &&
//     //   (!pin.pinStatus || pin.pinStatus === "pending")
//     // ) {
//     if (
//   validation.confidenceScore >=
//     VALIDATION_CONFIG.VERIFIED_SCORE &&
//   validation.consensusStatus === "PENDING"
// ) {
//       // update pin status
//         validation.consensusStatus = "VERIFIED";

//   validation.consensusReachedAt = new Date();

//   validation.status = "green";

//   pin.pinStatus = "verified";

//   pin.status = "green";
//       // pin.pinStatus = "verified";
//       // pin.status = "green";

//       // =========================================
//       // REWARD PIN CREATOR
//       // =========================================

//       const pinCreator = await User.findById(pin.createdBy).session(session);

//       if (pinCreator) {
//         // give xp
//         pinCreator.xp += 15;

//         // increase trust score
//         pinCreator.trustScore = Math.min(
//           99.9,
//           Number((pinCreator.trustScore + 0.5).toFixed(1)),
//         );

//         // =========================================
//         // UPDATE LEVEL
//         // =========================================

//         const creatorLevelData = getLevelData(pinCreator.xp);

//         pinCreator.level = creatorLevelData.level;
//         pinCreator.levelName = creatorLevelData.name;

//         await pinCreator.save({ session });
//       }
//     }

//     // =========================================
//     // PENALIZE FAKE REPORTERS
//     // =========================================

//     if (pin.fakereportingBy.length > 0 && !pin.fakeReportersPenalized) {
//       // get all fake reporters
//       const fakeReporters = await User.find({
//         _id: { $in: pin.fakereportingBy },
//       }).session(session);

//       for (const reporter of fakeReporters) {
//         // =========================================
//         // DECREASE TRUST SCORE
//         // =========================================

//         reporter.trustScore = Math.max(
//           0,
//           Number((reporter.trustScore - 15).toFixed(1)),
//         );

//         // =========================================
//         // BAN USER IF BELOW 40
//         // =========================================

//         if (reporter.trustScore < 100) {
//           reporter.status = "banned";
//         }

//         // =========================================
//         // SAVE USER
//         // =========================================

//         await reporter.save({ session });

//         // =========================================
//         // CREATE FINE LOG
//         // =========================================

//         await Fine.create(
//           [
//             {
//               userId: reporter._id,
//               amount: 15,
//               reason: `False fake report on verified pin ${pin._id}`,
//             },
//           ],
//           { session },
//         );
//       }

//       // =========================================
//       // PREVENT DUPLICATE PENALTY
//       // =========================================

//       pin.fakeReportersPenalized = true;
//     }

//     await pin.save({ session });

//     // =========================================
//     // REWARD BENEFICIARY
//     // =========================================

//     const updated_lavel = user.xp + travelXP;

//     await checkLevelUp(user, updated_lavel, session);

//     user.xp += travelXP;
//     user.credits += 2;

//     await updateLeaderboardXP(user._id, travelXP, session);

//     // ======================================
//     // TRUST SCORE INCREASE
//     // ======================================

//     user.trustScore = Math.min(
//       99.9,
//       Number((user.trustScore + 0.1).toFixed(1)),
//     );

//     // =========================================
//     // UPDATE LEVEL
//     // =========================================

//     // const levelData = getLevelData(user.xp);

//     // user.level = levelData.level;
//     // user.levelName = levelData.name;

//     await user.save({ session });

//     // =========================================
//     // FETCH VALIDATOR
//     // =========================================

//     const validatorUser = await User.findById(validation.validatedBy).select(
//       "name email xp level levelName credits trustScore",
//     );

//     // =========================================
//     // CREATE BENEFICIARY ACTIVITY LOG
//     // =========================================
//     console.log("active", activeBoosts);

//     await Activity.create(
//       [
//         {
//           userId: userId,

//           activityType: "pin_validated",

//           pinId: pin._id,

//           pinTitle: pin.description || "Pin Validation",

//           images: pin.images || [],

//           xpEarned: travelXP,

//           creditsSpent: 2,

//           distance: travelDistance,

//           activityLocation: {
//             latitude: pinLatitude,
//             longitude: pinLongitude,
//           },

//           startLocation: {
//             latitude: Number(currentLatitude),
//             longitude: Number(currentLongitude),
//           },

//           endLocation: {
//             latitude: pinLatitude,
//             longitude: pinLongitude,
//           },

//           status: "completed",
//         },
//       ],
//       { session },
//     );

//     // =========================================
//     // PREPARE NOTIFICATIONS
//     // =========================================

//     const pinCreator = await User.findById(pin.createdBy)
//       .select("fcmToken name")
//       .session(session);

//     const beneficiaryRewardNotification = {
//       tokens: user.fcmToken ? [user.fcmToken] : [],
//       title: "✅ Validation Successful",
//       // body: `You earned ${travelXP} XP and 2 Credits for supporting this validation.`,
//       body: `You travelled ${milesTravelled.toFixed(
//   2,
// )} miles and earned ${creditsEarned} Credits for validating this pin.`,
//       data: {
//         type: "PIN_VALIDATION_SUPPORT",
//         pinId: pin._id.toString(),
//         xp: travelXP,
//         credits: 2,
//       },
//     };

//     const creatorNotification = {
//       tokens: pinCreator?.fcmToken ? [pinCreator.fcmToken] : [],
//       title: "📍 Pin Validation",
//       body: `${user.name} also validated your pin.`,
//       data: {
//         type: "PIN_VALIDATED_BY_USER",
//         pinId: pin._id.toString(),
//         validatorId: user._id.toString(),
//       },
//     };

//     // =========================================
//     // COMMIT
//     // =========================================

//     await session.commitTransaction();

//     await Promise.all([
//       sendNotification(beneficiaryRewardNotification),
//       sendNotification(creatorNotification),
//     ]);

//     // =========================================
//     // RESPONSE
//     // =========================================

//     return res.status(200).json({
//       success: true,

//       message: "You successfully joined this validation task.",

//       validator: validatorUser,

//       rewards: {
//         xpEarned: travelXP,
//         creditsEarned: 2,
//       },

//       pinData: {
//         pinScore: pin.pinScore,
//         pinStatus: pin.pinStatus,
//         status: pin.status,
//       },

//       distanceInfo: {
//         liveDistanceMeters: liveDistance.toFixed(2),

//         travelDistanceMeters: travelDistance.toFixed(2),
//       },
//       activeBoosts,
//       hexPartyActive,
//     });
//   } catch (error) {
//     await session.abortTransaction();

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };