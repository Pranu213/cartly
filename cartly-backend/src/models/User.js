import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

/**
 * User Schema
 * Stores user information with authentication and profile data
 */
const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
      index: true // Index for faster email lookups
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't include password by default in queries
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please provide a valid phone number'],
      default: null
    },
    // Role & Permissions
    role: {
      type: String,
      enum: {
        values: [ROLES.ADMIN, ROLES.USER],
        message: `Role must be either ${ROLES.ADMIN} or ${ROLES.USER}`
      },
      default: ROLES.USER,
      index: true // Index for role-based queries
    },
    // Address Information
    address: {
      street: {
        type: String,
        trim: true,
        maxlength: [100, 'Street cannot exceed 100 characters']
      },
      city: {
        type: String,
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
        trim: true,
        match: [/^[0-9]{5,10}$/, 'Please provide a valid ZIP code']
      },
      country: {
        type: String,
        trim: true,
        maxlength: [50, 'Country cannot exceed 50 characters']
      }
    },
    // Account Status
    isActive: {
      type: Boolean,
      default: true,
      index: true // Index for active user queries
    },
    // Refresh token (stored hashed or raw depending on policy) - not returned by default
    refreshToken: {
      type: String,
      select: false,
      default: null
    },
    // Profile Statistics
    totalOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    lastLogin: Date
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ========== INDEXES ==========
// Single field index for email lookups
userSchema.index({ email: 1 });
// Compound index for filtering active users by role
userSchema.index({ isActive: 1, role: 1 });
// Index for recent user queries
userSchema.index({ createdAt: -1 });
// Index for admin dashboard queries
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });

// ========== VIRTUAL FIELDS ==========
// Determine if user has completed profile
userSchema.virtual('isProfileComplete').get(function () {
  return !!(this.name && this.email && this.address?.city && this.address?.street);
});

// ========== MIDDLEWARE ==========
// Exclude deleted users from queries by default
userSchema.query.active = function () {
  return this.where({ isActive: true });
};

export const User = mongoose.model('User', userSchema);
