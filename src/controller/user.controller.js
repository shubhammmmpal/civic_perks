import User from '../model/user.model.js';
import PaidPlan from '../model/paidPlans.model.js';
import States from '../model/states.model.js';
import Activity from "../model/activity.model.js";
import { validateSubscription } from '../helper/subscription.js';


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


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // auth middleware se aayega

    const { name, email, nickname } = req.body;

    // 👇 find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 Email uniqueness check
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // 🔒 nickname uniqueness check
   if (nickname && nickname !== user.nickname) {

  const nicknameExists = await User.findOne({
    nickname,
    _id: { $ne: userId }
  });

  if (nicknameExists) {
    return res.status(400).json({
      message: "Nickname already taken"
    });
  }

  user.nickname = nickname;
}
    // ✏️ Update optional fields
    if (name) user.name = name;

    // 🖼️ Image update (if using multer)
    if (req.file) {
      user.image = req.file.path; // ya cloud URL
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    await validateSubscription(userId);

    // 👤 Get user
    const user = await User.findById(userId)
    //   .populate("perks")
      .populate("plans"); // optional (all plans)

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ⚡ Active Boost
    const activeBoost = await PaidPlan.findOne({
      userID: userId,
      planType: "boost",
      expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: -1 });

    // 💎 Active Subscription
    const activeSubscription = await PaidPlan.findOne({
      userID: userId,
      planType: "subscription",
      expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: -1 });

    // 🧼 Sensitive fields remove
    const userObj = user.toObject();
    delete userObj.otp;
    delete userObj.otpExpiry;

    return res.status(200).json({
      message: "Profile fetched successfully",

      user: userObj,

      activeBoost: activeBoost
        ? {
            type: activeBoost.boostType,
            expiryDate: activeBoost.expiryDate
          }
        : null,

      activeSubscription: activeSubscription
        ? {
            type: activeSubscription.subscriptionType,
            expiryDate: activeSubscription.expiryDate
          }
        : null
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
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
    // OR req.params.id
    // depending on your auth middleware

    const { latitude, longitude } = req.body;

    // Validation
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        latitude,
        longitude,
        activeAt: new Date(),
      },
      {
        new: true,
      }
    ).select("-otp -otpExpiry");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User activity updated",
      data: updatedUser,
    });

  } catch (error) {
    console.log("activeUser error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
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
        { nickname: { $regex: search, $options: "i" } }
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
        "_id name email nickname role status xp trustScore level levelName createdAt"
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

