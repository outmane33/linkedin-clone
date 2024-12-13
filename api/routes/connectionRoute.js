const express = require("express");
const {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionRequests,
  getUserConnections,
  removeConnection,
  getConnectionStatus,
} = require("../services/connectionService");
const { protect } = require("../services/authServcie");
const router = express.Router();

router.post("/request/:userId", protect, sendConnectionRequest);
router.put("/accept/:requestId", protect, acceptConnectionRequest);
router.put("/reject/:requestId", protect, rejectConnectionRequest);
// Get all connection requests for the current user
router.get("/requests", protect, getConnectionRequests);
// Get all connections for a user
router.get("/", protect, getUserConnections);
router.delete("/:userId", protect, removeConnection);
router.get("/status/:userId", protect, getConnectionStatus);

module.exports = router;
