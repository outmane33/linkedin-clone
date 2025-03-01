const expressAsyncHandler = require("express-async-handler");

const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const ConnectionRequest = require("../models/connectionRequestModel");
const { sendConnectionAcceptedEmail } = require("../emails/emailHandlers");

exports.sendConnectionRequest = expressAsyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const senderId = req.user._id;

  if (senderId.toString() === userId) {
    return res
      .status(400)
      .json({ message: "You can't send a request to yourself" });
  }

  if (req.user.connections.includes(userId)) {
    return res.status(400).json({ message: "You are already connected" });
  }

  const existingRequest = await ConnectionRequest.findOne({
    sender: senderId,
    recipient: userId,
    status: "pending",
  });

  if (existingRequest) {
    return res
      .status(400)
      .json({ message: "A connection request already exists" });
  }

  const newRequest = new ConnectionRequest({
    sender: senderId,
    recipient: userId,
  });

  await newRequest.save();

  res.status(201).json({
    status: "success",
    message: "Connection request sent successfully",
  });
});

exports.acceptConnectionRequest = expressAsyncHandler(
  async (req, res, next) => {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findById(requestId)
      .populate("sender", "name email username")
      .populate("recipient", "name username");

    if (!request) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    // check if the req is for the current user
    if (request.recipient._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to accept this request" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This request has already been processed" });
    }

    request.status = "accepted";
    await request.save();

    // if im your friend then ur also my friend ;)
    await User.findByIdAndUpdate(request.sender._id, {
      $addToSet: { connections: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { connections: request.sender._id },
    });

    const notification = new Notification({
      recipient: request.sender._id,
      type: "connectionAccepted",
      relatedUser: userId,
    });

    await notification.save();

    res.status(200).json({
      status: "success",
      message: "Connection accepted successfully",
    });

    const senderEmail = request.sender.email;
    const senderName = request.sender.name;
    const recipientName = request.recipient.name;
    const profileUrl =
      process.env.FRONTEND_URL + "/profile/" + request.recipient.username;

    try {
      await sendConnectionAcceptedEmail(
        senderEmail,
        senderName,
        recipientName,
        profileUrl
      );
    } catch (error) {
      console.error("Error in sendConnectionAcceptedEmail:", error);
    }
  }
);

exports.rejectConnectionRequest = expressAsyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const request = await ConnectionRequest.findById(requestId);

  if (request.recipient.toString() !== userId.toString()) {
    return res
      .status(403)
      .json({ message: "Not authorized to reject this request" });
  }

  if (request.status !== "pending") {
    return res
      .status(400)
      .json({ message: "This request has already been processed" });
  }

  request.status = "rejected";
  await request.save();

  res.status(200).json({
    status: "success",
    message: "Connection request rejected successfully",
  });
});

exports.getConnectionRequests = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const requests = await ConnectionRequest.find({
    recipient: userId,
    status: "pending",
  }).populate("sender", "name username profilePicture headline connections");

  res.status(200).json({
    status: "success",
    requests,
  });
});

exports.getUserConnections = expressAsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).populate(
    "connections",
    "name username profilePicture headline connections"
  );

  res.status(200).json({
    status: "success",
    connections: user.connections,
  });
});

exports.removeConnection = expressAsyncHandler(async (req, res) => {
  const myId = req.user._id;
  const { userId } = req.params;

  await User.findByIdAndUpdate(myId, { $pull: { connections: userId } });
  await User.findByIdAndUpdate(userId, { $pull: { connections: myId } });

  res.status(200).json({
    status: "success",
    message: "Connection removed successfully",
  });
});

exports.getConnectionStatus = expressAsyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user._id;

  const currentUser = req.user;
  if (currentUser.connections.includes(targetUserId)) {
    return res.json({ status: "connected" });
  }

  const pendingRequest = await ConnectionRequest.findOne({
    $or: [
      { sender: currentUserId, recipient: targetUserId },
      { sender: targetUserId, recipient: currentUserId },
    ],
    status: "pending",
  });

  if (pendingRequest) {
    if (pendingRequest.sender.toString() === currentUserId.toString()) {
      return res.json({ status: "pending" });
    } else {
      return res.json({ status: "received", requestId: pendingRequest._id });
    }
  }

  // if no connection or pending req found
  res.json({ status: "not_connected" });
});
