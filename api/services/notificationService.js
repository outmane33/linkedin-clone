const expressAsyncHandler = require("express-async-handler");

const ApiError = require("../utils/apiError");
const Notification = require("../models/notificationModel");

exports.getUserNotifications = expressAsyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .populate("relatedUser", "name username profilePicture")
    .populate("relatedPost", "content image");

  res.status(200).json({
    status: "success",
    notifications,
  });
});

exports.markNotificationAsRead = expressAsyncHandler(async (req, res, next) => {
  const notificationId = req.params.id;

  const notification = await Notification.findByIdAndUpdate(
    { _id: notificationId, recipient: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return next(new ApiError("Notification not found", 404));
  }

  res.json({
    status: "success",
    notification,
  });
});

exports.deleteNotification = expressAsyncHandler(async (req, res) => {
  const notificationId = req.params.id;

  await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: req.user._id,
  });

  res.status(200).json({
    status: "success",
  });
});
