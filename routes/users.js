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

// Get User
// Get User
router.get("/:id", async (req, res) => {
  try{
    const user = await User.findById(req.params.id);
    const {password, updatedAt, ...other} = user._doc;
    res.status(200).json(other);
  } catch (error) {
    res.status(500).json(error);
  }
});


// Follow User
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      // Find the user to be followed and the current user who is following
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);

      // Check if the user exists
      if (!user || !currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if the current user already follows the target user
      if (!user.followers.includes(req.body.userId)) {
        // Add current user to the target user's followers
        await user.updateOne({ $push: { followers: req.body.userId } });
        // Add target user to the current user's followings
        await currentUser.updateOne({ $push: { followings: req.params.id } });

        res.status(200).json({ message: "User has been followed" });
      } else {
        res.status(403).json({ message: "You already follow this user" });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  } else {
    res.status(403).json({ message: "You can't follow yourself" });
  }
});

//Unfollow User
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      // Find the user to be followed and the current user who is following
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);

      // Check if the user exists
      if (!user || !currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if the current user already follows the target user
      if (user.followers.includes(req.body.userId)) {
        // Add current user to the target user's followers
        await user.updateOne({ $pusll: { followers: req.body.userId } });
        // Add target user to the current user's followings
        await currentUser.updateOne({ $pull: { followings: req.params.id } });

        res.status(200).json({ message: "User has been unfollowed" });
      } else {
        res.status(403).json({ message: "You are not following this user" });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  } else {
    res.status(403).json({ message: "You can't unfollow yourself" });
  }
});



module.exports = router;
