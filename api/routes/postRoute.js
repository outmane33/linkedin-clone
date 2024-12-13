const express = require("express");
const {
  getFeedPosts,
  createPost,
  deletePost,
  getPostById,
  createComment,
  likePost,
} = require("../services/postService");
const { protect } = require("../services/authServcie");
const router = express.Router();

router.get("/", protect, getFeedPosts);
router.post("/create", protect, createPost);
router.delete("/delete/:id", protect, deletePost);
router.get("/:id", protect, getPostById);
router.post("/:id/comment", protect, createComment);
router.post("/:id/like", protect, likePost);

module.exports = router;
