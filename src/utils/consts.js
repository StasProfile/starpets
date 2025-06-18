// Константы для конфигурации
const RETRY_CONFIG = {
  MAX_RETRIES: 10,
  BASE_DELAY: 2,
  MAX_DELAY: 100,
  BACKOFF_MULTIPLIER: 1.5
};

// Коды ошибок PostgreSQL для ретраев
const RETRYABLE_ERROR_CODES = [
  '40P01', // deadlock detected
  '55P03', // lock_not_available
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03'  // cannot_connect_now
];

// Сетевые ошибки для ретраев
const RETRYABLE_NETWORK_ERRORS = [
  'ECONNRESET',
  'EPIPE',
  'ENOTFOUND',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNABORTED',
  'ENETUNREACH'
];

module.exports = {
  RETRY_CONFIG,
  RETRYABLE_ERROR_CODES,
  RETRYABLE_NETWORK_ERRORS
};