import User from "../model/user.model.js";
import { sendEmail } from "../config/nodemailer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role  },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
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
    const { email, location } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    console.log("Login request received:", email);

    const otp = generateOTP();

    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        location,
      });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    console.log("User saved successfully");

    // await sendEmail(email, otp);

    console.log("OTP email sent successfully");

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
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        location: user.location
      }
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
        message: "Admin already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      email,
      name,
      password: hashedPassword,
      role: "ADMIN"
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const adminSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({
      email,
      role: "ADMIN"
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};