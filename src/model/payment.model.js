// models/payment.model.js

import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    customerId: {
      type: String,
    },

    paymentIntentId: {
      type: String,
    },

    clientSecret: {
      type: String,
    },

    planName: {
      type: String,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "eur",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "succeeded",
        "failed",
        "cancelled",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Payment",
  paymentSchema
);