// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import cors from "cors";
// import {connectDB} from "./src/db/db.js";
// import authRoutes from "./src/routes/auth.route.js";
// import planRoutes from "./src/routes/plan.route.js";
// import QuestionRoutes from "./src/routes/question.route.js";
// import pinRoutes from "./src/routes/pin.route.js";
// import ValidationRoutes from "./src/routes/validation.route.js";
// // const userRoutes = require("./routes/userRoutes");
// // const postRoutes = require("./routes/postRoutes");

// const app = express();

// app.use(cors());
// app.use(express.json());

// connectDB();

// app.use("/api/auth", authRoutes);
// app.use("/api/plans", planRoutes);
// app.use("/api", QuestionRoutes);
// app.use("/api", pinRoutes);
// app.use("/api/validation", ValidationRoutes);
// // app.use("/api/users", userRoutes);
// // app.use("/api/posts", postRoutes);

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// }); 


// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";

// import { connectDB } from "./src/db/db.js";

// import authRoutes from "./src/routes/auth.route.js";
// import planRoutes from "./src/routes/plan.route.js";
// import QuestionRoutes from "./src/routes/question.route.js";
// import pinRoutes from "./src/routes/pin.route.js";
// import ValidationRoutes from "./src/routes/validation.route.js";
// import activityRoutes from "./src/routes/activity.route.js";

// const app = express();

// app.use(cors());
// app.use(express.json());

// connectDB();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Serve uploads folder
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.use("/api/auth", authRoutes);
// app.use("/api/plans", planRoutes);
// app.use("/api", QuestionRoutes);
// app.use("/api", pinRoutes);
// app.use("/api/validation", ValidationRoutes);
// app.use("/api/activity", activityRoutes);
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });







// -------



// server.js
// ====================== server.js ======================
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env BEFORE any other import
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ 
  path: path.resolve(process.cwd(), ".env") 
});

console.log("✅ .env file path:", path.resolve(process.cwd(), ".env"));
console.log("🔑 STRIPE_SECRET_KEY Loaded:", process.env.STRIPE_SECRET_KEY ? "✅ YES" : "❌ NO");

import express from "express";
import cors from "cors";

import { connectDB } from "./src/db/db.js";
import authRoutes from "./src/routes/auth.route.js";
import planRoutes from "./src/routes/plan.route.js";
import QuestionRoutes from "./src/routes/question.route.js";
import pinRoutes from "./src/routes/pin.route.js";
import ValidationRoutes from "./src/routes/validation.route.js";
import activityRoutes from "./src/routes/activity.route.js";

import stripeRoutes from "./src/routes/stripe.route.js";

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Civic Perks API Working",
  });
});
// API Routes
app.use("/api/stripe", stripeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api", QuestionRoutes);
app.use("/api", pinRoutes);
app.use("/api/validation", ValidationRoutes);
app.use("/api/activity", activityRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
