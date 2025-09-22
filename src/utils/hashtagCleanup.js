const cron = require('node-cron');
const mongoose = require('mongoose');
const Hashtag = require('../models/Hashtag');
const { log, error } = console;

/**
 * Starts a cron job to clean up outdated hashtags
 * Runs every day at midnight
 * Removes hashtags that haven't been used in over a week and have count <= 2
 */
function startHashtagCleanupCronJob() {
  log('Scheduling hashtag cleanup job to run daily');
  
  // Schedule to run at midnight every day
  cron.schedule('0 0 * * *', async () => {
    try {
      log('Running scheduled job to clean up outdated hashtags...');
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Remove hashtags that:
      // 1. Were last used more than a week ago
      // 2. Have a count of 2 or less
      const result = await Hashtag.deleteMany({
        lastUsed: { $lt: oneWeekAgo },
        count: { $lte: 2 }
      });
      
      log(`Removed ${result.deletedCount} outdated hashtags`);
    } catch (err) {
      error('Error cleaning up hashtags:', err);
    }
  });
}

module.exports = { startHashtagCleanupCronJob };
