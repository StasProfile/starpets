const BaseError = require('./BaseError');

class ApplicationError extends BaseError {
  constructor(message, statusCode = 500) {
    super(message, statusCode, 'APPLICATION_ERROR');
  }
}

module.exports = ApplicationError;