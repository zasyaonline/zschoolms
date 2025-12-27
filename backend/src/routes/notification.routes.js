import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as notificationService from '../services/notification.service.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only return unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await notificationService.getNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Get unread notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Max notifications to return
 *     responses:
 *       200:
 *         description: Unread notifications retrieved successfully
 */
router.get('/unread', authenticate, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const notifications = await notificationService.getUnreadNotifications(
      req.user.id,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length
      }
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notifications',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/count:
 *   get:
 *     summary: Get unread notification count for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/count', authenticate, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification count',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const success = await notificationService.markAsRead(req.params.id, req.user.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: `${count} notification(s) marked as read`,
      data: { updatedCount: count }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const success = await notificationService.deleteNotification(req.params.id, req.user.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send a notification to a user (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notification sent
 *       403:
 *         description: Not authorized
 */
router.post('/send', authenticate, authorize('super_admin', 'principal', 'admin'), async (req, res) => {
  try {
    const { userId, title, message, data } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({
        success: false,
        message: 'userId and title are required'
      });
    }
    
    const notification = await notificationService.sendGeneralNotification(
      userId,
      title,
      message || '',
      data || {}
    );
    
    res.status(201).json({
      success: true,
      message: 'Notification sent',
      data: { notification }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

export default router;
