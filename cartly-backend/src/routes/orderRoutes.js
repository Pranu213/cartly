import express from 'express';
import { body, param, query } from 'express-validator';
import * as orderController from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { ORDER_STATUS, ROLES } from '../config/constants.js';

const router = express.Router();

/**
 * ORDER ROUTES
 * 
 * Features:
 * - Comprehensive validation on all inputs
 * - Role-based access control (admin vs user)
 * - Prevents data corruption through validation
 * - Transaction support for order creation
 * 
 * All endpoints require authentication
 * Admin endpoints require both authentication and admin role
 */

// ========== VALIDATION SCHEMAS ==========

/**
 * Shipping address validation
 * Ensures all required fields for delivery
 */
const shippingAddressValidation = {
  fullName: body('shippingAddress.fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  phone: body('shippingAddress.phone')
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Valid phone number is required'),

  street: body('shippingAddress.street')
    .trim()
    .notEmpty().withMessage('Street address is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),

  city: body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),

  zipCode: body('shippingAddress.zipCode')
    .trim()
    .notEmpty().withMessage('ZIP code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('ZIP code must be between 3 and 20 characters'),

  country: body('shippingAddress.country')
    .trim()
    .notEmpty().withMessage('Country is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
};

/**
 * Create order validation
 * Ensures cart is available and payment method is valid
 */
const createOrderValidation = [
  ...Object.values(shippingAddressValidation),

  body('billingAddress')
    .optional()
    .isObject().withMessage('Billing address must be an object'),

  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer'])
    .withMessage('Payment method must be one of: credit_card, debit_card, paypal, bank_transfer'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

/**
 * ID validation for order operations
 */
const orderIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid order ID format')
];

/**
 * Update order status validation (admin)
 */
const updateStatusValidation = [
  ...orderIdValidation,

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(Object.values(ORDER_STATUS))
    .withMessage(`Status must be one of: ${Object.values(ORDER_STATUS).join(', ')}`),

  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Tracking number must be between 5 and 100 characters'),

  body('paymentStatus')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Payment status must be one of: pending, completed, failed, refunded')
];

/**
 * Cancel order validation
 */
const cancelOrderValidation = [
  param('id')
    .isMongoId().withMessage('Invalid order ID format')
];

/**
 * List orders query validation
 */
const listOrdersValidation = [
  query('status')
    .optional()
    .isIn(Object.values(ORDER_STATUS))
    .withMessage(`Status must be one of: ${Object.values(ORDER_STATUS).join(', ')}`),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['-createdAt', 'createdAt', '-totalAmount', 'totalAmount', '-status', 'status'])
    .withMessage('Invalid sort option')
];

// ========== USER ROUTES ==========

/**
 * GET /orders
 * Get all orders for current user with pagination
 * 
 * Query Parameters:
 * - status: Filter by order status (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - sortBy: Sort field (default: -createdAt)
 * 
 * Returns: Paginated list of user's orders
 * Auth: Required (user)
 */
router.get(
  '/',
  authenticate,
  listOrdersValidation,
  handleValidationErrors,
  orderController.getOrders
);

/**
 * GET /orders/:id
 * Get specific order details
 * 
 * Returns: Order with all details including populated product info
 * Auth: Required (user can only view own orders)
 * Authorization: User can only view their own orders
 */
router.get(
  '/:id',
  authenticate,
  orderIdValidation,
  handleValidationErrors,
  orderController.getOrderById
);

/**
 * POST /orders
 * Create new order from cart
 * 
 * This endpoint handles the critical checkout process:
 * 1. Validates cart contents
 * 2. Checks product availability and stock
 * 3. Starts MongoDB transaction
 * 4. Atomically reduces inventory
 * 5. Creates order
 * 6. Clears cart
 * 7. Commits transaction or rolls back on error
 * 
 * Request Body:
 * {
 *   shippingAddress: {
 *     fullName: string,
 *     phone: string,
 *     street: string,
 *     city: string,
 *     state?: string,
 *     zipCode: string,
 *     country: string
 *   },
 *   billingAddress?: {...},
 *   paymentMethod: string,
 *   notes?: string
 * }
 * 
 * Returns: Order confirmation with order number
 * Auth: Required (user)
 * 
 * Error Cases Handled:
 * - Empty cart
 * - Out of stock items
 * - Discontinued products
 * - Invalid shipping address
 * - Race conditions (concurrent purchases)
 * 
 * Transaction Guarantees:
 * - ATOMICITY: All-or-nothing (no partial orders)
 * - CONSISTENCY: Stock never negative, cart cleared iff order created
 * - ISOLATION: Concurrent requests don't interfere
 * - DURABILITY: Order persists through system failures
 */
router.post(
  '/',
  authenticate,
  createOrderValidation,
  handleValidationErrors,
  orderController.createOrder
);

/**
 * PATCH /orders/:id/cancel
 * Cancel order and restore inventory
 * 
 * Only cancellable statuses:
 * - PENDING
 * - PROCESSING
 * 
 * Non-cancellable statuses:
 * - SHIPPED
 * - DELIVERED
 * - CANCELLED
 * 
 * Atomically:
 * - Updates order status to CANCELLED
 * - Restores product inventory
 * - Marks payment as refunded
 * 
 * Returns: Cancellation confirmation
 * Auth: Required (user can only cancel own orders)
 * 
 * Transaction Support:
 * - Inventory is atomically restored
 * - Order status atomically updated
 * - Both operations succeed or both fail
 */
router.patch(
  '/:id/cancel',
  authenticate,
  cancelOrderValidation,
  handleValidationErrors,
  orderController.cancelOrder
);

// ========== ADMIN ROUTES ==========

/**
 * PATCH /orders/:id/status
 * Update order status (admin only)
 * 
 * Allowed status transitions:
 * PENDING -> PROCESSING/CANCELLED
 * PROCESSING -> SHIPPED/CANCELLED
 * SHIPPED -> DELIVERED
 * DELIVERED -> (no transitions)
 * CANCELLED -> (no transitions)
 * 
 * Request Body:
 * {
 *   status: string (required),
 *   trackingNumber?: string,
 *   paymentStatus?: string
 * }
 * 
 * Returns: Updated order
 * Auth: Required (admin only)
 * Authorization: Admin-only operation
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize([ROLES.ADMIN]),
  updateStatusValidation,
  handleValidationErrors,
  orderController.updateOrderStatus
);

export default router;

