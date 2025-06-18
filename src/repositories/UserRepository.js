const { sequelize } = require('../models');
const { User: UserModel } = require('../models');
const User = require('../domain/User');
const InsufficientFundsError = require('../errors/InsufficientFundsError');
const ApplicationError = require('../errors/ApplicationError');
const UserNotFoundError = require('../errors/UserNotFoundError');
const isRetryableError = require('../utils/isRetryableError');
const executeWithRetries = require('../utils/excecuteWithRetries');

class UserRepository {
  /**
   * Находит всех пользователей
   */
  async findAll() {
    const users = await UserModel.findAll();
    return users.map(user => User.fromDatabase(user));
  }

  /**
   * Находит пользователя по ID
   */
  async findById(id) {
    const user = await UserModel.findByPk(id);
    return user ? User.fromDatabase(user) : null;
  }

  /**
   * Обновляет баланс пользователя с ретраями
   */
  async updateBalance(userId, amount) {
    return executeWithRetries(() => this._updateBalanceInTransaction(userId, amount));
  }

  /**
   * Обновляет баланс в транзакции
   */
  async _updateBalanceInTransaction(userId, amount) {
    const transaction = await sequelize.transaction({
      timeout: 5000,
    });

    try {
      // Блокируем строку для обновления
      const user = await UserModel.findByPk(userId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!user) {
        throw new UserNotFoundError(userId);
      }

      // Проверяем достаточно ли средств
      if (user.balance + amount < 0) {
        throw new InsufficientFundsError(userId, Math.abs(amount), user.balance);
      }

      // Обновляем баланс
      const newBalance = user.balance + amount;
      await user.update({ balance: newBalance }, { transaction });

      // Фиксируем изменения
      await transaction.commit();

      return { id: userId, balance: newBalance };
    } catch (error) {
      // Откатываем транзакцию
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        // Игнорируем ошибки отката
      }

      // Пробрасываем бизнес-ошибки напрямую
      if (error instanceof UserNotFoundError || error instanceof InsufficientFundsError) {
        throw error;
      }

      // Пробрасываем ретрабельные ошибки для повторных попыток
      if (isRetryableError(error)) {
        throw error;
      }

      // Оборачиваем остальные ошибки
      throw new ApplicationError('Database operation failed', 500);
    }
  }
}

module.exports = UserRepository;