const { CronExpressionParser } = require('cron-parser');

/**
 * Безопасная функция для вычисления следующего времени выполнения
 */
function calculateNextRun(cronExpression) {
  try {
    const interval = CronExpressionParser.parse(cronExpression);
    return interval.next().toDate();
  } catch (error) {
    console.error('❌ Error parsing cron expression:', cronExpression, error.message);
    
    // Fallback: добавляем 1 час к текущему времени
    const fallbackTime = new Date();
    fallbackTime.setHours(fallbackTime.getHours() + 1);
    fallbackTime.setMinutes(0);
    fallbackTime.setSeconds(0);
    fallbackTime.setMilliseconds(0);
    
    console.log(`⚠️  Using fallback time: ${fallbackTime}`);
    return fallbackTime;
  }
}

/**
 * Валидация cron выражения
 */
function validateCronExpression(cronExpression) {
  try {
    CronExpressionParser.parse(cronExpression);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Получение описания cron выражения
 */
function getCronDescription(cronExpression) {
  try {
    const interval = CronExpressionParser.parse(cronExpression);
    return interval.stringify();
  } catch (error) {
    return 'Invalid cron expression';
  }
}

module.exports = {
  calculateNextRun,
  validateCronExpression,
  getCronDescription
}; 