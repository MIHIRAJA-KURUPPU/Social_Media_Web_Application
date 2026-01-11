const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'reply'],
      required: [true, 'Notification type is required']
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    message: {
      type: String,
      required: [true, 'Notification message is required']
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ sender: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
