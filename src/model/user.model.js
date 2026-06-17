import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email"]
  },

  nickname: {
    type: String,
    unique: true,
    index: true,
    sparse: true,
    default: function () {
      return this.email.split('@')[0] + Math.floor(Math.random() * 1000);
    }
  },

  name: { type: String, trim: true ,default:"unnamed" },
  latitude: { type: Number, index: true },
  longitude: { type: Number, index: true },
//   location: { type: String, index: true },
activeAt: { type: Date, default: Date.now },

  trustScore: { type: Number, default: 75.0, min: 0, max: 99.9 },
  level: { type: Number, default: 1, min: 1 },
  levelName: {
    type: String,
    default: "Observer"
},
  xp: { type: Number, default: 0, min: 0 },
  credits: { type: Number, default: 0, min: 0 },
//   boostType: { type:String, enum: ["X-Ray Filter", "Golden Cargo", "Radar Flare", "Megaphone"] , default:'none'},  
  

  tier: {
    type: String,
   enum: ["Free Tier", "Civic Plus", "Civic Pro"],
    default: "Free Tier"
  },

  qrCode: String,

  accountType: {
    type: String,
    enum: ["public", "private", "friends"],
    default: "public"
  },

  perks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Perk",
    index: true
  }],

  image: String,

  otp: String,
  otpExpiry: {
    type: Date,
    index: { expires: 0 }
  },

  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER"
  },
  plans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaidPlan",
    index: true
  }],
  refferredBy: {
    type: String
  },
  refferal_id: {
    type: String,
  },

  password: {
  type: String,
  // required: true
},

  status: { type: String, enum: ["active", "inactive", "banned"], default: "active" }

}, { timestamps: true });

export default mongoose.model("User", userSchema);