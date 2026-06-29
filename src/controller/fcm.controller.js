import User from "../model/user.model.js"

export const saveFCMToken = async (req, res) => {
  try {
    const userId = req.user.id;

    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM Token is required",
      });
    }

    await User.findByIdAndUpdate(
      userId,
      {
        fcmToken,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "FCM Token saved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};