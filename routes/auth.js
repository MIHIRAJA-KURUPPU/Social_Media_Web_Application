const router = require('express').Router();
const User = require('../Models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const { 
  registerValidation, 
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../validators/authValidators');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

// Register User
router.post('/register', 
  authLimiter,
  registerValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { username, email, password, desc, city, from, relationship } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      logger.logWarning('Registration attempt with existing credentials', { email, username });
      return res.status(400).json({ 
        success: false,
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Generate a salt and hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the hashed password and additional fields
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      desc: desc || '',
      city: city || '',
      from: from || '',
      relationship
    });

    // Save the new user to the database
    const user = await newUser.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    logger.logInfo('New user registered', { userId: user._id, username: user.username });
    
    // Send a success response with token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        desc: user.desc,
        city: user.city,
        from: user.from,
        relationship: user.relationship,
        profilePicture: user.profilePicture,
        coverPicture: user.coverPicture
      }
    });
  })
);

// Login User
router.post('/login',
  authLimiter,
  loginValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.logWarning('Login attempt with non-existent email', { email });
      return res.status(404).json({ 
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare the provided password with the stored hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.logWarning('Failed login attempt', { userId: user._id, email });
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);
    
    logger.logInfo('User logged in', { userId: user._id, username: user.username });

    // Send a success response with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        desc: user.desc,
        city: user.city,
        from: user.from,
        relationship: user.relationship,
        profilePicture: user.profilePicture,
        coverPicture: user.coverPicture,
        followers: user.followers,
        followings: user.followings
      }
    });
  })
);

// Forgot Password - Request reset token
router.post('/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiration to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // In production, send email with reset token
    // For now, we'll return it in the response (REMOVE IN PRODUCTION)
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    logger.logInfo('Password reset requested', { userId: user._id, email });

    // TODO: Send email with nodemailer
    // await sendResetEmail(user.email, resetUrl);

    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      // Remove these in production - only for development
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken,
        resetUrl 
      })
    });
  })
);

// Reset Password - Verify token and set new password
router.post('/reset-password',
  passwordResetLimiter,
  resetPasswordValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    // Hash the provided token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      logger.logWarning('Invalid or expired reset token used');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.logInfo('Password reset successful', { userId: user._id });

    // Generate new JWT token
    const authToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: authToken
    });
  })
);

module.exports = router;
