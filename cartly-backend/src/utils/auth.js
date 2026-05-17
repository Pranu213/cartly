import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * JWT Authentication Utilities
 * Handles password hashing, token generation, and verification
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_here';
// Access tokens short-lived (15 minutes), refresh tokens 7 days
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

/**
 * Hash password using bcryptjs with salt rounds
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword - Password entered by user
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePassword = async (enteredPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Generate JWT access token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} Signed JWT token
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} Signed JWT refresh token
 */
export const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { userId, role, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRE }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {Object} Object with accessToken and refreshToken
 */
export const generateTokens = (userId, role) => {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(userId, role)
  };
};

/**
 * Backward compatible function for existing code
 * @deprecated Use generateAccessToken instead
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
export const generateToken = (userId, role) => {
  return generateAccessToken(userId, role);
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {Object} Decoded token
 * @throws {Error} If token is invalid
 */
export const verifyToken = (token, type = 'access') => {
  try {
    const secret = type === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    
    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}`);
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for reading)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {number} Unix timestamp of expiration
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  return decoded?.exp ? decoded.exp * 1000 : null;
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? Date.now() > expiration : true;
};

/**
 * Hash arbitrary token (e.g., refresh token) for safe storage
 * @param {string} token - Token to hash
 * @returns {string} Hex-encoded SHA256 hash
 */
export const hashToken = (token) => {
  try {
    return crypto.createHash('sha256').update(token).digest('hex');
  } catch (err) {
    throw new Error('Token hashing failed');
  }
};
