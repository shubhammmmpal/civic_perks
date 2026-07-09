import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
       notificationType:{
        type: String
       },

    receivers: [
      {type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    senderRole:{
      type: String
    },
 
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
export default mongoose.model('Notification', notificationSchema);