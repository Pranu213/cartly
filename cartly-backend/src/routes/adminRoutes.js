import express from 'express';
import { body, param, query } from 'express-validator';
import * as adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { ROLES, ORDER_STATUS } from '../config/constants.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize([ROLES.ADMIN]));

/**
 * User Management Routes
 */

// Create user validation rules
const createUserValidation = [
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
    .withMessage('Passwords do not match'),
  body('role')
    .isIn(Object.values(ROLES)).withMessage('Invalid role'),
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

router.post(
  '/users',
  createUserValidation,
  handleValidationErrors,
  adminController.createUser
);

// Get all users with filtering and pagination
const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(Object.values(ROLES)).withMessage('Invalid role'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('Search must have at least 1 character')
];

router.get('/users', getUsersValidation, handleValidationErrors, adminController.getAllUsers);

// Get user by ID
const userIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID')
];

router.get('/users/:id', userIdValidation, handleValidationErrors, adminController.getUserById);

// Update user route
const updateUserValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES)).withMessage('Invalid role'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Invalid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
];

router.put(
  '/users/:id',
  updateUserValidation,
  handleValidationErrors,
  adminController.updateUser
);

// Update user role (legacy endpoint)
const updateUserRoleValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID'),
  body('role')
    .isIn(Object.values(ROLES)).withMessage('Invalid role')
];

router.patch(
  '/users/:id/role',
  updateUserRoleValidation,
  handleValidationErrors,
  adminController.updateUserRole
);

// Toggle user status (active/inactive)
router.patch(
  '/users/:id/toggle-status',
  userIdValidation,
  handleValidationErrors,
  adminController.toggleUserStatus
);

// Delete user
router.delete(
  '/users/:id',
  userIdValidation,
  handleValidationErrors,
  adminController.deleteUser
);

/**
 * Order Management Routes
 */

// Get all orders with filtering
const getOrdersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(Object.values(ORDER_STATUS)).withMessage('Invalid order status'),
  query('userId')
    .optional()
    .isMongoId().withMessage('Invalid user ID')
];

router.get('/orders', getOrdersValidation, handleValidationErrors, adminController.getAllOrders);

// Get order statistics
router.get('/orders/stats', adminController.getOrderStats);

/**
 * Dashboard Routes
 */

// Get dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * System Monitoring Routes
 */

// Get system health
router.get('/system/health', adminController.getSystemHealth);

export default router;
