// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
   {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    senderRole: {
      type: String,
      default: "admin",
    },

    // Private notifications ke liye
    receivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Per-user read status
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);


export default mongoose.model("PublicPrivateNotification", notificationSchema);
