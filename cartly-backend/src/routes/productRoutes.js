import express from 'express';
import { body, param, query } from 'express-validator';
import * as productController from '../controllers/productController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// ========== VALIDATION SCHEMAS ==========

// Product creation validation
const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 150 }).withMessage('Name must be 3-150 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('price')
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Original price must be non-negative'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative number'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 }).withMessage('Low stock threshold must be non-negative'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('image.url')
    .optional()
    .trim()
    .isURL().withMessage('Image URL must be valid'),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array')
];

// Product update validation
const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('Name must be 3-150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Original price must be non-negative'),
  body('category')
    .optional()
    .trim()
    .notEmpty().withMessage('Category cannot be empty'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 }).withMessage('Low stock threshold must be non-negative'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be boolean'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be boolean'),
  body('image')
    .optional(),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array')
];

// Query validation for list
const listProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('Search must have at least 1 character'),
  query('category')
    .optional()
    .trim(),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Min price must be non-negative'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Max price must be non-negative'),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'rating', 'createdAt', 'reviews']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Search validation
const searchValidation = [
  query('query')
    .notEmpty().withMessage('Search query is required')
    .trim()
    .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

// ID validation
const idValidation = [
  param('id')
    .isMongoId().withMessage('Invalid product ID')
];

// ========== PUBLIC ROUTES ==========

// Get all products with filtering, searching, sorting
router.get(
  '/',
  listProductsValidation,
  handleValidationErrors,
  productController.getAllProducts
);

// Get product categories
router.get(
  '/categories',
  productController.getCategories
);

// Search products by text
router.get(
  '/search/query',
  searchValidation,
  handleValidationErrors,
  productController.searchProducts
);

// Get featured products
router.get(
  '/featured/list',
  productController.getFeaturedProducts
);

// Get single product by ID
router.get(
  '/:id',
  idValidation,
  handleValidationErrors,
  productController.getProductById
);

// Get product recommendations
router.get(
  '/:id/recommendations',
  idValidation,
  handleValidationErrors,
  productController.getProductRecommendations
);

// ========== ADMIN ROUTES ==========

// Create product (admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  createProductValidation,
  handleValidationErrors,
  productController.createProduct
);

// Update product (admin only)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  idValidation,
  updateProductValidation,
  handleValidationErrors,
  productController.updateProduct
);

// Delete product (admin only - soft delete)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idValidation,
  handleValidationErrors,
  productController.deleteProduct
);

// Get products by current admin
router.get(
  '/admin/my-products',
  authenticate,
  requireAdmin,
  productController.getProductsByAdmin
);

// Get low stock products (admin only)
router.get(
  '/admin/low-stock',
  authenticate,
  requireAdmin,
  productController.getLowStockProducts
);

// Get product statistics (admin only)
router.get(
  '/admin/stats',
  authenticate,
  requireAdmin,
  productController.getProductStats
);

export default router;

