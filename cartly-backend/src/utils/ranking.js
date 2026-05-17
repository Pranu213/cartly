import { Product } from '../models/Product.js';
import { Activity } from '../models/Activity.js';

// CARTLY-AGENT: Ranking utility to calculate and update product rank scores based on user activity

const RANK_WEIGHTS = {
  view: 0.3,
  search: 0.5,
  purchase: 2.0
};

/**
 * Calculate rank score for a product based on activity weights
 */
export const calculateRankScore = (views, searches, purchases) => {
  return (views * RANK_WEIGHTS.view) + (searches * RANK_WEIGHTS.search) + (purchases * RANK_WEIGHTS.purchase);
};

/**
 * Recalculate and update rankScore for all products
 * Called by cron job (every 6 hours) or triggered on purchase
 */
export const recalculateAllRankScores = async () => {
  try {
    const products = await Product.find({ isActive: true });
    
    for (const product of products) {
      const activities = await Activity.aggregate([
        { $match: { productId: product._id } },
        { $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      let views = 0, searches = 0, purchases = 0;
      activities.forEach(act => {
        if (act._id === 'view') views = act.count;
        if (act._id === 'search') searches = act.count;
        if (act._id === 'purchase') purchases = act.count;
      });

      const rankScore = calculateRankScore(views, searches, purchases);
      await Product.findByIdAndUpdate(product._id, {
        views,
        searches,
        purchases,
        rankScore
      });
    }
    console.log('✅ Rank scores recalculated');
  } catch (error) {
    console.error('❌ Error recalculating rank scores:', error.message);
  }
};

/**
 * Log a user activity (view, search, or purchase)
 */
export const logActivity = async (userId, productId, type) => {
  try {
    await Activity.create({ userId, productId, type });
  } catch (error) {
    console.error(`❌ Error logging ${type} activity:`, error.message);
  }
};
