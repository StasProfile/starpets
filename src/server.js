require('dotenv').config();
const app = require('./app');

/**
 * Конфигурация сервера
 */
const SERVER_CONFIG = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  maxConnections: 10000,
  keepAliveTimeout: 30000,
  headersTimeout: 31000
};

/**
 * Создает и запускает HTTP сервер
 */
function createServer() {
  const server = app.listen(SERVER_CONFIG.port, () => {
    console.log(`🚀 Server is running in ${SERVER_CONFIG.environment} mode on port ${SERVER_CONFIG.port}`);
    console.log(`📊 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
  });

  server.maxConnections = SERVER_CONFIG.maxConnections;
  server.keepAliveTimeout = SERVER_CONFIG.keepAliveTimeout;
  server.headersTimeout = SERVER_CONFIG.headersTimeout;

  return server;
}

/**
 * Настраивает обработку сигналов завершения
 */
function setupGracefulShutdown(server) {
  const gracefulShutdown = async (signal) => {
    console.log(`\n📴 ${signal} received, shutting down gracefully...`);

    // Останавливаем планировщик если он запущен
    if (global.scheduler) {
      console.log('🛑 Stopping scheduler...');
      await global.scheduler.stop();
    }

    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * Настраивает обработку необработанных ошибок
 */
function setupUnhandledErrorHandling() {
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

const server = createServer();

setupGracefulShutdown(server);

setupUnhandledErrorHandling();