const router = require('express').Router();
const Comment = require('../Models/Comment');
const Post = require('../Models/Post');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const {
  createCommentValidation,
  updateCommentValidation,
  commentIdValidation,
  getCommentsByPostValidation
} = require('../validators/commentValidators');
const { logger } = require('../utils/logger');

// Create a comment
router.post('/',
  verifyToken,
  createCommentValidation,
  validate,
  asyncHandler(async (req, res) => {
    if (req.body.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only create comments for your own account' });
    }

    const post = await Post.findById(req.body.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // If parentId provided, ensure the parent comment exists and belongs to same post
    if (req.body.parentId) {
      const parent = await Comment.findById(req.body.parentId);
      if (!parent || String(parent.postId) !== String(req.body.postId)) {
        return res.status(400).json({ success: false, message: 'Invalid parent comment' });
      }
    }

    const newComment = new Comment({
      postId: req.body.postId,
      userId: req.body.userId,
      text: req.body.text,
      parentId: req.body.parentId || null
    });

    const saved = await newComment.save();
    logger.logInfo('Comment created', { commentId: saved._id, userId: req.user.id, postId: req.body.postId });

    res.status(200).json({ success: true, message: 'Comment created', comment: saved });
  })
);

// Update a comment
router.put('/:id',
  verifyToken,
  updateCommentValidation,
  validate,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (String(comment.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only update your own comments' });
    }

    if (req.body.text) comment.text = req.body.text;
    await comment.save();

    logger.logInfo('Comment updated', { commentId: comment._id, userId: req.user.id });

    res.status(200).json({ success: true, message: 'Comment updated', comment });
  })
);

// Delete a comment
router.delete('/:id',
  verifyToken,
  commentIdValidation,
  validate,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Allow deletion by comment owner or post owner
    const post = await Post.findById(comment.postId);
    if (String(comment.userId) !== String(req.user.id) && (!post || String(post.userId) !== String(req.user.id))) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    await comment.deleteOne();
    logger.logInfo('Comment deleted', { commentId: comment._id, userId: req.user.id });

    res.status(200).json({ success: true, message: 'Comment deleted' });
  })
);

// Get comments for a post (flat list)
router.get('/post/:postId',
  getCommentsByPostValidation,
  validate,
  asyncHandler(async (req, res) => {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 }).populate('userId', 'username profilePicture');
    res.status(200).json({ success: true, comments });
  })
);

// Get a single comment
router.get('/:id',
  commentIdValidation,
  validate,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    res.status(200).json({ success: true, comment });
  })
);

module.exports = router;
