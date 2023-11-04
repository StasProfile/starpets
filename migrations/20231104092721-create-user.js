"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      balance: {
        type: Sequelize.INTEGER,
      },
    });

    await queryInterface.addConstraint("Users", {
      fields: ["balance"],
      type: "check",
      where: {
        balance: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.bulkInsert("Users", [
      {
        id: 1,
        balance: 10000,
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  },
};
