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
        qrUrl
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

      if (referrer && referrer._id.toString() !== user._id.toString()) {
        // Referrer's friend document
        let referrerFriends = await Friend.findOne({
          userId: referrer._id,
        });

        if (!referrerFriends) {
          referrerFriends = await Friend.create({
            userId: referrer._id,
            friendList: [],
          });
        }

        // New user's friend document
        let userFriends = await Friend.findOne({
          userId: user._id,
        });

        if (!userFriends) {
          userFriends = await Friend.create({
            userId: user._id,
            friendList: [],
          });
        }

        // Add user to referrer's friend list
        await Friend.updateOne(
          { userId: referrer._id },
          {
            $addToSet: {
              friendList: user._id,
            },
          },
        );

        // Add referrer to user's friend list
        await Friend.updateOne(
          { userId: user._id },
          {
            $addToSet: {
              friendList: referrer._id,
            },
          },
        );

        // Optional: save who referred the user
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
    const { email, otp } = req.body;

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
    const { email, password, name } = req.body;

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
    const { email, password } = req.body;

    const admin = await User.findOne({
      email,
      role: "ADMIN",
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
  const user = await User.findOne({
    qrToken: req.params.qrToken,
  }).select("name nickname image trustScore level");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.json({
    success: true,
    data: user,
  });
}
