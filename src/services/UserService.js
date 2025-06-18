const UserRepository = require('../repositories/UserRepository');
const ApplicationError = require('../errors/ApplicationError');
const InsufficientFundsError = require('../errors/InsufficientFundsError');
const UserNotFoundError = require('../errors/UserNotFoundError');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Получает всех пользователей
   */
  async getAllUsers() {
    try {
      return await this.userRepository.findAll();
    } catch (error) {
      throw new ApplicationError('Failed to retrieve users', 500);
    }
  }

  /**
   * Получает пользователя по ID
   */
  async getUserById(userId) {
    this._validateUserId(userId);

    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundError(userId);
      }
      return user;
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw error;
      }
      throw new ApplicationError('Failed to retrieve user', 500);
    }
  }

  /**
   * Обновляет баланс пользователя
   */
  async updateBalance(userId, amount) {
    this._validateUserId(userId);
    this._validateAmount(amount);

    try {
      return await this.userRepository.updateBalance(userId, amount);
    } catch (error) {
      if (error instanceof InsufficientFundsError || error instanceof UserNotFoundError) {
        throw error;
      }
      throw new ApplicationError('Failed to update balance', 500);
    }
  }

  /**
   * Валидирует ID пользователя
   */
  _validateUserId(userId) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ApplicationError('User ID must be a positive integer', 400);
    }
  }

  /**
   * Валидирует сумму
   */
  _validateAmount(amount) {
    if (!Number.isInteger(amount)) {
      throw new ApplicationError('Amount must be an integer', 400);
    }
  }
}

module.exports = UserService;