const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const { generateToken } = require("../utils/generateToken");
const { sendWelcomeEmail } = require("../emails/emailHandlers");

exports.signUp = expressAsyncHandler(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    username: req.body.username,
  });
  const token = generateToken(user);
  res
    .status(201)
    .cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
    })
    .json({
      status: "success",
      user,
    });

  try {
    const profileUrl = `${process.env.FRONTEND_URL}/profile/${user.username}`;
    await sendWelcomeEmail(user.email, user.name, profileUrl);
  } catch (err) {
    console.log(err);
  }
});

exports.signIn = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Invalid username or password", 401));
  }
  const token = generateToken(user);
  res
    .status(200)
    .cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
    })
    .json({
      status: "success",
      user,
    });
});

exports.signOut = expressAsyncHandler(async (req, res, next) => {
  res.status(200).clearCookie("access_token").json({
    status: "success",
  });
});

exports.protect = expressAsyncHandler(async (req, res, next) => {
  //get token
  let token = req.cookies.access_token;
  if (!token) {
    return next(new ApiError("You are not logged in", 401));
  }

  //verify token
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  //get user from the token
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  req.user = user;
  next();
});
