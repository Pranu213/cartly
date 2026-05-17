import { User } from '../models/User.js';
import { hashPassword, comparePassword, generateTokens, verifyToken, hashToken } from '../utils/auth.js';
import { addToBlacklist } from '../utils/blacklist.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';

/**
 * User Registration Controller
 * Creates new user account with hashed password
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw new AppError('All fields are required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!validateEmail(email)) {
    throw new AppError('Invalid email format', HTTP_STATUS.BAD_REQUEST);
  }

  if (!validatePassword(password)) {
    throw new AppError(
      'Password must be at least 6 characters with uppercase, lowercase, and numbers',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', HTTP_STATUS.BAD_REQUEST);
  }

  // Check if user exists (case-insensitive)
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: ROLES.USER,
    isActive: true
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'User registered successfully',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

/**
 * User Login Controller
 * Authenticates user and returns JWT tokens
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', HTTP_STATUS.BAD_REQUEST);
  }

  // Find user with password field (select: false by default)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('User account is inactive. Please contact support.', HTTP_STATUS.FORBIDDEN);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);
  // Persist hashed refresh token on user and set httpOnly cookie
  try {
    user.refreshToken = await hashToken(refreshToken);
    await user.save();
  } catch (err) {
    // Non-fatal: log and continue
    console.error('Failed to save refresh token for user:', user._id, err);
  }

  // Set httpOnly cookie for refresh token
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  if (process.env.COOKIE_DOMAIN) cookieOptions.domain = process.env.COOKIE_DOMAIN;

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address
    }
  });
});

/**
 * Refresh Access Token Controller
 * Generates new access token using valid refresh token
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  // Try to get refresh token from httpOnly cookie first, then body
  const incomingRefresh = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefresh) {
    throw new AppError('Refresh token is required', HTTP_STATUS.BAD_REQUEST);
  }

  // Verify refresh token signature and expiry
  const decoded = verifyToken(incomingRefresh, 'refresh');

  // Find user and check stored hashed refresh token
  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  if (!user.refreshToken) {
    throw new AppError('No refresh token stored for user', HTTP_STATUS.UNAUTHORIZED);
  }

  // Compare hashed stored token with incoming token
  const incomingHash = await hashToken(incomingRefresh);
  if (incomingHash !== user.refreshToken) {
    // Possible token reuse or theft
    // Blacklist incoming token and any stored token, then clear stored token
    try {
      await addToBlacklist(incomingRefresh, 'refresh', user._id);
      if (user.refreshToken) {
        // If we can reconstruct stored raw token not possible; still clear stored hash
        // We cannot add the original raw token to blacklist without it, but storing incoming helps.
      }
    } catch (err) {
      console.error('Error blacklisting tokens on reuse detection', err);
    }

    user.refreshToken = null;
    await user.save().catch(() => {});
    throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
  }

  // Generate new tokens (rotate refresh token)
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);

  // Persist rotated refresh token hash and set cookie
  try {
    user.refreshToken = await hashToken(newRefreshToken);
    await user.save();
  } catch (err) {
    console.error('Failed to persist rotated refresh token for user:', user._id, err);
  }

  // As part of rotation, blacklist the previous (incoming) refresh token
  try {
    await addToBlacklist(incomingRefresh, 'refresh', user._id);
  } catch (err) {
    console.error('Failed to blacklist previous refresh token during rotation', err);
  }

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Access token refreshed successfully',
    data: {
      accessToken: newAccessToken
    }
  });
});

/**
 * Logout Controller
 * Logs out user (client-side token cleanup recommended)
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token cookie and remove stored token from user
  const userId = req.user?.userId;
  if (userId) {
    try {
      // Blacklist any existing refresh token stored (we only have the hashed value)
      const user = await User.findById(userId).select('+refreshToken');
      if (user && req.cookies?.refreshToken) {
        // blacklist the raw cookie value
        try {
          await addToBlacklist(req.cookies.refreshToken, 'refresh', userId);
        } catch (err) {
          /* ignore */
        }
      }
      await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    } catch (err) {
      console.error('Failed to clear refresh token for user during logout', userId, err);
    }
  }

  res.clearCookie('refreshToken');
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Change Password Controller
 * Allows authenticated user to change password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.userId;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('All password fields are required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!validatePassword(newPassword)) {
    throw new AppError(
      'New password must be at least 6 characters with uppercase, lowercase, and numbers',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('New passwords do not match', HTTP_STATUS.BAD_REQUEST);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password', HTTP_STATUS.BAD_REQUEST);
  }

  // Find user with password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
  }

  // Hash and update new password
  user.password = await hashPassword(newPassword);
  await user.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password changed successfully'
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const userId = req.user.userId;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;

  const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address
    }
  });
});
