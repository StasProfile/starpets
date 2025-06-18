const BaseError = require('./BaseError');

class UserNotFoundError extends BaseError {
  constructor(userId) {
    super(`User with id ${userId} not found`, 404, 'USER_NOT_FOUND');
    this.userId = userId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.userId
    };
  }
}

module.exports = UserNotFoundError;