const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 20,
    unique: true
  },
  email: {
    type: String,
    required: true,
    maxlength: 50,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: ""
  },
  coverPicture: {
    type: String,
    default: ""
  },
  followers: {
    type: Array,
    default: []
  },
  followings: {
    type: Array,
    default: []
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  desc: {
    type: String,
    maxlength: 50
  },
  city: {
    type: String,
    maxlength: 50
  },
  from: {
    type: String,
    maxlength: 50
  },
  relationship: {
    type: Number,
    enum: [1, 2, 3] // 1 for single, 2 for married, 3 for others
  },
}, { timestamps: true });

// Create and export the User model
module.exports = mongoose.model('User', UserSchema);
