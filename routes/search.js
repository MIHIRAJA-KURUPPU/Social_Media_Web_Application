const router = require('express').Router();
const User = require('../Models/User');
const Post = require('../Models/Post');
const { asyncHandler } = require('../middleware/errorHandler');

// Search users by query
router.get('/users', asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  const regex = new RegExp(q, 'i');
  const users = await User.find({ username: regex }).limit(50).select('-password -resetPasswordToken -resetPasswordExpire');
  res.status(200).json({ success: true, users });
}));

// Search posts by text
router.get('/posts', asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  const regex = new RegExp(q, 'i');
  const posts = await Post.find({ desc: regex }).limit(100).sort({ createdAt: -1 });
  res.status(200).json({ success: true, posts });
}));

module.exports = router;
