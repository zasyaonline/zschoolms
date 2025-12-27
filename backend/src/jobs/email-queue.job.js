import cron from 'node-cron';
import { processEmailQueue } from '../services/distribution.service.js';
import logger from '../utils/logger.js';

/**
 * Email Queue Processor Job
 * 
 * UPDATED: 27 Dec 2025 - Changed from every minute to daily at 6:00 AM
 * Reason: Prevent excessive database queries and email sending
 * 
 * Schedule: Daily at 6:00 AM (configurable via EMAIL_QUEUE_CRON_SCHEDULE)
 * Limit: Processes up to DAILY_EMAIL_LIMIT emails per run
 */

let isProcessing = false;

/**
 * Process the email queue
 * Prevents concurrent processing runs
 * Respects daily email limit
 */
const runEmailQueueProcessor = async () => {
  if (isProcessing) {
    logger.debug('Email queue processor already running, skipping...');
    return;
  }

  isProcessing = true;
  
  try {
    // Process emails in batches, respecting daily limit
    const dailyLimit = parseInt(process.env.DAILY_EMAIL_LIMIT) || 50;
    const batchSize = Math.min(10, dailyLimit);
    
    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;
    
    // Process in batches until limit reached or no more emails
    while (totalProcessed < dailyLimit) {
      const result = await processEmailQueue(batchSize);
      
      if (result.processed === 0) {
        break; // No more emails to process
      }
      
      totalProcessed += result.processed;
      totalSent += result.sent;
      totalFailed += result.failed;
      
      // If we didn't get a full batch, there are no more emails
      if (result.processed < batchSize) {
        break;
      }
    }
    
    if (totalProcessed > 0) {
      logger.info(`Email queue processor completed: ${totalSent} sent, ${totalFailed} failed out of ${totalProcessed} processed (limit: ${dailyLimit})`);
    } else {
      logger.info('Email queue processor: No emails to process');
    }
    
  } catch (error) {
    logger.error('Email queue processor error:', error);
  } finally {
    isProcessing = false;
  }
};

/**
 * Start the email queue processor job
 * Runs DAILY at 6:00 AM (changed from every minute)
 */
export const startEmailQueueJob = () => {
  // Schedule: 6:00 AM daily (configurable via env var)
  const schedule = process.env.EMAIL_QUEUE_CRON_SCHEDULE || '0 6 * * *';
  
  const job = cron.schedule(schedule, runEmailQueueProcessor, {
    scheduled: true,
    timezone: process.env.TZ || 'Africa/Nairobi'
  });

  logger.info(`Email queue processor job scheduled: ${schedule} (daily at 6:00 AM)`);

  return job;
};

/**
 * Manually trigger email processing
 * @param {number} batchSize - Number of emails to process
 * @returns {Promise<Object>}
 */
export const triggerEmailProcessing = async (batchSize = 10) => {
  if (isProcessing) {
    return { success: false, message: 'Processor already running' };
  }
  
  isProcessing = true;
  try {
    const result = await processEmailQueue(batchSize);
    return { success: true, ...result };
  } finally {
    isProcessing = false;
  }
};

export default {
  startEmailQueueJob,
  triggerEmailProcessing,
  runEmailQueueProcessor
};
