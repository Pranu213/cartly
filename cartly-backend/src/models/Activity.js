import mongoose from 'mongoose';

// CARTLY-AGENT: Created Activity model to track user interactions (views, searches, purchases) for ranking algorithm

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true
    },
    type: {
      type: String,
      enum: ['view', 'search', 'purchase'],
      required: [true, 'Activity type is required'],
      index: true
    },
    weight: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

// Compound index for efficient ranking queries
activitySchema.index({ productId: 1, type: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
