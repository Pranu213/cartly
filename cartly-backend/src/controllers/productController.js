import { Product } from '../models/Product.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';
import { logActivity, calculateRankScore } from '../utils/ranking.js';

// CARTLY-AGENT: Log view activity and support rank-based sorting; update rankScore on views

/**
 * Get All Products with Advanced Filtering, Searching, and Sorting
 * 
 * Query Parameters:
 * - search: Text search in name, description, tags
 * - category: Filter by category
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - inStock: Filter by stock availability (true/false)
 * - featured: Filter by featured status
 * - sortBy: Sort field (name, price, rating, createdAt)
 * - sortOrder: asc or desc (default: desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { 
    search, 
    category, 
    minPrice, 
    maxPrice, 
    inStock,
    featured,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1, 
    limit = 20 
  } = req.query;

  // Build filter object
  const filter = { isActive: true };

  // Text search using MongoDB text indexes
  if (search) {
    filter.$text = { $search: search };
  }

  // Category filtering
  if (category) {
    filter.category = category;
  }

  // Price range filtering
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) {
      filter.price.$gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      filter.price.$lte = parseFloat(maxPrice);
    }
  }

  // Stock availability filtering
  if (inStock !== undefined) {
    filter.stock = inStock === 'true' ? { $gt: 0 } : 0;
  }

  // Featured products filtering
  if (featured !== undefined) {
    filter.isFeatured = featured === 'true';
  }

  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build sort object (support rank sorting)
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  let sortObj = { createdAt: -1 };
  if (req.query.sort === 'rank' || sortBy === 'rank') {
    sortObj = { rankScore: -1 };
  } else {
    const validSortFields = ['name', 'price', 'rating', 'createdAt', 'reviews'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortObj = { [sortField]: sortDirection };
  }

  // Execute queries in parallel for performance
  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('-__v') // Exclude version field
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean() // Use lean() for read-only queries (faster)
      .exec(),
    Product.countDocuments(filter)
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: totalPages,
      hasNextPage,
      hasPrevPage
    },
    filters: {
      search: search || null,
      category: category || null,
      priceRange: (minPrice || maxPrice) ? { min: minPrice || 0, max: maxPrice || 'unlimited' } : null,
      inStock: inStock || null
    }
  });
});

/**
 * Get Product by ID
 * Returns single product with admin details
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .populate('createdBy', 'name email')
    .select('-__v');

  if (!product || !product.isActive) {
    throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND);
  }

  // Increment view count and log activity when user is authenticated
  try {
    const updated = await Product.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).select('views searches purchases rankScore');

    // If we have an authenticated user, log activity
    if (req.user && req.user.userId) {
      await logActivity(req.user.userId, product._id, 'view');
    }

    // Recalculate rankScore incrementally from stored counters
    const newRank = calculateRankScore(updated.views || 0, updated.searches || 0, updated.purchases || 0);
    if (newRank !== (updated.rankScore || 0)) {
      await Product.findByIdAndUpdate(id, { rankScore: newRank });
    }
  } catch (err) {
    // Non-fatal: logging failure shouldn't block response
    console.error('Activity logging failed:', err.message);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: product
  });
});

/**
 * Create Product (Admin Only)
 * Creates a new product with all details
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    price, 
    originalPrice,
    category, 
    stock, 
    image,
    images,
    tags,
    lowStockThreshold
  } = req.body;

  // Validation
  if (!name || !description || !price || !category) {
    throw new AppError('Required fields missing: name, description, price, category', HTTP_STATUS.BAD_REQUEST);
  }

  if (price < 0.01) {
    throw new AppError('Price must be greater than 0', HTTP_STATUS.BAD_REQUEST);
  }

  if (stock < 0) {
    throw new AppError('Stock cannot be negative', HTTP_STATUS.BAD_REQUEST);
  }

  // Create product with all fields
  const product = await Product.create({
    name,
    description,
    price,
    originalPrice: originalPrice || undefined,
    category,
    stock: stock || 0,
    image: image || {},
    images: images || [],
    tags: tags || [],
    lowStockThreshold: lowStockThreshold || 10,
    createdBy: req.user.userId,
    isActive: true
  });

  // Return created product (without lean for virtuals)
  const populatedProduct = await Product.findById(product._id)
    .populate('createdBy', 'name email');

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Product created successfully',
    data: populatedProduct
  });
});

/**
 * Update Product (Admin Only)
 * Updates product information
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    description, 
    price,
    originalPrice, 
    category, 
    stock, 
    image,
    images,
    tags,
    lowStockThreshold,
    isFeatured,
    isActive
  } = req.body;

  // Find product
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND);
  }

  // Check authorization (admin can update any product)
  if (product.createdBy.toString() !== req.user.userId && req.user.role !== ROLES.ADMIN) {
    throw new AppError('Not authorized to update this product', HTTP_STATUS.FORBIDDEN);
  }

  // Build update data - only include provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) {
    if (price < 0.01) throw new AppError('Price must be greater than 0', HTTP_STATUS.BAD_REQUEST);
    updateData.price = price;
  }
  if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
  if (category !== undefined) updateData.category = category;
  if (stock !== undefined) {
    if (stock < 0) throw new AppError('Stock cannot be negative', HTTP_STATUS.BAD_REQUEST);
    updateData.stock = stock;
  }
  if (image !== undefined) updateData.image = image;
  if (images !== undefined) updateData.images = images;
  if (tags !== undefined) updateData.tags = tags;
  if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Update with validation
  const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { 
    new: true,
    runValidators: true
  }).populate('createdBy', 'name email');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

/**
 * Delete Product (Admin Only - Soft Delete)
 * Marks product as inactive instead of hard deleting
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND);
  }

  // Check authorization
  if (product.createdBy.toString() !== req.user.userId && req.user.role !== ROLES.ADMIN) {
    throw new AppError('Not authorized to delete this product', HTTP_STATUS.FORBIDDEN);
  }

  // Soft delete
  await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Product deleted successfully',
    data: { id, isActive: false }
  });
});

/**
 * Get All Categories
 * Returns list of all product categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: categories.sort() // Sort alphabetically
  });
});

/**
 * Search Products (Text Search)
 * Uses MongoDB text index for efficient full-text search
 */
