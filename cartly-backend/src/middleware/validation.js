import { validationResult } from 'express-validator';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Express Validator Middleware
 * Extracts validation errors and returns them as JSON response
 * Use after validation chain: router.post('/route', [validation rules], handleValidationErrors, controller)
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Common validation error handler for catch blocks
 * Use with asyncHandler wrapper in controllers
 */
export const validationError = (message, field) => {
  const error = new Error(message);
  error.statusCode = HTTP_STATUS.BAD_REQUEST;
  error.field = field;
  return error;
};

