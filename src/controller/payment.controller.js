// controllers/payment.controller.js
import dotenv from "dotenv";
dotenv.config();

import Stripe from "stripe";
import Payment from "../model/payment.model.js";
import User from "../model/user.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, planName, userId } = req.body;

    // Validation

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Create Customer

    const customer = await stripe.customers.create({
      metadata: {
        userId: userId || "guest",
        planName: planName || "",
      },
    });

    // Create Ephemeral Key

    const ephemeralKey = await stripe.ephemeralKeys.create(
      {
        customer: customer.id,
      },
      {
        apiVersion: "2024-06-20",
      },
    );

    // Create Payment Intent

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),

      currency: "eur",

      customer: customer.id,

      description: `Purchase: ${planName}`,

      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save Payment

    const payment = await Payment.create({
      userId,
      customerId: customer.id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      planName,
      amount,
      currency: "eur",
      status: "pending",
    });

    const startDate = new Date();

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await User.findByIdAndUpdate(userId, {
      tier: planName,
      subscriptionStatus: "active",
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
    });

    return res.status(200).json({
      success: true,
      paymentId: payment._id,

      paymentIntentId: paymentIntent.id,

      clientSecret: paymentIntent.client_secret,

      ephemeralKey: ephemeralKey.secret,

      customer: customer.id,
    });
  } catch (error) {
    console.log("STRIPE PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// controllers/payment.controller.js

export const stripeWebhook = async (
  req,
  res
) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(
      `Webhook Error: ${err.message}`
    );
  }

  switch (event.type) {
    case "payment_intent.succeeded":

      const paymentIntent =
        event.data.object;

      const payment =
        await Payment.findOne({
          paymentIntentId:
            paymentIntent.id,
        });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found",
        });
      }

      // Prevent duplicate processing

      if (
        payment.status ===
        "succeeded"
      ) {
        return res
          .status(200)
          .json({
            received: true,
          });
      }

      await Payment.findByIdAndUpdate(
        payment._id,
        {
          status: "succeeded",
        }
      );

      const startDate =
        new Date();

      const endDate =
        new Date();

      endDate.setMonth(
        endDate.getMonth() + 1
      );

      await User.findByIdAndUpdate(
        payment.userId,
        {
          tier:
            payment.planName,
          subscriptionStatus:
            "active",
          subscriptionStartDate:
            startDate,
          subscriptionEndDate:
            endDate,
        }
      );

      break;

    case "payment_intent.payment_failed":

      await Payment.findOneAndUpdate(
        {
          paymentIntentId:
            event.data.object.id,
        },
        {
          status: "failed",
        }
      );

      break;
  }

  res.status(200).json({
    received: true,
  });
};

export const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const stripePayment = await stripe.paymentIntents.retrieve(paymentIntentId);

    let status = "pending";

    switch (stripePayment.status) {
      case "succeeded":
        status = "succeeded";
        break;

      case "canceled":
        status = "cancelled";
        break;

      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
      case "processing":
        status = "pending";
        break;

      default:
        status = "failed";
    }

    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId },
      { status },
      { new: true },
    );

    // Activate plan only if payment succeeded
    if (status === "succeeded") {
      const startDate = new Date();

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await User.findByIdAndUpdate(payment.userId, {
        tier: payment.planName,
        subscriptionStatus: "active",
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      });
    }

    return res.status(200).json({
      success: true,
      paymentStatus: status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const stripePayment = await stripe.paymentIntents.retrieve(paymentIntentId);

    const payment = await Payment.findOneAndUpdate(
      {
        paymentIntentId,
      },
      {
        status: stripePayment.status,
      },
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const {
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Only admin can view all payments
    if (role !== "ADMIN") {
      query.userId = userId;
    }

    // ==========================
    // Search
    // ==========================
    if (search) {
      const regex = new RegExp(search, "i");

      // Search by payment fields
      query.$or = [
        { paymentIntentId: regex },
        { customerId: regex },
        { planName: regex },
        { status: regex },
      ];

      // Admin can also search by user details
      if (role === "ADMIN") {
        const users = await User.find({
          $or: [
            { name: regex },
            { username: regex },
            { email: regex },
          ],
        }).select("_id");

        if (users.length) {
          query.$or.push({
            userId: {
              $in: users.map((u) => u._id),
            },
          });
        }
      }
    }

    // ==========================
    // Date Filter
    // ==========================
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("userId", "name username email")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: payments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
