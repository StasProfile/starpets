const BaseError = require('../errors/BaseError');
const ApplicationError = require('../errors/ApplicationError');
const InsufficientFundsError = require('../errors/InsufficientFundsError');
const UserNotFoundError = require('../errors/UserNotFoundError');

/**
 * Обработчик ошибок приложения
 */
function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body
    });
  }

  if (err instanceof InsufficientFundsError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: 'Insufficient funds',
        details: {
          userId: err.userId,
          requestedAmount: err.requestedAmount,
          availableBalance: err.availableBalance
        }
      }
    });
  }

  if (err instanceof UserNotFoundError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: 'User not found',
        details: {
          userId: err.userId
        }
      }
    });
  }

  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  if (err.name === 'SequelizeConnectionError' ||
      err.name === 'SequelizeConnectionTimedOutError' ||
      err.name === 'SequelizeHostNotFoundError' ||
      err.name === 'SequelizeHostNotReachableError') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Database connection error'
      }
    });
  }

  if (err.code === 'ECONNRESET' ||
      err.code === 'EPIPE' ||
      err.code === 'ENOTFOUND' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network connection error'
      }
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    }
  });
}

module.exports = errorHandler;