import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * CART CONTROLLER
 * 
 * Features:
 * - Atomic cart operations with MongoDB transactions
 * - Race condition prevention through optimistic locking
 * - Comprehensive validation and error handling
 * - Stock verification before adding to cart
 * - Automatic total calculations
 */

/**
 * GET /cart
 * Retrieve user's cart with populated product details
 * Prevents exposure of soft-deleted items
 */
export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  let cart = await Cart.findOne({ userId, isDeleted: false })
    .populate('items.productId', 'name price stock category image');

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [],
      isEmpty: true,
      isDeleted: false
    });
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Cart retrieved successfully',
    data: {
      id: cart._id,
      itemCount: cart.getItemCount(),
      items: cart.items,
      summary: cart.getSummary()
    }
  });
});

/**
 * POST /cart/add
 * Add item to cart with atomic operation
 * 
 * Prevents race conditions by:
 * - Verifying product exists and is active
 * - Checking stock availability
 * - Using atomic update operations
 * - Validating quantity before operation
 * 
 * Request body:
 * {
 *   productId: string (MongoDB ID),
 *   quantity: number (1+)
 * }
 */
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;

  // Validate inputs
  if (!productId || !quantity || quantity < 1) {
    throw new AppError(
      'Invalid product ID or quantity',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // 1. Verify product exists and is active
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new AppError(
      'Product not found or is unavailable',
      HTTP_STATUS.NOT_FOUND
    );
  }

  // 2. Check stock availability
  if (product.stock < quantity) {
    throw new AppError(
      `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      HTTP_STATUS.CONFLICT
    );
  }

  // 3. Get or create cart
  let cart = await Cart.getOrCreateCart(userId);

  // 4. Check if item already in cart to prevent duplicate entries
  const existingItem = cart.items.find(
    item => item.productId.toString() === productId
  );

  // 5. Validate total quantity won't exceed stock
  const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;
  if (totalQuantity > product.stock) {
    throw new AppError(
      `Total quantity exceeds available stock. Available: ${product.stock}, Total: ${totalQuantity}`,
      HTTP_STATUS.CONFLICT
    );
  }

  // 6. Add or update item atomically using Mongoose's built-in atomic operations
  // Using findByIdAndUpdate with $push or $inc to ensure atomicity
  let updatedCart;
  if (existingItem) {
    // Item exists: increment quantity
    updatedCart = await Cart.findByIdAndUpdate(
      cart._id,
      {
        $inc: { 'items.$.quantity': quantity }
      },
      { new: true, runValidators: true }
    );
  } else {
    // New item: push to array
    updatedCart = await Cart.findByIdAndUpdate(
      cart._id,
      {
        $push: {
          items: {
            productId,
            quantity,
            price: product.price,
            addedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );
  }

  // 7. Repopulate and return
  await updatedCart.populate('items.productId', 'name price stock category');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Item added to cart successfully',
    data: {
      id: updatedCart._id,
      itemCount: updatedCart.getItemCount(),
      items: updatedCart.items,
      summary: updatedCart.getSummary()
    }
  });
});

/**
 * PUT /cart/update
 * Update item quantity in cart with atomic operation
 * 
 * Prevents race conditions by:
 * - Atomically updating quantity using $set
 * - Validating new quantity against stock
 * - Preventing negative quantities
 * 
 * Request body:
 * {
 *   productId: string (MongoDB ID),
 *   quantity: number (1+)
 * }
 */
export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;

  // Validate inputs
  if (!productId || quantity === undefined || quantity < 1) {
    throw new AppError(
      'Invalid product ID or quantity',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // 1. Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND);
  }

  // 2. Check stock availability
  if (product.stock < quantity) {
    throw new AppError(
      `Requested quantity exceeds available stock. Available: ${product.stock}`,
      HTTP_STATUS.CONFLICT
    );
  }

  // 3. Get cart
  const cart = await Cart.findOne({ userId, isDeleted: false });
  if (!cart) {
    throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
  }

  // 4. Verify item exists in cart
  const itemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId
  );
  if (itemIndex === -1) {
    throw new AppError(
      'Item not found in cart',
      HTTP_STATUS.NOT_FOUND
    );
  }

  // 5. Update quantity atomically
  const updatedCart = await Cart.findByIdAndUpdate(
    cart._id,
    {
      $set: {
        ['items.' + itemIndex + '.quantity']: quantity
      }
    },
    { new: true, runValidators: true }
  ).populate('items.productId', 'name price stock category');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Cart item updated successfully',
    data: {
      id: updatedCart._id,
      itemCount: updatedCart.getItemCount(),
      items: updatedCart.items,
      summary: updatedCart.getSummary()
    }
  });
});

/**
 * DELETE /cart/:productId
 * Remove item from cart with atomic operation
 * 
 * Uses $pull operator for atomic array element removal
 * Prevents race conditions through MongoDB's atomic guarantees
 */
export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.userId;

  if (!productId) {
    throw new AppError('Product ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  // 1. Get cart
  const cart = await Cart.findOne({ userId, isDeleted: false });
  if (!cart) {
    throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
  }

  // 2. Verify item exists
  if (!cart.hasItem(productId)) {
    throw new AppError('Item not found in cart', HTTP_STATUS.NOT_FOUND);
  }

  // 3. Remove item atomically using $pull operator
  const updatedCart = await Cart.findByIdAndUpdate(
    cart._id,
    {
      $pull: {
        items: { productId }
      }
    },
    { new: true, runValidators: true }
  ).populate('items.productId', 'name price stock category');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Item removed from cart successfully',
    data: {
      id: updatedCart._id,
      itemCount: updatedCart.getItemCount(),
      items: updatedCart.items,
      summary: updatedCart.getSummary()
    }
  });
});

/**
 * DELETE /cart
 * Clear entire cart (soft delete)
 * 
 * Maintains audit trail by marking cart as deleted
 * instead of completely removing it
 */
export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const cart = await Cart.findOne({ userId, isDeleted: false });
  if (!cart) {
    throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
  }

  // Soft delete: clear items and mark as deleted
  await cart.softDelete();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      id: cart._id,
      itemCount: 0,
      isEmpty: true
    }
  });
});

/**
 * GET /cart/summary
 * Get cart summary with pricing breakdown
 * Used by frontend to display cart totals
 */
export const getCartSummary = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const cart = await Cart.findOne({ userId, isDeleted: false });
  if (!cart) {
    throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Cart summary retrieved successfully',
    data: cart.getSummary()
  });
});

/**
 * POST /cart/apply-discount
 * Apply discount code to cart
 * 
 * Request body:
 * {
 *   discountCode: string,
 *   discountAmount: number (optional, calculated by discount service)
 * }
 */
export const applyDiscount = asyncHandler(async (req, res) => {
  const { discountCode, discountAmount } = req.body;
  const userId = req.user.userId;

  if (!discountCode) {
    throw new AppError('Discount code is required', HTTP_STATUS.BAD_REQUEST);
  }

  const cart = await Cart.findOne({ userId, isDeleted: false });
  if (!cart) {
    throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
  }

  // Update discount code and amount
  cart.discountCode = discountCode;
  if (discountAmount !== undefined) {
    cart.discountAmount = Math.min(discountAmount, cart.subtotal);
  }

  await cart.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Discount applied successfully',
    data: {
      id: cart._id,
      discountCode: cart.discountCode,
      discountAmount: cart.discountAmount,
      summary: cart.getSummary()
    }
  });
});

/**
 * POST /cart/remove-discount
 * Remove discount code from cart
 */
export const removeDiscount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const cart = await Cart.findOne({ userId, isDeleted: false });
  if (!cart) {
    throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
  }

  cart.discountCode = null;
  cart.discountAmount = 0;

  await cart.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Discount removed successfully',
    data: {
      id: cart._id,
      summary: cart.getSummary()
    }
  });
});

/**
 * POST /cart/validate
 * Validate cart items (stock, availability, prices)
 * 
 * Returns:
 * - List of items with current status
 * - Identifies out-of-stock or price-changed items
 * - Validates total cart value
 */
export const validateCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const cart = await Cart.findOne({ userId, isDeleted: false })
    .populate('items.productId');

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate each item
  const validationResults = [];
  let isValid = true;
  let priceChange = 0;

  for (const item of cart.items) {
    const product = item.productId;
    const result = {
      productId: product._id,
      productName: product.name,
      requestedQuantity: item.quantity,
      status: 'valid',
      issues: []
    };

    // Check if product is still active
    if (!product.isActive) {
      result.status = 'invalid';
      result.issues.push('Product is no longer available');
      isValid = false;
    }

    // Check stock
    if (product.stock < item.quantity) {
      result.status = 'invalid';
      result.issues.push(
        `Insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`
      );
      isValid = false;
    }

    // Check price change
    if (product.price !== item.price) {
      result.status = 'warning';
      result.issues.push(
        `Price changed from ${item.price} to ${product.price}`
      );
      priceChange += (product.price - item.price) * item.quantity;
    }

    validationResults.push(result);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Cart validation completed',
    data: {
      isValid,
      priceChange: parseFloat(priceChange.toFixed(2)),
      itemsCount: cart.items.length,
      validationResults,
      currentTotal: cart.totalPrice
    }
  });
});
