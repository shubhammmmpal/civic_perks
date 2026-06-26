
// import dotenv from "dotenv";
// dotenv.config();

import express from "express";
import { createPaymentIntent,updatePaymentStatus,verifyPayment,stripeWebhook } from "../controller/payment.controller.js";
// import Stripe from "stripe";

const router = express.Router();

// const stripe = new Stripe(
//   process.env.STRIPE_SECRET_KEY
// );

// ========================================
// CREATE PAYMENT INTENT API
// ========================================

router.post(
  "/create-payment-intent",
  createPaymentIntent
);
router.post("/verify-payment", verifyPayment);

// routes/payment.routes.js

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
// router.post(
//   "/verify-payment",
//   updatePaymentStatus
// );

// router.post(
//   "/create-payment-intent",
//   async (req, res) => {

//     try {

//       const {
//         amount,
//         currency = "inr",
//         planName,
//         userId,
//       } = req.body;

//       // VALIDATION

//       if (!amount || amount <= 0) {

//         return res.status(400).json({
//           success: false,
//           error: "Invalid amount",
//         });
//       }

//       // ========================================
//       // 1. CREATE CUSTOMER
//       // ========================================

//       const customer =
//         await stripe.customers.create({
//           metadata: {
//             userId:
//               userId || "guest",

//             planName:
//               planName || "",
//           },
//         });

//       // ========================================
//       // 2. CREATE EPHEMERAL KEY
//       // ========================================

//       const ephemeralKey =
//         await stripe.ephemeralKeys.create(
//           {
//             customer:
//               customer.id,
//           },
//           {
//             apiVersion:
//               "2024-06-20",
//           },
//         );

//       // ========================================
//       // 3. CREATE PAYMENT INTENT
//       // ========================================

//       const paymentIntent =
//         await stripe.paymentIntents.create({
//           amount:
//             Math.round(amount * 100),

//           currency,

//           customer:
//             customer.id,

//           description:
//             `Purchase: ${planName}`,

//           automatic_payment_methods: {
//             enabled: true,
//           },
//         });

//       // ========================================
//       // 4. SEND RESPONSE
//       // ========================================

//       res.json({
//         success: true,

//         paymentIntent:
//           paymentIntent.client_secret,

//         ephemeralKey:
//           ephemeralKey.secret,

//         customer:
//           customer.id,
//       });

//     } catch (error) {

//       console.log(
//         "STRIPE ERROR:",
//         error,
//       );

//       res.status(500).json({
//         success: false,
//         error: error.message,
//       });
//     }
//   },
// );

export default router;