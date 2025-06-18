const UserService = require('../services/UserService');
const ApplicationError = require('../errors/ApplicationError');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Получает всех пользователей
   */
  async getUsers(req, res, next) {
    try {
      const users = await this.userService.getAllUsers();
      res.json({
        success: true,
        data: users.map(user => user.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получает пользователя по ID
   */
  async getUserById(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      const user = await this.userService.getUserById(userId);

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновляет баланс пользователя
   */
  async updateBalance(req, res, next) {
    try {
      const { userId, amount } = req.body;

      // Валидация входных данных
      if (userId === undefined || amount === undefined) {
        throw new ApplicationError('Missing required fields: userId and amount', 400);
      }

      const updatedUser = await this.userService.updateBalance(userId, amount);

      res.json({
        success: true,
        message: 'Balance updated successfully',
        data: {
          id: updatedUser.id,
          balance: updatedUser.balance
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;