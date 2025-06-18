'use strict';

module.exports = (sequelize, DataTypes) => {
  const SchedulerHistory = sequelize.define('SchedulerHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    instance_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    finished_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('running', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'running'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'SchedulerHistory',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  SchedulerHistory.associate = function(models) {
    SchedulerHistory.belongsTo(models.SchedulerJob, {
      foreignKey: 'job_id',
      as: 'job'
    });
    SchedulerHistory.belongsTo(models.SchedulerInstance, {
      foreignKey: 'instance_id',
      as: 'instance'
    });
  };

  return SchedulerHistory;
};