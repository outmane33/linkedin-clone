const express = require("express");
const {
  getLoggedInUser,
  getSuggestedConnections,
  getPublicProfile,
  updateProfile,
} = require("../services/userService");
const { protect } = require("../services/authServcie");
const router = express.Router();

router.get("/me", protect, getLoggedInUser);
router.get("/suggestions", protect, getSuggestedConnections);
router.get("/:username", getPublicProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;
