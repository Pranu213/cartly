import cron from 'node-cron';
import { recalculateAllRankScores } from './ranking.js';

// CARTLY-AGENT: Cron job scheduler for periodic ranking recalculation

export const initializeScheduledJobs = () => {
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Running scheduled rank recalculation...');
    await recalculateAllRankScores();
  });
  console.log('✅ Scheduled jobs initialized');
};
