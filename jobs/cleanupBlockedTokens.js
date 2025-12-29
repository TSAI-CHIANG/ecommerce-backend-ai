import { Op } from 'sequelize';
import { BlockedToken } from '../models/BlockedToken.js';

/**
 * Cleans up expired blocked tokens from the database.
 * Tokens are blocked on logout and can be removed once they've naturally expired.
 */
async function cleanupExpiredTokens() {
  try {
    const deleted = await BlockedToken.destroy({
      where: { expiresAt: { [Op.lt]: new Date() } }
    });
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired blocked token(s)`);
    }
  } catch (error) {
    console.error('Error cleaning up blocked tokens:', error);
  }
}

/**
 * Starts the cleanup job on an interval.
 * @param {number} intervalMs - How often to run cleanup (default: 1 hour)
 */
export function startCleanupJob(intervalMs = 60 * 60 * 1000) {
  // Run immediately on startup
  cleanupExpiredTokens();

  // Then run on interval
  setInterval(cleanupExpiredTokens, intervalMs);
}
