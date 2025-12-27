import { Notification, User } from '../models/index.js';

/**
 * Notification Service
 * Handles in-app notifications for users
 */

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{notifications: Array, total: number, unreadCount: number}>}
 */
export const getNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  
  const { rows: notifications, count: total } = await Notification.getForUser(userId, {
    page,
    limit,
    unreadOnly
  });
  
  const unreadCount = await Notification.getUnreadCount(userId);
  
  return {
    notifications,
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get unread notifications for a user
 * @param {string} userId - User ID
 * @param {number} limit - Max notifications to return
 * @returns {Promise<Array>}
 */
export const getUnreadNotifications = async (userId, limit = 20) => {
  return Notification.getUnread(userId, limit);
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  return Notification.getUnreadCount(userId);
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const markAsRead = async (notificationId, userId) => {
  return Notification.markAsRead(notificationId, userId);
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
export const markAllAsRead = async (userId) => {
  return Notification.markAllAsRead(userId);
};

/**
 * Create a notification
 * @param {Object} data - Notification data
 * @returns {Promise<Notification>}
 */
export const createNotification = async (data) => {
  return Notification.create(data);
};

/**
 * Notify principal about marks submission
 * @param {Object} params - Notification parameters
 * @returns {Promise<Notification|null>}
 */
export const notifyMarksSubmitted = async ({ schoolId, teacherName, className, subjectName, marksheetId }) => {
  // Find principal(s) for this school
  const principals = await User.findAll({
    where: {
      role: 'principal',
      is_active: true
    },
    attributes: ['id']
  });
  
  if (principals.length === 0) {
    console.warn('No active principal found for marks submission notification');
    return null;
  }
  
  // Create notification for each principal
  const notifications = await Promise.all(
    principals.map(principal => 
      Notification.notifyMarksSubmitted({
        principalUserId: principal.id,
        teacherName,
        className,
        subjectName,
        marksheetId
      })
    )
  );
  
  return notifications;
};

/**
 * Notify teacher about marks approval
 * @param {Object} params - Notification parameters
 * @returns {Promise<Notification>}
 */
export const notifyMarksApproved = async ({ teacherUserId, className, subjectName, marksheetId, approverName }) => {
  return Notification.notifyMarksApproved({
    teacherUserId,
    className,
    subjectName,
    marksheetId,
    approverName
  });
};

/**
 * Notify teacher about marks rejection
 * @param {Object} params - Notification parameters
 * @returns {Promise<Notification>}
 */
export const notifyMarksRejected = async ({ teacherUserId, className, subjectName, marksheetId, rejectionComments, rejectorName }) => {
  return Notification.notifyMarksRejected({
    teacherUserId,
    className,
    subjectName,
    marksheetId,
    rejectionComments,
    rejectorName
  });
};

/**
 * Send a general notification to a user
 * @param {string} userId - Target user ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Notification>}
 */
export const sendGeneralNotification = async (userId, title, message, data = {}) => {
  return Notification.create({
    user_id: userId,
    type: Notification.TYPES.GENERAL,
    title,
    message,
    data
  });
};

/**
 * Send system alert to a user
 * @param {string} userId - Target user ID
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Object} data - Additional data
 * @returns {Promise<Notification>}
 */
export const sendSystemAlert = async (userId, title, message, data = {}) => {
  return Notification.create({
    user_id: userId,
    type: Notification.TYPES.SYSTEM_ALERT,
    title,
    message,
    data
  });
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<boolean>}
 */
export const deleteNotification = async (notificationId, userId) => {
  const deleted = await Notification.destroy({
    where: { id: notificationId, user_id: userId }
  });
  return deleted > 0;
};

/**
 * Cleanup old notifications (for scheduled job)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<number>}
 */
export const cleanupOldNotifications = async (daysOld = 90) => {
  return Notification.cleanupOld(daysOld);
};

export default {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  notifyMarksSubmitted,
  notifyMarksApproved,
  notifyMarksRejected,
  sendGeneralNotification,
  sendSystemAlert,
  deleteNotification,
  cleanupOldNotifications
};
