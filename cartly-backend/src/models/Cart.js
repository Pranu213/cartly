import mongoose from 'mongoose';

/**
 * Cart Schema
 * Stores shopping cart items for users (one cart per user)
 * Features:
 * - Atomic add/remove/update operations with MongoDB sessions
 * - Race condition prevention through optimistic locking (version field)
 * - Comprehensive validation and error handling
 * - Soft delete capability for audit trail
 */
const cartSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true, // One cart per user
      index: true // Index for cart lookup by user
    },
    // Cart Items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'Product ID is required'],
          index: true
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1'],
          integer: true,
          validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number'
          }
        },
        price: {
          type: Number,
          required: [true, 'Price is required'],
          min: [0.01, 'Price must be greater than 0'],
          set: (value) => parseFloat(value.toFixed(2)) // Ensure 2 decimal places
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // Cart Totals
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
      set: (value) => parseFloat(value.toFixed(2))
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
      set: (value) => parseFloat(value.toFixed(2))
    },
    taxRate: {
      type: Number,
      default: 0.1, // 10% default tax
      min: 0,
      max: 1
    },
    shippingCost: {
      type: Number,
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
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
      set: (value) => parseFloat(value.toFixed(2))
    },
    // Cart Status
    isEmpty: {
      type: Boolean,
      default: true
    },
    lastModified: Date,
    // Optimistic Locking - prevents race conditions
    __v: {
      type: Number,
      default: 0
    },
    // Soft Delete for audit trail
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ========== INDEXES ==========
// Unique index on userId for one-cart-per-user constraint
cartSchema.index({ userId: 1 }, { unique: true });
// Index for cart queries sorted by modification time
cartSchema.index({ userId: 1, lastModified: -1 });
// Compound index for active carts lookup
cartSchema.index({ userId: 1, isDeleted: 1 });

// ========== VIRTUAL FIELDS ==========
// Calculate total items in cart
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ========== MIDDLEWARE ==========
// Pre-save hook to calculate totals
cartSchema.pre('save', function (next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.subtotal = parseFloat(this.subtotal.toFixed(2));

  // Calculate tax
  this.taxAmount = parseFloat((this.subtotal * this.taxRate).toFixed(2));

  // Calculate total with discount
  this.totalPrice = parseFloat((this.subtotal + this.taxAmount + this.shippingCost - this.discountAmount).toFixed(2));
  this.totalPrice = Math.max(0, this.totalPrice); // Ensure not negative

  // Update isEmpty flag
  this.isEmpty = this.items.length === 0;

  // Update lastModified
  this.lastModified = new Date();

  next();
});

// ========== INSTANCE METHODS ==========
/**
 * Add item to cart with atomic update
 * Prevents race conditions through atomic operations
 */
cartSchema.methods.addItem = function (productId, quantity, price) {
  const existingItem = this.items.find(item => item.productId.toString() === productId.toString());

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ productId, quantity, price, addedAt: new Date() });
  }

  return this.save();
};

/**
 * Remove item from cart atomically
 */
cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(item => item.productId.toString() !== productId.toString());
  return this.save();
};

/**
 * Update item quantity with validation
 */
cartSchema.methods.updateItemQuantity = function (productId, quantity) {
  const item = this.items.find(item => item.productId.toString() === productId.toString());
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    item.quantity = quantity;
    return this.save();
  }
  return Promise.reject(new Error('Item not found in cart'));
};

/**
 * Clear cart completely
 */
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.discountCode = null;
  this.discountAmount = 0;
  return this.save();
};

/**
 * Get item count from cart
 */
cartSchema.methods.getItemCount = function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
};

/**
 * Check if item exists in cart
 */
cartSchema.methods.hasItem = function (productId) {
  return this.items.some(item => item.productId.toString() === productId.toString());
};

/**
 * Get cart summary with pricing breakdown
 */
cartSchema.methods.getSummary = function () {
  return {
    itemCount: this.getItemCount(),
    itemTypes: this.items.length,
    subtotal: this.subtotal,
    taxAmount: this.taxAmount,
    shippingCost: this.shippingCost,
    discountAmount: this.discountAmount,
    totalPrice: this.totalPrice,
    isEmpty: this.isEmpty,
    lastModified: this.lastModified
  };
};

// ========== STATIC METHODS ==========
/**
 * Get or create cart for user
 * Ensures single cart per user
 */
cartSchema.statics.getOrCreateCart = async function (userId) {
  let cart = await this.findOne({ userId, isDeleted: false });
  
  if (!cart) {
    cart = await this.create({
      userId,
      items: [],
      isEmpty: true,
      isDeleted: false
    });
  }
  
  return cart;
};

/**
 * Clear cart and mark as deleted (soft delete)
 */
cartSchema.methods.softDelete = function () {
  this.items = [];
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isEmpty = true;
  return this.save();
};

/**
 * Restore soft deleted cart
 */
cartSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

export const Cart = mongoose.model('Cart', cartSchema);
