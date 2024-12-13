const express = require("express");
const {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} = require("../services/notificationService");
const { protect } = require("../services/authServcie");
const router = express.Router();

router.get("/", protect, getUserNotifications);
router.put("/:id/read", protect, markNotificationAsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
