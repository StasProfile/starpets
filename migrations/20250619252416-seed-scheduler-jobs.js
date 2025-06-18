'use strict';

/**
 * Простая функция для вычисления следующего времени выполнения
 * Поддерживает базовые cron выражения
 */
function getNextRunTime(cronExpression) {
  const now = new Date();
  const parts = cronExpression.split(' ');
  
  if (parts.length !== 6) {
    throw new Error('Invalid cron expression format');
  }
  
  const [second, minute, hour, day, month, dayOfWeek] = parts;
  
  // Простая логика для вычисления следующего времени
  let nextRun = new Date(now);
  
  // Если это "каждые N минут"
  if (minute.startsWith('*/')) {
    const interval = parseInt(minute.substring(2));
    nextRun.setMinutes(Math.ceil(nextRun.getMinutes() / interval) * interval);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
  }
  // Если это "каждые N часов"
  else if (hour.startsWith('*/')) {
    const interval = parseInt(hour.substring(2));
    nextRun.setHours(Math.ceil(nextRun.getHours() / interval) * interval);
    nextRun.setMinutes(0);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
  }
  // Если это конкретное время дня
  else if (hour !== '*' && minute !== '*') {
    nextRun.setHours(parseInt(hour));
    nextRun.setMinutes(parseInt(minute));
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
    
    // Если время уже прошло сегодня, переносим на завтра
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  }
  else {
    // По умолчанию через 1 час
    nextRun.setHours(nextRun.getHours() + 1);
    nextRun.setMinutes(0);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
  }
  
  return nextRun;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Тестовые задачи с разными интервалами
    const jobs = [
      {
        name: 'Data Cleanup',
        handler: 'cleanupData',
        interval: '0 0 */6 * * *', // Каждые 6 часов
        is_active: true,
        next_run: getNextRunTime('0 0 */6 * * *'),
        created_at: now,
        updated_at: now
      },
      {
        name: 'Generate Reports',
        handler: 'generateReports',
        interval: '0 0 2 * * *', // Каждый день в 2:00
        is_active: true,
        next_run: getNextRunTime('0 0 2 * * *'),
        created_at: now,
        updated_at: now
      },
      {
        name: 'Create Backup',
        handler: 'createBackup',
        interval: '0 30 1 * * *', // Каждый день в 1:30
        is_active: true,
        next_run: getNextRunTime('0 30 1 * * *'),
        created_at: now,
        updated_at: now
      },
      {
        name: 'System Health Check',
        handler: 'checkHealth',
        interval: '0 */15 * * * *', // Каждые 15 минут
        is_active: true,
        next_run: getNextRunTime('0 */15 * * * *'),
        created_at: now,
        updated_at: now
      },
      {
        name: 'Sync Analytics',
        handler: 'syncAnalytics',
        interval: '0 0 */4 * * *', // Каждые 4 часа
        is_active: true,
        next_run: getNextRunTime('0 0 */4 * * *'),
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('SchedulerJobs', jobs);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('SchedulerJobs', {
      name: [
        'Data Cleanup',
        'Generate Reports',
        'Create Backup',
        'System Health Check',
        'Sync Analytics'
      ]
    });
  }
}; 