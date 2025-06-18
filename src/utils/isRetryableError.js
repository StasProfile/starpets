const { RETRYABLE_ERROR_CODES, RETRYABLE_NETWORK_ERRORS } = require('./consts');

const isRetryableError = (error) => {
  // Проверяем коды ошибок PostgreSQL
  if (error.original && RETRYABLE_ERROR_CODES.includes(error.original.code)) {
    return true;
  }

  // Проверяем сетевые ошибки
  if (error.code && RETRYABLE_NETWORK_ERRORS.includes(error.code)) {
    return true;
  }

  const errorMessage = error.message.toLowerCase();
  const retryableKeywords = [
    'deadlock',
    'lock',
    'timeout',
    'connection',
    'econnreset',
    'epipe',
    'enetunreach',
    'econnrefused',
    'enotfound',
    'etimedout'
  ];

  return retryableKeywords.some(keyword => errorMessage.includes(keyword));
}

module.exports = isRetryableError;