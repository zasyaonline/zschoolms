import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware to validate request using express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    throw new ValidationError('Validation failed', formattedErrors);
  }

  next();
};

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
