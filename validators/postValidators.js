const { body, param } = require('express-validator');

/**
 * Validation rules for creating a post
 */
const createPostValidation = [
  body('desc')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Post description must be at most 500 characters'),
  
  body('img')
    .optional()
    .trim()
    .isString()
    .withMessage('Image must be a valid path or URL'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

/**
 * Validation rules for updating a post
 */
const updatePostValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID format'),
  
  body('desc')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Post description must be at most 500 characters'),
  
  body('img')
    .optional()
    .trim()
    .isString()
    .withMessage('Image must be a valid path or URL'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

/**
 * Validation rules for post ID parameter
 */
const postIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

/**
 * Validation rules for like/unlike post
 */
const likePostValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID format'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

module.exports = {
  createPostValidation,
  updatePostValidation,
  postIdValidation,
  likePostValidation
};
