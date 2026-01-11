const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const userRoute = require('./routes/users');
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const commentRoute = require('./routes/comments');
const uploadRoute = require('./routes/uploads');
const notificationRoute = require('./routes/notifications');
const searchRoute = require('./routes/search');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { logger, requestLogger } = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();
const app = express();

// Middleware - MUST be before routes
app.use(express.json());
app.use(helmet());
app.use(cors());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(requestLogger);
} else {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// Connect to MongoDB using async/await
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    logger.logInfo('Connected to MongoDB', { 
      database: mongoose.connection.name 
    });
  } catch (error) {
    logger.logError('Error connecting to MongoDB', error);
    process.exit(1);
  }
};

// Call the connectDB function
connectDB();

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Echo-Me API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      health: '/api/health'
    }
  });
});

// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  const healthcheck = {
    success: true,
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  };
  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    healthcheck.success = false;
    res.status(503).json(healthcheck);
  }
});

// API Routes
app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/comments', commentRoute);
app.use('/api/uploads', uploadRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/search', searchRoute);

// Serve uploaded static files
app.use('/public', express.static('public'));

// 404 handler - must be after all routes
app.use(notFound);

// Error handling middleware - must be last
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  logger.logInfo(`Backend server is running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});
