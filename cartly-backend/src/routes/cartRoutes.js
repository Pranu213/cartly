import express from 'express';
import { body, param } from 'express-validator';
import * as cartController from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

/**
 * CART ROUTES
 * 
 * All cart operations require authentication
 * Comprehensive validation prevents data corruption
 * Atomic operations prevent race conditions
 */

// ========== VALIDATION SCHEMAS ==========

/**
 * Validation for adding item to cart
 * - Ensures valid MongoDB ObjectId
 * - Validates quantity is positive integer
 * - Prevents quantity from exceeding practical limits
 */
const addToCartValidation = [
  body('productId')
    .isMongoId().withMessage('Invalid product ID format'),
  body('quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000')
];

/**
 * Validation for updating cart item quantity
 * - Same as add validation
 * - Used when user changes quantity
 */
const updateCartValidation = [
  body('productId')
    .isMongoId().withMessage('Invalid product ID format'),
  body('quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000')
];

/**
 * Validation for removing item from cart
 * - Only needs product ID in URL parameter
 * - Validates MongoDB ObjectId format
 */
const removeFromCartValidation = [
  param('productId')
    .isMongoId().withMessage('Invalid product ID format')
];

/**
 * Validation for applying discount
 * - Discount code is required
 * - Discount amount must be positive
 */
const applyDiscountValidation = [
  body('discountCode')
    .trim()
    .notEmpty().withMessage('Discount code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Discount code must be between 2 and 50 characters'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number')
];

// ========== CART ROUTES ==========

/**
 * GET /cart
 * Retrieve user's shopping cart
 * Returns: Cart with items, totals, and summary
 * Auth: Required
 */
router.get('/', authenticate, cartController.getCart);

/**
 * POST /cart/add
 * Add item to cart (or increment if exists)
 * Body: { productId, quantity }
 * Returns: Updated cart with new item count and summary
 * Auth: Required
 * Race Condition Prevention: Atomic $push/$inc operations
 */
router.post(
  '/add',
  authenticate,
  addToCartValidation,
  handleValidationErrors,
  cartController.addToCart
);

/**
 * PUT /cart/update
 * Update item quantity in cart
 * Body: { productId, quantity }
 * Returns: Updated cart with modified item
 * Auth: Required
 * Race Condition Prevention: Atomic $set operation with index
 */
router.put(
  '/update',
  authenticate,
  updateCartValidation,
  handleValidationErrors,
  cartController.updateCartItem
);

/**
 * DELETE /cart/:productId
 * Remove item from cart
 * Params: productId
 * Returns: Updated cart
 * Auth: Required
 * Race Condition Prevention: Atomic $pull operation
 */
router.delete(
  '/:productId',
  authenticate,
  removeFromCartValidation,
  handleValidationErrors,
  cartController.removeFromCart
);

/**
 * DELETE /cart
 * Clear entire cart (soft delete)
 * Returns: Confirmation of clear operation
 * Auth: Required
 * Maintains: Audit trail by soft delete
 */
router.delete('/', authenticate, cartController.clearCart);

/**
 * GET /cart/summary
 * Get cart summary with pricing breakdown
 * Returns: Item count, subtotal, tax, shipping, discount, total
 * Auth: Required
 * Used by: Frontend to display cart totals
 */
router.get('/summary', authenticate, cartController.getCartSummary);

/**
 * POST /cart/apply-discount
 * Apply discount code to cart
 * Body: { discountCode, discountAmount? }
 * Returns: Updated cart with discount applied
 * Auth: Required
 */
router.post(
  '/apply-discount',
  authenticate,
  applyDiscountValidation,
  handleValidationErrors,
  cartController.applyDiscount
);

/**
 * POST /cart/remove-discount
 * Remove discount code from cart
 * Returns: Updated cart without discount
 * Auth: Required
 */
router.post('/remove-discount', authenticate, cartController.removeDiscount);

/**
 * POST /cart/validate
 * Validate all cart items
 * Checks: Stock availability, product activeness, price changes
 * Returns: Validation results with issues list
 * Auth: Required
 * Used by: Frontend before checkout to confirm cart state
 */
router.post('/validate', authenticate, cartController.validateCart);

export default router;

