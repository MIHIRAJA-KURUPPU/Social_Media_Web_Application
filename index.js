const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const userRoute = require('./routes/users');
const authRoute = require('./routes/auth');

dotenv.config();
const app = express();

// Connect to MongoDB using async/await
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL); // Removed the deprecated options
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if the connection fails
  }
};

// Call the connectDB function
connectDB();

app.get('/', (req, res) => {
  res.send('Welcome to the backend!!');
}
);
app.get('/users', (req, res) => {
  res.send('Welcome user!');
}
);

// Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan('common'));

app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);

// Start the server
app.listen(8800, () => {
  console.log('Backend server is running!');
});
