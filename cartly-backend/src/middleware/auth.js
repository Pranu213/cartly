import { verifyToken, decodeToken } from '../utils/auth.js';
import { isBlacklisted } from '../utils/blacklist.js';
import { AppError } from '../utils/errors.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens from Authorization header
 */

/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractToken = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Authentication middleware
 * Verifies JWT and attaches user info to request
 * @middleware
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No token provided. Please login first.',
        code: 'NO_TOKEN'
      });
    }
    // Check if access token has been blacklisted (replay/compromise)
    const blacklisted = await isBlacklisted(token).catch(() => false);
    if (blacklisted) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    const decoded = verifyToken(token, 'access');
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    const statusCode = error.message.includes('expired') 
      ? HTTP_STATUS.UNAUTHORIZED 
      : HTTP_STATUS.UNAUTHORIZED;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if missing
 * @middleware
 */
export const optionalAuth = (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token, 'access');
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
    }
  } catch (error) {
    // Silent fail for optional auth
  }
  
  next();
};

/**
 * Authorization middleware
 * Checks if user has required role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 * @middleware
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 * Shorthand for authorize([ROLES.ADMIN])
 * @middleware
 */
export const requireAdmin = authorize([ROLES.ADMIN]);

/**
 * User-only middleware
 * Shorthand for authorize([ROLES.USER, ROLES.ADMIN])
 * @middleware
 */
export const requireUser = authorize([ROLES.USER, ROLES.ADMIN]);

/**
 * Verify token expiry and refresh if needed
 * Can be used to check token status without authentication
 * @middleware
 */
export const checkTokenStatus = (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      req.tokenStatus = null;
      return next();
    }

    const decoded = decodeToken(token);
    const expiresIn = decoded.exp * 1000 - Date.now();
    const expiresInSeconds = Math.floor(expiresIn / 1000);

    req.tokenStatus = {
      valid: expiresIn > 0,
      expiresInSeconds,
      expiresAt: new Date(decoded.exp * 1000)
    };

    next();
  } catch (error) {
    req.tokenStatus = null;
    next();
  }
};
