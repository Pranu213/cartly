import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cartly';

const products = [
  // Electronics
  { name: 'boAt Rockerz 450 Bluetooth Headphones', description: 'On-ear wireless headphones with 15hr battery, 40mm drivers, and foldable design.', price: 1299, category: 'Electronics', stock: 40, rankScore: 120, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'] },
  { name: 'Redmi 12C Smartphone', description: '6.71" HD+ display, 5000mAh battery, 50MP camera, MediaTek Helio G85.', price: 8999, category: 'Electronics', stock: 25, rankScore: 200, images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'] },
  { name: 'Portronics Toad 23 Wireless Mouse', description: '2.4GHz wireless, 1600 DPI, plug and play USB receiver.', price: 399, category: 'Electronics', stock: 60, rankScore: 80, images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'] },
  { name: 'Zebronics Zeb-Thunder Wired Headset', description: 'Over-ear headset with mic, 40mm drivers, compatible with PC and mobile.', price: 449, category: 'Electronics', stock: 35, rankScore: 60, images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400'] },
  { name: 'Ambrane 20000mAh Power Bank', description: 'Dual USB output, fast charging, LED indicator, slim design.', price: 999, category: 'Electronics', stock: 30, rankScore: 95, images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400'] },

  // Grocery
  { name: 'Aashirvaad Atta 10kg', description: 'Superior MP whole wheat atta, ideal for soft rotis.', price: 349, category: 'Grocery', stock: 80, rankScore: 300, images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },
  { name: 'Tata Salt 1kg', description: 'Iodised vacuum evaporated salt, fine grain.', price: 28, category: 'Grocery', stock: 150, rankScore: 400, images: ['https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400'] },
  { name: 'Fortune Sunflower Oil 5L', description: 'Refined sunflower oil, rich in Vitamin E, light and healthy.', price: 699, category: 'Grocery', stock: 60, rankScore: 250, images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'] },
  { name: 'Amul Butter 500g', description: 'Pasteurised table butter, rich and creamy taste.', price: 260, category: 'Grocery', stock: 45, rankScore: 280, images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400'] },
  { name: 'Britannia Good Day Cashew Cookies 600g', description: 'Crunchy cookies loaded with real cashew bits.', price: 99, category: 'Grocery', stock: 100, rankScore: 190, images: ['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400'] },

  // Personal Care
  { name: 'Dove Body Wash 250ml', description: 'Moisturising shower gel with ¼ moisturising cream, gentle on skin.', price: 199, category: 'Personal Care', stock: 55, rankScore: 140, images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400'] },
  { name: 'Mamaearth Onion Shampoo 250ml', description: 'Controls hair fall, enriched with onion oil and plant keratin.', price: 299, category: 'Personal Care', stock: 50, rankScore: 175, images: ['https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400'] },
  { name: 'Himalaya Neem Face Wash 150ml', description: 'Deep cleansing, controls pimples, removes excess oil.', price: 130, category: 'Personal Care', stock: 70, rankScore: 210, images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'] },
  { name: 'Gillette Mach3 Razor + 2 Cartridges', description: '3-blade system for a close, comfortable shave.', price: 349, category: 'Personal Care', stock: 40, rankScore: 100, images: ['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400'] },
  { name: 'Nivea Soft Moisturising Cream 200ml', description: 'Enriched with Vitamin E and jojoba oil, lightweight daily moisturiser.', price: 189, category: 'Personal Care', stock: 65, rankScore: 155, images: ['https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=400'] },

  // Kitchen
  { name: 'Milton Thermosteel Flask 1L', description: 'Double wall insulated, keeps hot 24hrs / cold 48hrs.', price: 699, category: 'Kitchen', stock: 30, rankScore: 90, images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'] },
  { name: 'Pigeon Aluminium Pressure Cooker 5L', description: 'ISI certified, induction compatible, easy lock lid.', price: 899, category: 'Kitchen', stock: 20, rankScore: 70, images: ['https://images.unsplash.com/photo-1585837575652-267f4b54d6e7?w=400'] },
  { name: 'Cello Opalware Dinner Set 18pc', description: '18-piece opalware set, microwave safe, break resistant.', price: 1199, category: 'Kitchen', stock: 15, rankScore: 55, images: ['https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=400'] },

  // Fashion
  { name: "Levi's Men's Regular Fit Jeans", description: 'Classic 5-pocket regular fit jeans in mid-blue wash.', price: 2499, category: 'Fashion', stock: 35, rankScore: 160, images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'] },
  { name: "Jockey Women's Cotton Ankle Socks 3 Pack", description: 'Breathable cotton blend, cushioned sole, anti-slip heel.', price: 249, category: 'Fashion', stock: 80, rankScore: 130, images: ['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400'] },
  { name: "Puma Men's Running T-Shirt", description: 'dryCELL moisture-wicking fabric, slim fit, reflective logo.', price: 999, category: 'Fashion', stock: 45, rankScore: 145, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'] },

  // Sports
  { name: 'Boldfit Resistance Bands Set', description: 'Latex bands with 5 resistance levels, includes carry bag.', price: 499, category: 'Sports', stock: 50, rankScore: 110, images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400'] },
  { name: 'Lifelong Skipping Rope', description: 'Adjustable PVC rope with foam handles, ideal for cardio.', price: 179, category: 'Sports', stock: 60, rankScore: 85, images: ['https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=400'] },
  { name: 'Vector X Football Size 5', description: 'Hand-stitched PVC football, suitable for all surfaces.', price: 599, category: 'Sports', stock: 25, rankScore: 75, images: ['https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=400'] },

  // Books
  { name: 'Atomic Habits — James Clear', description: 'Proven framework for building good habits and breaking bad ones.', price: 399, category: 'Books', stock: 40, rankScore: 220, images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'] },
  { name: 'The Alchemist — Paulo Coelho', description: 'International bestseller about following your dreams.', price: 199, category: 'Books', stock: 50, rankScore: 180, images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'] },
];

const normalizeProducts = (items) => {
  return items.map((product) => {
    const normalizedImages = (product.images || []).map((imageUrl) => ({
      url: imageUrl,
      alt: product.name
    }));

    return {
      ...product,
      image: normalizedImages[0] || undefined,
      images: normalizedImages,
      isActive: true
    };
  });
};

const seedProducts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected for seeding');

    const docs = normalizeProducts(products);
    await Product.deleteMany({});
    const inserted = await Product.insertMany(docs);

    console.log(`✅ Seed complete: inserted ${inserted.length} products`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedProducts();