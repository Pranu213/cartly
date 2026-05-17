// Added dependency: express-rate-limit (applies rate limiting to auth endpoints)
import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { authenticate, requireUser } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Rate limiter for auth endpoints to mitigate brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

// Register validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match')
];

// Login validation rules
const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Profile update validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Invalid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage('Address must be at least 5 characters')
];

// Refresh token validation rules
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isJWT().withMessage('Invalid refresh token format')
];

// Change password validation rules
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('New password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('New password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('New password must contain number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('New passwords do not match')
];

// Public routes
router.post('/register', authLimiter, registerValidation, handleValidationErrors, authController.register);
router.post('/login', authLimiter, loginValidation, handleValidationErrors, authController.login);
router.post('/refresh', authLimiter, refreshTokenValidation, handleValidationErrors, authController.refreshAccessToken);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, updateProfileValidation, handleValidationErrors, authController.updateProfile);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, changePasswordValidation, handleValidationErrors, authController.changePassword);

export default router;

