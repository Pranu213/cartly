import { BlacklistedToken } from '../models/BlacklistedToken.js';
import { hashToken } from './auth.js';

/**
 * Add a token to the blacklist (stores hashed token)
 * @param {string} token - Raw token string
 * @param {'access'|'refresh'} type - Token type
 * @param {string} [userId] - Optional user id
 */
export const addToBlacklist = async (token, type = 'refresh', userId = null) => {
  try {
    const tokenHash = hashToken(token);
    // Attempt to get expiry from JWT if present (best-effort)
    let expiresAt = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.exp) {
          expiresAt = new Date(payload.exp * 1000);
        }
      }
    } catch (err) {
      // ignore
    }

    await BlacklistedToken.create({ tokenHash, type, userId, expiresAt });
  } catch (err) {
    console.error('Failed to add token to blacklist', err);
  }
};

/**
 * Check if a raw token is blacklisted
 * @param {string} token - Raw token string
 * @returns {Promise<boolean>} True if blacklisted
 */
export const isBlacklisted = async (token) => {
  try {
    const tokenHash = hashToken(token);
    const found = await BlacklistedToken.findOne({ tokenHash }).lean();
    return !!found;
  } catch (err) {
    console.error('Blacklist check failed', err);
    return false;
  }
};
