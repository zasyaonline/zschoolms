import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Payment Routes
 * Base path: /api/payments
 * All routes require authentication
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Record a new sponsor payment
 *     description: Records a payment for a sponsorship, updates the sponsorship end date, and sends confirmation email
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sponsorshipId
 *               - amount
 *               - paymentDate
 *             properties:
 *               sponsorshipId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the sponsorship to renew
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 example: 500
 *               currency:
 *                 type: string
 *                 default: USD
 *                 example: USD
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Date payment was received
 *                 example: "2025-12-27"
 *               transactionReference:
 *                 type: string
 *                 description: Bank/transaction reference number
 *                 example: "TXN123456789"
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, cheque, cash, online, mobile_money, other]
 *                 example: bank_transfer
 *               notes:
 *                 type: string
 *               renewalMonths:
 *                 type: integer
 *                 default: 12
 *                 description: Number of months to extend the sponsorship
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payment:
 *                   type: object
 *                 emailSent:
 *                   type: boolean
 *                 renewalInfo:
 *                   type: object
 *                   properties:
 *                     previousEndDate:
 *                       type: string
 *                     newEndDate:
 *                       type: string
 *                     renewalMonths:
 *                       type: integer
 *       400:
 *         description: Validation error
 *       404:
 *         description: Sponsorship not found
 */
router.post('/', authenticate, authorize('admin', 'super_admin', 'accountant'), paymentController.recordPayment);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sponsorId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 */
router.get('/stats', authenticate, authorize('admin', 'super_admin', 'accountant'), paymentController.getPaymentStats);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get('/:id', authenticate, authorize('admin', 'super_admin', 'accountant'), paymentController.getPaymentById);

/**
 * @swagger
 * /api/payments/sponsorship/{sponsorshipId}:
 *   get:
 *     summary: Get payment history for a sponsorship
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sponsorshipId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 */
router.get('/sponsorship/:sponsorshipId', authenticate, authorize('admin', 'super_admin', 'accountant'), paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/payments/sponsor/{sponsorId}:
 *   get:
 *     summary: Get all payments for a sponsor
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sponsorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sponsor payments retrieved successfully
 */
router.get('/sponsor/:sponsorId', authenticate, authorize('admin', 'super_admin', 'accountant'), paymentController.getSponsorPayments);

export default router;
