const Notification = require('../models/Notification');
const { getUserSocket } = require('./userSocketManager');

// utility function to create notifications
const createNotification = async (userId, title, message, type = 'info', options = {}) => {
  try {
    // create and save the notification in the database
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      actionType: options.actionType || 'other',
      actionUserId: options.actionUserId || null,
      postId: options.postId || null,
      commentId: options.commentId || null
    });
    await notification.save();

    // get the user socket for the current user
    const userSocket = getUserSocket(userId.toString());

    if (userSocket) {
      userSocket.emit('newNotification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionType: notification.actionType,
        actionUserId: notification.actionUserId,
        postId: notification.postId,
        commentId: notification.commentId,
        createdAt: notification.createdAt
      });
    }

    console.log('Notification created and sent to frontend:', notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Notification creation failed');
  }
};

module.exports = { createNotification };
