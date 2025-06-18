'use strict';

module.exports = (sequelize, DataTypes) => {
  const SchedulerInstance = sequelize.define('SchedulerInstance', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    last_heartbeat: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'SchedulerInstances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  SchedulerInstance.associate = function(models) {
    SchedulerInstance.hasMany(models.SchedulerHistory, {
      foreignKey: 'instance_id',
      as: 'history'
    });
  };

  return SchedulerInstance;
}; 