const jwt = require('jsonwebtoken');

// JWT Secret - Should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generate JWT token for user
 * @param {Object} user - User object with _id
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      username: user.username,
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

/**
 * Middleware to verify JWT token
 * Adds user object to req.user if token is valid
 */
const verifyToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied. No token provided.' 
    });
  }

  // Extract token
  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired. Please login again.' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token.' 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: 'Token verification failed.' 
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user to req if token exists, but doesn't block if token is missing
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Silently continue without user
  }
  
  next();
};

/**
 * Middleware to check if user is admin
 * Must be used after verifyToken
 */
const isAdmin = async (req, res, next) => {
  try {
    const User = require('../Models/User');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: 'Authorization check failed.' 
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  optionalAuth,
  isAdmin
};
