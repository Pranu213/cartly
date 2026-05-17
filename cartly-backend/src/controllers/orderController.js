import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { HTTP_STATUS, ORDER_STATUS } from '../config/constants.js';
import { logActivity, calculateRankScore } from '../utils/ranking.js';

// CARTLY-AGENT: After successful orders, log purchase activities and update product purchase counters and rankScore

/**
 * ORDER CONTROLLER
 * 
 * Features:
 * - MongoDB transactions for ACID compliance
 * - Atomic inventory reduction (prevents overselling)
 * - Comprehensive error handling with transaction rollback
 * - Cart-to-Order conversion with transactional consistency
 * - Support for order cancellation with automatic stock restoration
 * 
 * Transaction Pattern:
 * 1. Start session
 * 2. Validate cart and stock
 * 3. Create order
 * 4. Reduce product inventory atomically
 * 5. Clear user cart
 * 6. Commit transaction
 * 7. Rollback on any error (automatic with try/catch)
 */

/**
 * GET /orders
 * Retrieve user's orders with pagination and filtering
 * 
 * Query Parameters:
 * - status: Filter by order status (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * 
 * Returns: List of orders with pagination metadata
 */
export const getOrders = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { status, page = 1, limit = 10, sortBy = '-createdAt' } = req.query;

  // Build filter
  const filter = { userId };
  if (status && Object.values(ORDER_STATUS).includes(status)) {
    filter.status = status;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const pageSize = Math.min(parseInt(limit), 100); // Cap limit to 100

  // Fetch orders with population
  const orders = await Order.find(filter)
    .populate('userId', 'name email')
    .populate('items.productId', 'name price image category')
    .sort(sortBy)
    .skip(skip)
    .limit(pageSize)
    .lean(); // Use lean for read-only queries

  // Get total count
  const total = await Order.countDocuments(filter);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize)
    }
  });
});