export const searchProducts = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 20 } = req.query;

  if (!query || query.trim().length === 0) {
    throw new AppError('Search query is required', HTTP_STATUS.BAD_REQUEST);
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limitNum)
      .lean()
      .exec(),
    Product.countDocuments({ $text: { $search: query }, isActive: true })
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * Get Featured Products
 * Returns featured products for homepage display
 */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

  const products = await Product.find({ isActive: true, isFeatured: true })
    .sort({ rating: -1, reviews: -1 })
    .limit(limitNum)
    .lean()
    .exec();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: products
  });
});

/**
 * Get Product Recommendations
 * Returns products in same category with similar price range
 */
export const getProductRecommendations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 5 } = req.query;

  // Get the product
  const product = await Product.findById(id);
  if (!product || !product.isActive) {
    throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND);
  }

  const limitNum = Math.min(20, Math.max(1, parseInt(limit) || 5));

  // Get similar products (same category, similar price, excluding current)
  const recommendations = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
    price: {
      $gte: product.price * 0.7, // 70% of product price
      $lte: product.price * 1.3   // 130% of product price
    }
  })
    .sort({ rating: -1, reviews: -1 })
    .limit(limitNum)
    .lean()
    .exec();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: recommendations
  });
});

/**
 * Get Products by Admin
 * Returns all products created by specific admin (admin only)
 */
export const getProductsByAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive } = req.query;

  const filter = { createdBy: req.user.userId };
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter)
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * Get Low Stock Products
 * Returns products with stock below threshold (admin only)
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

  // Use aggregation for better performance on complex queries
  const products = await Product.aggregate([
    {
      $match: {
        isActive: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] }
      }
    },
    {
      $sort: { stock: 1 }
    },
    {
      $limit: limitNum
    },
    {
      $project: {
        name: 1,
        category: 1,
        stock: 1,
        lowStockThreshold: 1,
        price: 1,
        createdBy: 1
      }
    }
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: products,
    totalLowStockProducts: products.length
  });
});

/**
 * Get Product Statistics
 * Returns aggregated product metrics (admin only)
 */
export const getProductStats = asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: '$reviews' }
      }
    }
  ]);

  const categoryStats = await Product.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        totalStock: { $sum: '$stock' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      overall: stats[0] || {},
      byCategory: categoryStats
    }
  });
});
