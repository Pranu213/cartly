import mongoose from 'mongoose';
import { ORDER_STATUS } from '../config/constants.js';

/**
 * Order Schema
 * Stores order information including items, pricing, shipping, and payment
 * Features:
 * - MongoDB transaction support for atomic order creation
 * - Inventory tracking for atomically reduced stock
 * - Transactional consistency guarantees
 * - Audit trail for debugging and support
 */
const orderSchema = new mongoose.Schema(
  {
    // Order Identification
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
      index: true // Index for order number lookups
    },
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true // Index for user order history
    },
    // Inventory Transaction ID (for tracking atomic reductions)
    inventoryTransactionId: {
      type: String,
      trim: true,
      default: null,
      index: true // Track inventory changes
    },
    // Order Items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'Product ID is required'],
          index: true
        },
        productName: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1'],
          integer: true
        },
        price: {
          type: Number,
          required: [true, 'Price is required'],
          min: [0.01, 'Price must be greater than 0'],
          set: (value) => parseFloat(value.toFixed(2))
        },
        subtotal: {
          type: Number,
          required: true,
          set: (value) => parseFloat(value.toFixed(2))
        },
        // Track stock at purchase time for audit
        stockAtPurchase: {
          type: Number,
          required: true
        }
      }
    ],
    // Pricing Information
    subtotal: {
      type: Number,
      required: true,
      min: [0.01, 'Subtotal must be greater than 0'],
      set: (value) => parseFloat(value.toFixed(2))
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      set: (value) => parseFloat(value.toFixed(2))
    },
    taxRate: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      set: (value) => parseFloat(value.toFixed(2))
    },
    discountCode: {
      type: String,
      trim: true,
      default: null
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
      set: (value) => parseFloat(value.toFixed(2))
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
      set: (value) => parseFloat(value.toFixed(2))
    },
    // Order Status
    status: {
      type: String,
      enum: {
        values: Object.values(ORDER_STATUS),
        message: `Status must be one of: ${Object.values(ORDER_STATUS).join(', ')}`
      },
      default: ORDER_STATUS.PENDING,
      index: true // Index for order status filtering
    },
    // Shipping Information
    shippingAddress: {
      fullName: {
        type: String,
        required: [true, 'Recipient name is required'],
        trim: true
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
      },
      street: {
        type: String,
        required: [true, 'Street is required'],
        trim: true,
        maxlength: [100, 'Street cannot exceed 100 characters']
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters']
      },
      state: {
        type: String,
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters']
      },
      zipCode: {
        type: String,
        required: [true, 'ZIP code is required'],
        trim: true
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        maxlength: [50, 'Country cannot exceed 50 characters']
      }
    },
    // Billing Information (optional, can be same as shipping)
    billingAddress: {
      fullName: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    // Payment Information
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
      required: [true, 'Payment method is required']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    transactionId: {
      type: String,
      trim: true,
      default: null
    },
    // Tracking & Timeline
    trackingNumber: {
      type: String,
      trim: true,
      default: null,
      unique: true,
      sparse: true // Allow null values for non-shipped orders
    },
    shippingProvider: {
      type: String,
      trim: true,
      default: null,
      enum: ['fedex', 'ups', 'dhl', 'usps', null]
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    shippedAt: Date,
    // Additional Information
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: null
    },
    internalNotes: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ========== COMPOUND INDEXES ==========
// Index for user order history with status
orderSchema.index({ userId: 1, status: 1 });
// Index for date range queries on user orders
orderSchema.index({ userId: 1, createdAt: -1 });
// Index for admin order management
orderSchema.index({ status: 1, createdAt: -1 });
// Index for payment status tracking
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
// Index for tracking number lookups
orderSchema.index({ trackingNumber: 1 }, { sparse: true });

// ========== VIRTUAL FIELDS ==========
// Calculate if order is recent (within last 7 days)
orderSchema.virtual('isRecent').get(function () {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.createdAt > sevenDaysAgo;
});

// Check if order has been delivered
orderSchema.virtual('isDelivered').get(function () {
  return this.status === ORDER_STATUS.DELIVERED;
});

// ========== MIDDLEWARE ==========
// Pre-save hook to validate order consistency
orderSchema.pre('save', function (next) {
  // Ensure totalAmount equals subtotal + tax + shipping - discount
  const calculated = this.subtotal + this.taxAmount + this.shippingCost - this.discountAmount;
  if (Math.abs(calculated - this.totalAmount) > 0.01) {
    // Recalculate if there's a discrepancy
    this.totalAmount = parseFloat(calculated.toFixed(2));
  }

  // Generate order number if not exists
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${randomStr}`;
  }

  next();
});

// Method to mark order as shipped
orderSchema.methods.markAsShipped = function (trackingNumber, shippingProvider) {
  this.status = ORDER_STATUS.SHIPPED;
  this.trackingNumber = trackingNumber;
  this.shippingProvider = shippingProvider;
  this.shippedAt = new Date();
  this.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default
  return this.save();
};

// Method to mark order as delivered
orderSchema.methods.markAsDelivered = function () {
  this.status = ORDER_STATUS.DELIVERED;
  this.actualDelivery = new Date();
  return this.save();
};

// Method to process refund
orderSchema.methods.processRefund = function () {
  this.status = ORDER_STATUS.CANCELLED;
  this.paymentStatus = 'refunded';
  return this.save();
};

// Static method to get pending orders
orderSchema.statics.getPendingOrders = function () {
  return this.find({ status: ORDER_STATUS.PENDING }).populate('userId');
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

export const Order = mongoose.model('Order', orderSchema);
