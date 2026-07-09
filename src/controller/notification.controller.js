import PublicPrivateNotification from "../model/publicPrivateNotification.model.js"
import Notification from "../model/notification.model.js";
import User from "../model/user.model.js"
// import admin from '../config/firebase.js'
import { messaging } from "../config/firebase.js";
import mongoose from "mongoose";

export const createNotification = async (req, res) => {
  try {
    const { title, description, type = "public", receivers = [] } = req.body;

    // basic validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Private notification ke liye receivers mandatory
    if (type === "private" && receivers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Receivers are required for private notification",
      });
    }
    let receiversIds = [];
    let notificationError = null;
    try {
      for (const m of receivers) {
        let memberUser = null;

        // check if ObjectId
        if (mongoose.Types.ObjectId.isValid(m)) {
          memberUser = await User.findById(m);
        }
        // otherwise assume email
        else {
          memberUser = await User.findOne({ email: m });
        }
        if (memberUser?._id) {
          receiversIds.push(memberUser?._id);
        }

        console.log(receiversIds);
        // if (m.user.toString() !== userId.toString() && m.status !== "accepted") {
        // const memberUser = (await User.findById(m)) || (await User.findBy(m));
        if (memberUser && memberUser?.fcmToken) {
          const message = {
            notification: {
              title: title,
              body: description,
            },
            token: memberUser?.fcmToken,
            data: {
              title: "testt",
              description: "desccc testtttt",
            },
          };
          try {
            // await admin.messaging().send(message);
            await messaging.send(message);
          } catch (fcmError) {
            console.error("FCM notification error:", fcmError);
            // throw new Error("Failed to send FCM notification: " + fcmError.message);
            notificationError = fcmError.message;
          }
        }

        // }
      }
    } catch (notifyError) {
      console.error("Notification sending error:", notifyError);
      // return res.status(500).json({ success: false, message: "Failed to send notification", error: notifyError.message });
      notificationError = notifyError.message;
    }

    // Create notification
    const notification = await PublicPrivateNotification.create({
      title,
      description,
      type,
      receivers: type === "private" ? receiversIds : [],
      senderRole: "admin",
    });

    // 🟢 Push logic (without FCM)
    // In-app push => DB me notification aa gayi
    // Frontend polling / socket se fetch karega

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Create Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth middleware

    // Personal Notifications
    const personalNotifications = await Notification.find({
      receivers: userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Public + Private Notifications
    const commonNotifications = await PublicPrivateNotification.find({
      $or: [
        { type: "public" },
        { receivers: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Merge both collections
    const notifications = [
      ...personalNotifications,
      ...commonNotifications,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 }); 

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const sendPushNotificationToAllUsers = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Both title and description are required.",
        });
    }
    const users = await User.find({
      role: "user",
      fcmToken: { $nin: [null, ""] },
    }).select("email fcmToken");
    if (users.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No users found with valid FCM tokens.",
        });
    }
    let successCount = 0;
    let failedCount = 0;
    let failedUsers = [];
    for (const user of users) {
      try {
        await admin
          .messaging()
          .send({
            token: user.fcmToken,
            notification: { title, body: description },
          });
        successCount++;
      } catch (err) {
        failedCount++;
        failedUsers.push({
          email: user.email,
          error: err.message || "Unknown error",
        });
      }
    }
    return res.json({
      success: true,
      message: "Push notification process completed.",
      summary: {
        totalUsers: users.length,
        successCount,
        failedCount,
        failedUsers,
      },
    });
  } catch (error) {
    console.error("🔥 Server error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error occurred. Please try again later.",
      });
  }
};

export const readNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { senderRole } = req.query;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification id",
      });
    }

    let notification;

    if (senderRole === "system") {
      notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          receivers: userId,
        },
        {
          isRead: true,
        },
        {
          new: true,
        }
      );
    } else if (senderRole === "admin") {
      notification = await PublicPrivateNotification.findOneAndUpdate(
        {
          _id: notificationId,
          $or: [
            { type: "public" },
            { receivers: userId },
          ],
        },
        {
          $addToSet: {
            readBy: userId,
          },
        },
        {
          new: true,
        }
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid senderRole",
      });
    }

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { senderRole } = req.query;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification id",
      });
    }

    // ============================================
    // PERSONAL NOTIFICATION
    // ============================================

    if (senderRole === "system") {
      const notification = await Notification.findOne({
        _id: notificationId,
        receivers: userId,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      if (notification.receivers.length === 1) {
        await Notification.findByIdAndDelete(notificationId);
      } else {
        await Notification.findByIdAndUpdate(notificationId, {
          $pull: {
            receivers: userId,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    }

    // ============================================
    // PUBLIC / PRIVATE NOTIFICATION
    // ============================================

    if (senderRole === "admin") {
      const notification = await PublicPrivateNotification.findOne({
        _id: notificationId,
        receivers: userId,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      if (notification.receivers.length === 1) {
        await PublicPrivateNotification.findByIdAndDelete(notificationId);
      } else {
        await PublicPrivateNotification.findByIdAndUpdate(notificationId, {
          $pull: {
            receivers: userId,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid senderRole",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};