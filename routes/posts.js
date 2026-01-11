const router = require("express").Router();
const Post = require("../Models/Post");
const User = require("../Models/User");
const { verifyToken } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const validate = require("../middleware/validate");
const {
  createPostValidation,
  updatePostValidation,
  postIdValidation,
  likePostValidation
} = require("../validators/postValidators");
const { postLimiter } = require("../middleware/rateLimiter");
const { logger } = require("../utils/logger");

//create a post
router.post("/",
  verifyToken,
  postLimiter,
  createPostValidation,
  validate,
  asyncHandler(async (req, res) => {
    // Ensure the userId matches the authenticated user
    if (req.body.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only create posts for your own account"
      });
    }

    const newPost = new Post(req.body);
    const savedPost = await newPost.save();
    
    logger.logInfo('Post created', { postId: savedPost._id, userId: req.user.id });
    
    res.status(200).json({
      success: true,
      message: "Post created successfully",
      post: savedPost
    });
  })
);

//update a post
router.put("/:id",
  verifyToken,
  updatePostValidation,
  validate,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }
    
    if (post.userId !== req.body.userId || post.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can update only your post"
      });
    }
    
    await post.updateOne({ $set: req.body });
    
    logger.logInfo('Post updated', { postId: post._id, userId: req.user.id });
    
    res.status(200).json({
      success: true,
      message: "The post has been updated"
    });
  })
);

//delete a post
router.delete("/:id",
  verifyToken,
  postIdValidation,
  validate,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }
    
    if (post.userId !== req.body.userId || post.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your post"
      });
    }
    
    await post.deleteOne();
    
    logger.logInfo('Post deleted', { postId: post._id, userId: req.user.id });
    
    res.status(200).json({
      success: true,
      message: "The post has been deleted"
    });
  })
);

//like or dislike a post
router.put("/:id/like",
  verifyToken,
  likePostValidation,
  validate,
  asyncHandler(async (req, res) => {
    // Ensure the userId matches the authenticated user
    if (req.body.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only like posts with your own account"
      });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }
    
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json({
        success: true,
        message: "The post has been liked"
      });
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json({
        success: true,
        message: "The post has been disliked"
      });
    }
  })
);

//get a post
router.get("/:id",
  postIdValidation,
  validate,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }
    
    res.status(200).json({
      success: true,
      post
    });
  })
);

//get timeline posts
router.get("/timeline/:userId",
  asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.params.userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    
    res.status(200).json(userPosts.concat(...friendPosts).sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }));
  })
);

//get user's all posts
router.get("/profile/:username",
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      posts
    });
  })
);

module.exports = router;