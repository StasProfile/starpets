const { RETRY_CONFIG } = require('./consts');
const isRetryableError = require('./isRetryableError');
const calculateRetryDelay = require('./calculateRetryDelay');

/**
 * Выполняет функцию с ретраями
 */
const executeWithRetries = async (operation, maxRetries = RETRY_CONFIG.MAX_RETRIES) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Если это последняя попытка или ошибка не ретрабельная, выбрасываем ошибку
      if (attempt === maxRetries - 1 || !isRetryableError(error)) {
        throw error;
      }

      // Вычисляем задержку и ждем
      const delay = calculateRetryDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = executeWithRetries;