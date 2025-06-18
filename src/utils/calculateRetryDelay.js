const { RETRY_CONFIG } = require('./consts');

/**
 * Вычисляет задержку для ретрая с экспоненциальным откатом
 */
const calculateRetryDelay = (attempt) => {
  const delay = Math.min(
    RETRY_CONFIG.MAX_DELAY,
    RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt) + Math.random() * 5
  );
  return delay;
}

module.exports = calculateRetryDelay;