const cron = require('node-cron');
const mongoose = require('mongoose');
const { log, error } = console;

// Runs every 6 hours (adjust if needed: '0 * * * *' = hourly, '0 0 * * *' = daily)
function startMongoKeepAlive() {
  cron.schedule(
    '0 */6 * * *',
    async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.db.command({ ping: 1 });
          log('[MongoKeepAlive] Ping OK');
        } else {
          log('[MongoKeepAlive] Not connected, skipping');
        }
      } catch (err) {
        error('[MongoKeepAlive] Ping failed:', err.message);
      }
    },
    { timezone: 'Asia/Manila' }
  );
  log('[MongoKeepAlive] Scheduled (every 6 hours)');
}

module.exports = { startMongoKeepAlive };