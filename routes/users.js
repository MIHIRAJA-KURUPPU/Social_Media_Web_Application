const User = require('../Models/User');
const router = require('express').Router();
const bcrypt = require('bcrypt');

// Test route for users
router.get('/', (req, res) => {
  res.send('This is user route');
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    // Check if the user is authorized to update their account
    if (req.body.userId === req.params.id || req.body.isAdmin) {
      // If the password is being updated, hash it
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      }

      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true } // Return the updated user
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Respond with a success message and the updated user data
      res.status(200).json({ message: 'Account has been updated', user: updatedUser });
    } else {
      return res.status(403).json({ message: 'You can only update your account' });
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    // Check if the user is authorized to delete their account
    if (req.body.userId === req.params.id || req.body.isAdmin) {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ message: 'Account has been deleted' });
    } else {
      return res.status(403).json({ message: 'You can only delete your account' });
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Placeholder for other routes like Get User, Follow User, Unfollow User

module.exports = router;
