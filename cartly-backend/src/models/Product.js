import mongoose from 'mongoose';

/**
 * Product Schema
 * Stores product information including details, pricing, inventory, and relationships
 */
const productSchema = new mongoose.Schema(
  {
    // Product Identification
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [150, 'Product name cannot exceed 150 characters'],
      index: true // Index for product name searches
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    // Pricing Information
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0'],
      set: (value) => parseFloat(value.toFixed(2)) // Ensure 2 decimal places
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      set: (value) => value ? parseFloat(value.toFixed(2)) : undefined
    },
    // Categorization
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true // Index for category filtering
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    // Inventory Management
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
      integer: true
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },
    // Media
    image: {
      url: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid image URL']
      },
      alt: {
        type: String,
        trim: true,
        maxlength: [200, 'Image alt text cannot exceed 200 characters']
      }
    },
    images: [{
      url: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid image URL']
      },
      alt: {
        type: String,
        trim: true
      }
    }],
    // Ratings & Reviews
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
      set: (value) => parseFloat(value.toFixed(1))
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
      integer: true
    },
    // Relationships
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    // Ranking System
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    searches: {
      type: Number,
      default: 0,
      min: 0
    },
    purchases: {
      type: Number,
      default: 0,
      min: 0
    },
    rankScore: {
      type: Number,
      default: 0,
      index: true
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true // Index for active product queries
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ========== COMPOUND INDEXES ==========
// Index for product search and filtering
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
// Index for category and status filtering
productSchema.index({ category: 1, isActive: 1 });
// Index for featured products
productSchema.index({ isFeatured: 1, isActive: 1, createdAt: -1 });
// Compound index for product discovery (category + price range)
productSchema.index({ category: 1, price: 1, isActive: 1 });
// Index for sorting by ratings
productSchema.index({ rating: -1, reviews: -1, isActive: 1 });
// Index for low stock alerts
productSchema.index({ stock: 1, isActive: 1 });
// Index for ranking by popularity
productSchema.index({ rankScore: -1, isActive: 1 });

// ========== VIRTUAL FIELDS ==========
// Calculate discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.originalPrice && this.price < this.originalPrice) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Check if product is in stock
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Check if product has low stock
productSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// ========== MIDDLEWARE ==========
// Query middleware to exclude inactive products by default
productSchema.query.active = function () {
  return this.where({ isActive: true });
};

export const Product = mongoose.model('Product', productSchema);
