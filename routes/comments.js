const router = require('express').Router();
const Comment = require('../Models/Comment');
const Post = require('../Models/Post');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createCommentValidation,
  updateCommentValidation,
  commentIdValidation,
  postIdValidation
} = require('../validators/commentValidators');

// Create a comment
router.post('/', verifyToken, createCommentValidation, validate, async (req, res) => {
  try {
    const { content, post, parentComment } = req.body;

    // Verify post exists
    const postExists = await Post.findById(post);
    if (!postExists) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // If replying to a comment, verify it exists
    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
    }

    const newComment = new Comment({
      content,
      author: req.user.id,
      post,
      parentComment: parentComment || null
    });

    const savedComment = await newComment.save();
    
    // Populate author details
    await savedComment.populate('author', 'username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: savedComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
});

// Get comments for a post
router.get('/post/:postId', postIdValidation, validate, async (req, res) => {
  try {
    const comments = await Comment.find({ 
      post: req.params.postId,
      parentComment: null // Only get top-level comments
    })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate('author', 'username profilePicture')
          .sort({ createdAt: 1 });
        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    res.status(200).json({
      success: true,
      count: commentsWithReplies.length,
      data: commentsWithReplies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
});

// Update a comment
router.put('/:id', verifyToken, updateCommentValidation, validate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this comment' });
    }

    comment.content = req.body.content;
    const updatedComment = await comment.save();
    await updatedComment.populate('author', 'username profilePicture');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: error.message
    });
  }
});

// Delete a comment
router.delete('/:id', verifyToken, commentIdValidation, validate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: req.params.id });

    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
});

// Like/Unlike a comment
router.put('/:id/like', verifyToken, commentIdValidation, validate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.likes.includes(req.user.id)) {
      // Unlike
      await comment.updateOne({ $pull: { likes: req.user.id } });
      res.status(200).json({
        success: true,
        message: 'Comment unliked'
      });
    } else {
      // Like
      await comment.updateOne({ $push: { likes: req.user.id } });
      res.status(200).json({
        success: true,
        message: 'Comment liked'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error liking comment',
      error: error.message
    });
  }
});

module.exports = router;
