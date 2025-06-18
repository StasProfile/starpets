"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Таблица экземпляров приложений
    await queryInterface.createTable("SchedulerInstances", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      last_heartbeat: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Таблица задач
    await queryInterface.createTable("SchedulerJobs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      interval: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      handler: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      next_run: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Таблица истории выполнения задач
    await queryInterface.createTable("SchedulerHistory", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      job_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "SchedulerJobs",
          key: "id",
        },
      },
      instance_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "SchedulerInstances",
          key: "id",
        },
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      finished_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("running", "completed", "failed"),
        defaultValue: "running",
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем проверку для статуса задачи
    await queryInterface.addConstraint("SchedulerHistory", {
      fields: ["status"],
      type: "check",
      where: {
        status: {
          [Sequelize.Op.in]: ["running", "completed", "failed"],
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаление таблиц в правильном порядке (сначала дочерние)
    await queryInterface.dropTable("SchedulerHistory");
    await queryInterface.dropTable("SchedulerJobs");
    await queryInterface.dropTable("SchedulerInstances");
  },
};