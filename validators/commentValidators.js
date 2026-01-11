const { body, param } = require('express-validator');

const createCommentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),
  body('post')
    .notEmpty()
    .withMessage('Post ID is required')
    .isMongoId()
    .withMessage('Invalid post ID'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
];

const updateCommentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

const commentIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID')
];

const postIdValidation = [
  param('postId')
    .isMongoId()
    .withMessage('Invalid post ID')
];

module.exports = {
  createCommentValidation,
  updateCommentValidation,
  commentIdValidation,
  postIdValidation
};
