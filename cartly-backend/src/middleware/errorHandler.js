import { HTTP_STATUS } from '../config/constants.js';

/**
 * 404 Not Found Handler Middleware
 * Handles requests to undefined routes
 */
export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND'
  });
};

/**
 * Global Error Handler Middleware
 * Catches all errors and sends consistent error responses
 * Must be the last middleware in the chain
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = HTTP_STATUS.INTERNAL_ERROR;
  let message = 'Internal Server Error';
  let details = null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation Error';
    details = Object.values(err.errors).map(e => e.message);
  }
  // Handle Mongoose Cast Error (Invalid ID)
  else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid ID format';
  }
  // Handle Mongoose Duplicate Key Error
  else if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }
  // Handle JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token expired';
  }
  // Handle Custom AppError
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle custom errors with message
  else if (err.message) {
    message = err.message;
  }

  // Log error with timestamp and request context
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR:`, {
    statusCode,
    message,
    details,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.userId || 'Anonymous',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Send error response
  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err.name 
    })
  };

  res.status(statusCode).json(response);
};
