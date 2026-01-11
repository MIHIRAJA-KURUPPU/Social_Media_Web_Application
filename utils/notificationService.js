const Notification = require('../Models/Notification');

/**
 * Create a notification for a user action
 * @param {Object} options - Notification options
 * @param {String} options.recipient - User ID receiving the notification
 * @param {String} options.sender - User ID who triggered the notification
 * @param {String} options.type - Type: 'follow', 'like', 'comment', 'reply'
 * @param {String} options.message - Notification message
 * @param {String} options.post - Post ID (optional)
 * @param {String} options.comment - Comment ID (optional)
 */
const createNotification = async (options) => {
  try {
    const { recipient, sender, type, message, post, comment } = options;

    // Don't create notification if user is notifying themselves
    if (recipient === sender) {
      return null;
    }

    // Check for duplicate recent notifications (within last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const existingNotification = await Notification.findOne({
      recipient,
      sender,
      type,
      post,
      createdAt: { $gte: oneMinuteAgo }
    });

    if (existingNotification) {
      return existingNotification;
    }

    const notification = new Notification({
      recipient,
      sender,
      type,
      message,
      post: post || null,
      comment: comment || null
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create notification for post like
 */
const notifyPostLike = async (postOwnerId, likerId, postId) => {
  return createNotification({
    recipient: postOwnerId,
    sender: likerId,
    type: 'like',
    message: 'liked your post',
    post: postId
  });
};

/**
 * Create notification for comment
 */
const notifyComment = async (postOwnerId, commenterId, postId, commentId) => {
  return createNotification({
    recipient: postOwnerId,
    sender: commenterId,
    type: 'comment',
    message: 'commented on your post',
    post: postId,
    comment: commentId
  });
};

/**
 * Create notification for comment reply
 */
const notifyReply = async (commentOwnerId, replierId, postId, commentId) => {
  return createNotification({
    recipient: commentOwnerId,
    sender: replierId,
    type: 'reply',
    message: 'replied to your comment',
    post: postId,
    comment: commentId
  });
};

/**
 * Create notification for follow
 */
const notifyFollow = async (followedUserId, followerId) => {
  return createNotification({
    recipient: followedUserId,
    sender: followerId,
    type: 'follow',
    message: 'started following you'
  });
};

module.exports = {
  createNotification,
  notifyPostLike,
  notifyComment,
  notifyReply,
  notifyFollow
};
