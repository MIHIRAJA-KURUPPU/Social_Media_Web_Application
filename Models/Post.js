const mongoose = require('mongoose');

// Define the Post schema
const PostSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    max: 500,
  },
  img: {
    type: String,
  },
  likes: {
    type: Array,
    default: [],
  },
}, { timestamps: true });

// Create and export the Post model
module.exports = mongoose.model('Post', PostSchema);
