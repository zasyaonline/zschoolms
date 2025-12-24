/**
 * Response utility functions for consistent API responses
 */

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

// Aliases for backward compatibility
export const sendSuccess = successResponse;
export const sendError = errorResponse;

export const sendCreated = (res, data, message = 'Created successfully') => {
  return successResponse(res, data, message, 201);
};

export const sendNoContent = (res) => {
  return res.status(204).send();
};
