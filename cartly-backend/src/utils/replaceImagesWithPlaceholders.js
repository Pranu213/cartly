import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cartly';

const makePlaceholder = (id, w = 600, h = 600) => {
  // Use a stable picsum.photos seed per product id so images stay consistent
  const seed = String(id).replace(/[^a-zA-Z0-9]/g, '');
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected for image replacement');

    const products = await Product.find({}).lean();
    if (!products || products.length === 0) {
      console.log('ℹ️ No products found to update');
      process.exit(0);
    }

    let updated = 0;

    for (const p of products) {
      const placeholder = makePlaceholder(p._id);

      const newImage = { url: placeholder, alt: p.name || 'Product image' };
      const newImages = [newImage];

      const res = await Product.updateOne(
        { _id: p._id },
        { $set: { image: newImage, images: newImages } }
      );

      if (res.modifiedCount && res.modifiedCount > 0) updated += 1;
    }

    console.log(`✅ Updated ${updated} / ${products.length} products with placeholder images`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Image replacement failed:', err.message || err);
    process.exit(1);
  }
};

run();
