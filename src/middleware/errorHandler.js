/**
 * Error Handler Middleware
 * 
 * Provides consistent error handling across the application
 */

/**
 * Custom error handler middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Determine status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
  }
  
  // Format error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

/**
 * Custom error classes
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message || 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message || 'Forbidden');
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message || 'Resource not found');
    this.name = 'NotFoundError';
  }
}

// Export custom error classes
exports.ValidationError = ValidationError;
exports.UnauthorizedError = UnauthorizedError;
exports.ForbiddenError = ForbiddenError;
exports.NotFoundError = NotFoundError;
