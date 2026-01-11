const { body, param } = require('express-validator');

const createCommentValidation = [
  body('postId')
    .notEmpty()
    .withMessage('Post ID is required')
    .isMongoId()
    .withMessage('Invalid post ID format'),

  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('text')
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 1000 })
    .withMessage('Comment must be at most 1000 characters'),

  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
];

const updateCommentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID format'),

  body('text')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must be at most 1000 characters')
];

const commentIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID format')
];

const getCommentsByPostValidation = [
  param('postId')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

module.exports = {
  createCommentValidation,
  updateCommentValidation,
  commentIdValidation,
  getCommentsByPostValidation
};
