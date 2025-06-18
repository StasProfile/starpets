'use strict';

module.exports = (sequelize, DataTypes) => {
  const SchedulerJob = sequelize.define('SchedulerJob', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    handler: {
      type: DataTypes.STRING,
      allowNull: false
    },
    interval: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Cron expression (e.g., "0 */5 * * * *" for every 5 minutes)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    next_run: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'SchedulerJobs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  SchedulerJob.associate = function(models) {
    SchedulerJob.hasMany(models.SchedulerHistory, {
      foreignKey: 'job_id',
      as: 'history'
    });
  };

  return SchedulerJob;
}; 