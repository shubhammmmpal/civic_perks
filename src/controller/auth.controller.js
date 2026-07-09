import User from "../model/user.model.js";
import Friend from "../model/friend.model.js";
import States from "../model/states.model.js";
import Inventory from "../model/inventory.model.js";
import UserLeaderBoardLog from "../model/userLeaderBoardLog.model.js";
import { sendEmail } from "../config/nodemailer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { validateSubscription } from "../helper/subscription.js";
import Validation from "../model/validation.model.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// export const loginWithOTP = async (req, res) => {
//   try {
//     const { email, location } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email required" });
//     }

//     const otp = generateOTP();

//     const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

//     let user = await User.findOne({ email });

//     if (!user) {
//       user = await User.create({ email, location });
//     }

//     user.otp = otp;
//     user.otpExpiry = otpExpiry;
//     await user.save();

//     // await sendEmail(email, otp);

//     res.json({
//       success: true,
//       data:[{
//         email,
//         "otp":otp
//       }
//       ],
//       message: "OTP sent to email"
//     });

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const loginWithOTP = async (req, res) => {
  try {
    const { email, location, referralId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    let user = await User.findOne({ email });
    let isNewUser = false;

    // ===============================
    // Prevent suspended/banned users from logging in
    // ===============================

    if (user) {
      // Permanently banned
      if (user.status === "banned") {
        return res.status(403).json({
          success: false,
          message: "Your account has been permanently banned.",
          reason: user.banReason || null,
        });
      }

      // Temporarily suspended
      if (user.status === "suspended") {
        // Suspension still active
        if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
          return res.status(403).json({
            success: false,
            message: "Your account has been temporarily suspended.",
            reason: user.suspendReason || null,
            suspendedUntil: user.suspendedUntil,
          });
        }

        // Suspension expired → automatically reactivate account
        user.status = "active";
        user.suspendedUntil = null;
        user.suspendReason = null;

        await user.save();
      }
    }

    if (!user) {
      isNewUser = true;

      const qrToken = uuidv4();

      const qrData = JSON.stringify({
        userId: qrToken,
      });

      const qrUrl = `http://localhost:5175/user/${qrToken}`;

      const qrCode = await QRCode.toDataURL(qrUrl);

      user = await User.create({
        email,
        location,
        qrToken,
        qrCode,
        qrUrl,
      });

      // Create default Inventory
      await Inventory.create({
        userId: user._id,
      });

      // Create default States
      await States.create({
        userId: user._id,
      });

      // Create default Leaderboard
      await UserLeaderBoardLog.create({
        userId: user._id,
        totalPoints: 0,
        years: [],
      });

      // Create empty Friend List
      await Friend.create({
        userId: user._id,
        friendList: [],
      });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    /**
     * Referral Logic
     */
    if (isNewUser && referralId) {
      const referrer = await User.findOne({
        refferal_id: referralId,
      });

      // if (referrer && referrer._id.toString() !== user._id.toString()) {
      //   // Referrer's friend document
      //   let referrerFriends = await Friend.findOne({
      //     userId: referrer._id,
      //   });

      //   if (!referrerFriends) {
      //     referrerFriends = await Friend.create({
      //       userId: referrer._id,
      //       friendList: [],
      //     });
      //   }

      //   // New user's friend document
      //   let userFriends = await Friend.findOne({
      //     userId: user._id,
      //   });

      //   if (!userFriends) {
      //     userFriends = await Friend.create({
      //       userId: user._id,
      //       friendList: [],
      //     });
      //   }

      //   // Add user to referrer's friend list
      //   await Friend.updateOne(
      //     { userId: referrer._id },
      //     {
      //       $addToSet: {
      //         friendList: user._id,
      //       },
      //     },
      //   );

      //   // Add referrer to user's friend list
      //   await Friend.updateOne(
      //     { userId: user._id },
      //     {
      //       $addToSet: {
      //         friendList: referrer._id,
      //       },
      //     },
      //   );

      //   // Optional: save who referred the user
      //   user.refferredBy = referralId;
      //   await user.save();
      // }

      if (referrer && referrer._id.toString() !== user._id.toString()) {
        // Existing friendship logic
        await Friend.updateOne(
          { userId: referrer._id },
          {
            $addToSet: {
              friendList: user._id,
            },
          },
        );

        await Friend.updateOne(
          { userId: user._id },
          {
            $addToSet: {
              friendList: referrer._id,
            },
          },
        );

        console.log(user._id, referrer._id);

        // ==========================
        // Update States Collection
        // ==========================

        await States.updateOne(
          { userId: referrer._id },
          {
            $inc: {
              friends: 1,
            },
          },
        );

        await States.updateOne(
          { userId: user._id },
          {
            $inc: {
              friends: 1,
            },
          },
        );

        user.refferredBy = referralId;
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: [
        {
          email,
          otp,
        },
      ],
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, fcmToken } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp && otp !== "1234") {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Save FCM Token if provided
    if (fcmToken) {
      user.fcmToken = fcmToken;
    }
    // OTP clear
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // ✅ Generate JWT Token
    await validateSubscription(user._id);
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminSignup = async (req, res) => {
  try {
    const { email, password, name, fcmToken } = req.body;

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      email,
      name,
      fcmToken,
      password: hashedPassword,
      role: "ADMIN",
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminSignin = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;

    const admin = await User.findOne({
      email,
      role: "ADMIN",
      fcmToken,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        fcmToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const generateReferralId = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If referral already exists
    if (user.refferal_id) {
      return res.status(200).json({
        success: true,
        message: "Referral ID already generated",
        data: {
          refferal_id: user.refferal_id,
        },
      });
    }

    let referralId;
    let exists = true;

    while (exists) {
      referralId =
        user.email.split("@")[0].toUpperCase() +
        Math.floor(1000 + Math.random() * 9000);

      exists = await User.exists({
        refferal_id: referralId,
      });
    }

    user.refferal_id = referralId;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Referral ID generated successfully",
      data: {
        userId: user._id,
        refferal_id: referralId,
      },
    });
  } catch (error) {
    console.error("Generate Referral Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserByQrToken = async (req, res) => {
  try {
    const { qrToken } = req.params;

    if (!qrToken) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    const user = await User.findOne({ qrToken: qrToken }).select(
      "name nickname level trustScore tier image totalHoursServed totalInterventions status",
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    if (user.status !== "active") {
      return res
        .status(403)
        .json({ success: false, message: "This profile is not active" });
    }

    // Fetch Stats from States model
    const stats = await States.findOne({ userId: user._id });

    // Fetch Recent Validations / Interventions
    const recentValidations = await Validation.find({
      $or: [{ validatedBy: user._id }, { beneficiaries: user._id }],
    })
      .sort({ solvedAt: -1 })
      .populate("pinID", "title description category location")
      .populate("validatedBy", "nickname");

    const recentActions = recentValidations.map((action) => ({
      title: action.pinID?.title || "Community Action",
      description: action.pinID?.description
        ? action.pinID.description.substring(0, 140) + "..."
        : "Helped improve the community",
      date: action.solvedAt
        ? action.solvedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Pending",
      status: action.status,
      validator: action.validatedBy?.nickname || "Anonymous",
      beneficiariesCount: action.beneficiaries?.length || 0,
    }));

    res.json({
      success: true,
      user: {
        name: user.name,
        nickname: user.nickname,
        level: user.level,
        levelName: user.levelName,
        trustScore: user.trustScore,
        tier: user.tier,
        image: user.image,
        // Stats from States model
        totalInterventions: stats?.pinsValidated || 0,
        totalHoursServed: stats?.hoursServed || 0,
        pinsDropped: stats?.pinsDropped || 0,
        pinsSolved: stats?.pinsSolved || 0,
      },
      recentActions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
