import mongoose from 'mongoose';

const blacklistedTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, index: true },
    type: { type: String, enum: ['access', 'refresh'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    expiresAt: { type: Date, required: false }
  },
  { timestamps: true }
);

// Auto-remove expired blacklist entries
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);
