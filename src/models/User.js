"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // определение ассоциаций
    }

    // Метод для проверки возможности списания
    canWithdraw(amount) {
      return this.balance >= amount;
    }
  }
  
  User.init(
    {
      balance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: {
            args: [0],
            msg: "Balance cannot be negative"
          }
        }
      }
    },
    {
      timestamps: false,
      sequelize,
      modelName: "User",
    }
  );
  
  return User;
};
