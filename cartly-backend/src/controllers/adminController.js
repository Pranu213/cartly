import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { HTTP_STATUS, ROLES, ORDER_STATUS } from '../config/constants.js';
import { hashPassword } from '../utils/auth.js';
import { validateEmail, validatePassword } from '../utils/validators.js';

/**
 * User Management Endpoints
 */

/**
 * Admin: Create User
 * Creates a new user with specified role
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, role, phone, address } = req.body;

  // Validation
  if (!name || !email || !password || !role) {
    throw new AppError('Name, email, password, and role are required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!validateEmail(email)) {
    throw new AppError('Invalid email format', HTTP_STATUS.BAD_REQUEST);
  }

  if (!validatePassword(password)) {
    throw new AppError(
      'Password must be at least 6 characters with uppercase, lowercase, and numbers',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', HTTP_STATUS.BAD_REQUEST);
  }

  if (!Object.values(ROLES).includes(role)) {
    throw new AppError(`Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    phone: phone || '',
    address: address || '',
    isActive: true
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive
      }
    }
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const users = await User.find(filter)
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Users retrieved successfully',
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user
  });
});

/**
 * Admin: Update User
 * Updates user information including name, role, phone, address, and active status
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, role, isActive } = req.body;

  // Build update data
  const updateData = {};
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) {
      throw new AppError(`Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }
    updateData.role = role;
  }
  if (isActive !== undefined) updateData.isActive = isActive;

  const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!Object.values(ROLES).includes(role)) {
    throw new AppError('Invalid role', HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User role updated successfully',
    data: user
  });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: user
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * Order Management Endpoints
 */

export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, userId } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (userId) filter.userId = userId;

  const skip = (page - 1) * limit;
  const orders = await Order.find(filter)
    .populate('userId', 'name email')
    .populate('items.productId', 'name price')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Order.countDocuments(filter);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      ordersByStatus
    }
  });
});

/**
 * Dashboard Statistics
 */

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  const recentOrders = await Order.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const newUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('-password');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders,
      newUsers
    }
  });
});

/**
 * System Management
 */

export const getSystemHealth = asyncHandler(async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
      },
      timestamp: new Date().toISOString()
    }
  });
});