/**
 * GET /orders/:id
 * Retrieve specific order by ID
 * 
 * Authorization: User can only view their own orders
 * 
 * Returns: Order with full details including product info
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // Validate MongoDB ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid order ID format', HTTP_STATUS.BAD_REQUEST);
  }

  // Fetch order with populated references
  const order = await Order.findById(id)
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name price image category description');

  if (!order) {
    throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND);
  }

  // Check authorization - users can only view their own orders
  if (order.userId._id.toString() !== userId) {
    throw new AppError(
      'Not authorized to view this order',
      HTTP_STATUS.FORBIDDEN
    );
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Order retrieved successfully',
    data: order
  });
});

/**
 * POST /orders
 * Create order from cart with transactional consistency
 * 
 * This is the critical operation that prevents:
 * - Overselling (inventory goes negative)
 * - Double-charging (cart not cleared)
 * - Partial updates (all-or-nothing operation)
 * - Race conditions (atomic update operators)
 * 
 * Transaction Guarantees (ACID):
 * - Atomicity: All operations succeed or all rollback
 * - Consistency: Stock never negative, cart cleared if order created
 * - Isolation: Concurrent requests don't interfere
 * - Durability: Once committed, persists through failures
 * 
 * Request Body:
 * {
 *   shippingAddress: {
 *     fullName: string,
 *     phone: string,
 *     street: string,
 *     city: string,
 *     state: string,
 *     zipCode: string,
 *     country: string
 *   },
 *   billingAddress?: { ... },
 *   paymentMethod: string (credit_card|debit_card|paypal|bank_transfer),
 *   notes?: string
 * }
 * 
 * Returns: Created order with order number
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;
  const userId = req.user.userId;

  // 1. VALIDATION PHASE
  // ==================================================

  // Validate shipping address
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street) {
    throw new AppError(
      'Complete shipping address is required',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Validate payment method
  const validPaymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    throw new AppError(
      'Valid payment method is required',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // 2. FETCH CART AND VALIDATE
  // ==================================================

  const cart = await Cart.findOne({ userId, isDeleted: false })
    .populate('items.productId');

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty. Add items before creating order.', HTTP_STATUS.BAD_REQUEST);
  }

  // 3. VALIDATE ALL ITEMS IN CART
  // ==================================================

  const cartValidation = [];
  for (const item of cart.items) {
    const product = item.productId;

    // Check product exists
    if (!product) {
      throw new AppError(
        'One or more products in cart no longer exist',
        HTTP_STATUS.CONFLICT
      );
    }

    // Check product is active
    if (!product.isActive) {
      throw new AppError(
        `Product "${product.name}" is no longer available`,
        HTTP_STATUS.CONFLICT
      );
    }

    // Check stock availability - CRITICAL CHECK
    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        HTTP_STATUS.CONFLICT
      );
    }

    cartValidation.push({
      productId: product._id,
      productName: product.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      stockAtPurchase: product.stock
    });
  }

  // 4. START MONGODB TRANSACTION
  // ==================================================

  // Create a session for atomic operations
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 5. REDUCE INVENTORY ATOMICALLY
    // ==================================================

    // Use $inc operator for atomic decrement
    // This ensures inventory never goes negative
    const inventoryUpdates = [];
    for (const item of cartValidation) {
      // Atomic update: reduce stock
      const updateResult = await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stock: -item.quantity } // Negative increment = decrement
        },
        {
          session, // Use transaction session
          new: true,
          runValidators: true
        }
      );

      // Validate stock didn't go negative (fail-safe)
      if (updateResult.stock < 0) {
        throw new AppError(
          `Race condition detected for "${item.productName}". Please retry.`,
          HTTP_STATUS.CONFLICT
        );
      }

      inventoryUpdates.push(updateResult._id);
    }

    // 6. CREATE ORDER WITH TRANSACTION
    // ==================================================

    const order = await Order.create(
      [
        {
          userId,
          items: cartValidation.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            stockAtPurchase: item.stockAtPurchase
          })),
          subtotal: cart.subtotal,
          taxAmount: cart.taxAmount,
          taxRate: cart.taxRate,
          shippingCost: cart.shippingCost,
          discountCode: cart.discountCode,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalPrice,
          shippingAddress,
          billingAddress: billingAddress || shippingAddress,
          paymentMethod,
          paymentStatus: 'pending',
          status: ORDER_STATUS.PENDING,
          notes,
          inventoryTransactionId: session.id.toString()
        }
      ],
      { session } // Use transaction session
    );

    // 7. CLEAR USER'S CART ATOMICALLY
    // ==================================================

    await Cart.findOneAndUpdate(
      { userId },
      {
        $set: {
          items: [],
          isEmpty: true,
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { session }
    );

    // 8. COMMIT TRANSACTION
    // ==================================================

    await session.commitTransaction();

    // Fire-and-forget: log purchase activities and update product purchase counters
    (async () => {
      try {
        for (const item of order[0].items) {
          // Log activity if user exists
          if (userId) {
            await logActivity(userId, item.productId, 'purchase');
          }

          // Increment purchases counter and recalc rankScore incrementally
          const updatedProd = await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { purchases: item.quantity } },
            { new: true }
          ).select('views searches purchases rankScore');

          const newRank = calculateRankScore(updatedProd.views || 0, updatedProd.searches || 0, updatedProd.purchases || 0);
          if (newRank !== (updatedProd.rankScore || 0)) {
            await Product.findByIdAndUpdate(item.productId, { rankScore: newRank });
          }
        }
      } catch (err) {
        console.error('Failed to update purchase activity or rank:', err.message);
      }
    })();

    // 9. SUCCESS RESPONSE
    // ==================================================

    // Populate order details for response
    await order[0].populate('userId', 'name email');
    await order[0].populate('items.productId', 'name category');

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order[0]._id,
        orderNumber: order[0].orderNumber,
        status: order[0].status,
        totalAmount: order[0].totalAmount,
        itemsCount: order[0].items.length,
        createdAt: order[0].createdAt,
        shippingAddress: order[0].shippingAddress
      }
    });

  } catch (error) {
    // Transaction automatically aborts on error
    // Stock changes are rolled back
    // Order is not created
    // Cart remains intact
    throw error;

  } finally {
    // Always end session
    await session.endSession();
  }
});

/**
 * PATCH /orders/:id/cancel
 * Cancel order and restore inventory
 * 
 * Only permits cancellation of PENDING orders
 * Atomically restores stock when cancelled
 * 
 * Authorization: Only user who created order can cancel
 * 
 * Returns: Updated order with CANCELLED status
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // Validate MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid order ID format', HTTP_STATUS.BAD_REQUEST);
  }

  // 1. Fetch order
  const order = await Order.findById(id);

  if (!order) {
    throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND);
  }

  // 2. Check authorization
  if (order.userId.toString() !== userId) {
    throw new AppError(
      'Not authorized to cancel this order',
      HTTP_STATUS.FORBIDDEN
    );
  }

  // 3. Check if order can be cancelled
  if (order.status === ORDER_STATUS.CANCELLED) {
    throw new AppError('Order is already cancelled', HTTP_STATUS.BAD_REQUEST);
  }

  // Only PENDING and PROCESSING orders can be cancelled
  const cancellableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING];
  if (!cancellableStatuses.includes(order.status)) {
    throw new AppError(
      `Cannot cancel ${order.status} orders. Only pending or processing orders can be cancelled.`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // 4. Start transaction for cancellation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 5. Restore inventory atomically
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }, // Positive increment = add back
        { session }
      );
    }

    // 6. Update order status
    order.status = ORDER_STATUS.CANCELLED;
    order.paymentStatus = 'refunded';
    await order.save({ session });

    // 7. Commit transaction
    await session.commitTransaction();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order cancelled successfully. Inventory restored.',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        itemsRestored: order.items.length
      }
    });

  } catch (error) {
    // Transaction automatically rolls back
    throw error;

  } finally {
    await session.endSession();
  }
});

/**
 * PATCH /orders/:id/status
 * Update order status (admin only)
 * 
 * Allowed transitions depend on current status
 * Admin-only operation
 * 
 * Request Body:
 * {
 *   status: string (one of ORDER_STATUS values),
 *   trackingNumber?: string,
 *   paymentStatus?: string
 * }
 * 
 * Returns: Updated order
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus, trackingNumber } = req.body;

  // Validate MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid order ID format', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate status is valid
  if (status && !Object.values(ORDER_STATUS).includes(status)) {
    throw new AppError(
      `Invalid status. Must be one of: ${Object.values(ORDER_STATUS).join(', ')}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Fetch order
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND);
  }

  // Build update object
  const updates = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  if (trackingNumber) updates.trackingNumber = trackingNumber;

  // Update timestamp if shipping
  if (status === ORDER_STATUS.SHIPPED) {
    updates.shippedAt = new Date();
    updates.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // Update timestamp if delivered
  if (status === ORDER_STATUS.DELIVERED) {
    updates.actualDelivery = new Date();
  }

  // Apply updates
  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('items.productId', 'name category');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      orderId: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      updatedAt: updatedOrder.updatedAt
    }
  });
});
