const router = require('express').Router();
const User = require('../Models/User');
const bcrypt = require('bcrypt');

// Register User
router.post('/register', async (req, res) => {
  try {
    // Check if required fields are provided
    const { username, email, password, desc, city, from, relationship } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate a salt and hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the hashed password and additional fields
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      desc: desc || '', // Optional fields
      city: city || '',
      from: from || '',
      relationship // Optional field; will be undefined if not provided
    });

    // Save the new user to the database
    const user = await newUser.save();
    // Send a success response with the newly created user
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        desc: user.desc,
        city: user.city,
        from: user.from,
        relationship: user.relationship
      }
    });
  } catch (error) {
    // Log the error and send an error response
    console.error(error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    // Check if email and password are provided
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the provided password with the stored hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Send a success response if login is valid
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        desc: user.desc,
        city: user.city,
        from: user.from,
        relationship: user.relationship
      }
    });
  } catch (error) {
    // Log the error and send an error response
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
