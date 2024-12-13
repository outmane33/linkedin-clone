const expressAsyncHandler = require("express-async-handler");

const ApiError = require("../utils/apiError");
const cloudinary = require("../utils/coudinary");
const Post = require("../models/postModel");
const Notification = require("../models/notificationModel");

exports.getFeedPosts = expressAsyncHandler(async (req, res) => {
  const posts = await Post.find({
    author: { $in: [...req.user.connections, req.user._id] },
  })
    .populate("author", "name username profilePicture headline")
    .populate("comments.user", "name profilePicture")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    posts,
  });
});

exports.createPost = expressAsyncHandler(async (req, res) => {
  const { content, image } = req.body;
  let newPost;

  if (image) {
    const uploadResponse = await cloudinary.uploader.upload(image);
    newPost = new Post({
      author: req.user._id,
      content,
      image: uploadResponse.secure_url,
    });
  } else {
    newPost = new Post({
      author: req.user._id,
      content,
    });
  }

  await newPost.save();

  res.status(201).json({
    status: "success",
    post: newPost,
  });
});

exports.deletePost = expressAsyncHandler(async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.user._id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new ApiError("Post not found", 404));
  }

  // check if the current user is the author of the post
  if (post.author.toString() !== userId.toString()) {
    return next(
      new ApiError("You are not authorized to delete this post", 403)
    );
  }

  // delete the image from cloudinary as well!
  if (post.image) {
    await cloudinary.uploader.destroy(
      post.image.split("/").pop().split(".")[0]
    );
  }

  await Post.findByIdAndDelete(postId);

  res.status(200).json({
    status: "success",
  });
});

exports.getPostById = expressAsyncHandler(async (req, res) => {
  const postId = req.params.id;
  const post = await Post.findById(postId)
    .populate("author", "name username profilePicture headline")
    .populate("comments.user", "name profilePicture username headline");

  res.status(200).json({
    status: "success",
    post,
  });
});

exports.createComment = expressAsyncHandler(async (req, res, next) => {
  const postId = req.params.id;
  const { content } = req.body;
  const post = await Post.findByIdAndUpdate(
    postId,
    {
      $push: { comments: { user: req.user._id, content } },
    },
    { new: true }
  ).populate("author", "name email username headline profilePicture");

  // create a notification if the comment owner is not the post owner
  if (post.author._id.toString() !== req.user._id.toString()) {
    const newNotification = new Notification({
      recipient: post.author,
      type: "comment",
      relatedUser: req.user._id,
      relatedPost: postId,
    });

    await newNotification.save();
  }

  res.status(200).json({
    status: "success",
    post,
  });
});

exports.likePost = expressAsyncHandler(async (req, res) => {
  const postId = req.params.id;
  const post = await Post.findById(postId);
  const userId = req.user._id;

  if (post.likes.includes(userId)) {
    // unlike the post
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    // like the post
    post.likes.push(userId);
    // create a notification if the post owner is not the user who liked
    if (post.author.toString() !== userId.toString()) {
      const newNotification = new Notification({
        recipient: post.author,
        type: "like",
        relatedUser: userId,
        relatedPost: postId,
      });

      await newNotification.save();
    }
  }

  await post.save();

  res.status(200).json(post);
});
