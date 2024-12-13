const expressAsyncHandler = require("express-async-handler");

const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const cloudinary = require("../utils/coudinary");

exports.getLoggedInUser = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  res.status(200).json({
    status: "success",
    user,
  });
});

exports.getSuggestedConnections = expressAsyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).select("connections");

  // find users who are not already connected, and also do not recommend our own profile!! right?
  const suggestedUser = await User.find({
    _id: {
      $ne: req.user._id,
      $nin: currentUser.connections,
    },
  })
    .select("name username profilePicture headline")
    .limit(3);

  res.status(200).json({
    status: "success",
    suggestedUser,
  });
});

exports.getPublicProfile = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username }).select(
    "-password"
  );
  if (!user) {
    res.status(404).json({
      status: "fail",
      message: "User not found",
    });
  }
  res.status(200).json({
    status: "success",
    user,
  });
});

exports.updateProfile = expressAsyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "username",
    "headline",
    "about",
    "location",
    "profilePicture",
    "bannerImg",
    "skills",
    "experience",
    "education",
  ];

  const updatedData = {};

  for (const field of allowedFields) {
    if (req.body[field]) {
      updatedData[field] = req.body[field];
    }
  }

  if (req.body.profilePicture) {
    const result = await cloudinary.uploader.upload(req.body.profilePicture);
    updatedData.profilePicture = result.secure_url;
  }

  if (req.body.bannerImg) {
    const result = await cloudinary.uploader.upload(req.body.bannerImg);
    updatedData.bannerImg = result.secure_url;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updatedData },
    { new: true }
  ).select("-password");

  res.status(200).json({
    status: "success",
    user,
  });
});
