const { body, param } = require('express-validator');

/**
 * Validation rules for updating user profile
 */
const updateUserValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Username must be between 4 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('profilePicture')
    .optional()
    .trim()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
  
  body('coverPicture')
    .optional()
    .trim()
    .isURL()
    .withMessage('Cover picture must be a valid URL'),
  
  body('desc')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Description must be at most 50 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be at most 50 characters'),
  
  body('from')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('From must be at most 50 characters'),
  
  body('relationship')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Relationship must be 1, 2, or 3'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required for authorization')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

/**
 * Validation rules for user ID parameter
 */
const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

/**
 * Validation rules for follow/unfollow
 */
const followValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('userId')
    .notEmpty()
    .withMessage('Current user ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

module.exports = {
  updateUserValidation,
  userIdValidation,
  followValidation
};
