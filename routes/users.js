const User = require('../Models/User');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const {
  updateUserValidation,
  userIdValidation,
  followValidation
} = require('../validators/userValidators');
const { logger } = require('../utils/logger');

// Get user profile details by username (includes counts)
router.get('/username/:username',
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Count posts by user
    const Post = require('../Models/Post');
    const postsCount = await Post.countDocuments({ userId: user._id });

    const followers = user.followers || [];
    const followings = user.followings || [];

    const { password, updatedAt, resetPasswordToken, resetPasswordExpire, ...other } = user._doc;

    res.status(200).json({
      success: true,
      user: other,
      stats: {
        posts: postsCount,
        followers: followers.length,
        following: followings.length
      },
      followers: followers.slice(0, 50),
      followings: followings.slice(0, 50)
    });
  })
);

// Update user
router.put('/:id',
  verifyToken,
  updateUserValidation,
  validate,
  asyncHandler(async (req, res) => {
    // Check if the user is authorized to update their account
    if (req.body.userId !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your account'
      });
    }

    // Verify the authenticated user matches
    if (req.body.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // If the password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    // Remove userId from the update body to prevent updating it
    delete req.body.userId;

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password, ...userData } = updatedUser._doc;
    
    logger.logInfo('User profile updated', { userId: updatedUser._id });

    res.status(200).json({
      success: true,
      message: 'Account has been updated',
      user: userData
    });
  })
);

// Delete user
router.delete('/:id',
  verifyToken,
  userIdValidation,
  validate,
  asyncHandler(async (req, res) => {
    // Check if the user is authorized to delete their account
    if (req.params.id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your account'
      });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    logger.logInfo('User account deleted', { userId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Account has been deleted'
    });
  })
);

// Get User
router.get("/:id",
  userIdValidation,
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const { password, updatedAt, resetPasswordToken, resetPasswordExpire, ...other } = user._doc;
    
    res.status(200).json({
      success: true,
      user: other
    });
  })
);

// Follow User
router.put("/:id/follow",
  verifyToken,
  followValidation,
  validate,
  asyncHandler(async (req, res) => {
    // Prevent self-following
    if (req.body.userId === req.params.id) {
      return res.status(403).json({
        success: false,
        message: "You can't follow yourself"
      });
    }

    // Ensure the userId matches the authenticated user
    if (req.body.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only follow with your own account"
      });
    }

    // Find the user to be followed and the current user who is following
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);

    // Check if the user exists
    if (!user || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the current user already follows the target user
    if (user.followers.includes(req.body.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You already follow this user'
      });
    }

    // Add current user to the target user's followers
    await user.updateOne({ $push: { followers: req.body.userId } });
    // Add target user to the current user's followings
    await currentUser.updateOne({ $push: { followings: req.params.id } });

    logger.logInfo('User followed', { followerId: req.body.userId, followedId: req.params.id });

    res.status(200).json({
      success: true,
      message: "User has been followed"
    });
  })
);

//Unfollow User
router.put("/:id/unfollow",
  verifyToken,
  followValidation,
  validate,
  asyncHandler(async (req, res) => {
    // Prevent self-unfollowing
    if (req.body.userId === req.params.id) {
      return res.status(403).json({
        success: false,
        message: "You can't unfollow yourself"
      });
    }

    // Ensure the userId matches the authenticated user
    if (req.body.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only unfollow with your own account"
      });
    }

    // Find the user to be unfollowed and the current user
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);

    // Check if the user exists
    if (!user || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the current user follows the target user
    if (!user.followers.includes(req.body.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }

    // Remove current user from the target user's followers
    await user.updateOne({ $pull: { followers: req.body.userId } });
    // Remove target user from the current user's followings
    await currentUser.updateOne({ $pull: { followings: req.params.id } });

    logger.logInfo('User unfollowed', { followerId: req.body.userId, unfollowedId: req.params.id });

    res.status(200).json({
      success: true,
      message: "User has been unfollowed"
    });
  })
);

module.exports = router;
