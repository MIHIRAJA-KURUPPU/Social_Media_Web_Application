const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., 'like','comment','follow'
  originUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
