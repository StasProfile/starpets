const express = require('express');
const userRoutes = require('./routes/userRoutes');
const schedulerRoutes = require('./routes/schedulerRoutes');
const errorHandler = require('./middleware/errorHandler');
const { sequelize } = require('./models');
const DistributedScheduler = requite('./services/Scheduler.js');
const jobs = require('./jobs');

/**
 * Создает и настраивает Express приложение
 */
function createApp() {
  const app = express();

  app.use(express.json({
    limit: '1mb',
    strict: true 
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: '1mb'
  }));

  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  app.use('/users', userRoutes);
  app.use('/scheduler', schedulerRoutes);

  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    });
  });

  app.use(errorHandler);

  return app;
}

/**
 * Инициализирует базу данных
 */
async function initializeDatabase() {
  try {
    await sequelize.sync();
    console.log('Database connected and synchronized successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

/**
 * Инициализирует планировщик задач
 */
async function initializeScheduler() {
  try {
    const scheduler = new DistributedScheduler();

    // Регистрация обработчиков задач
    Object.entries(jobs).forEach(([name, handler]) => {
      scheduler.addJob(name, handler);
    });

    // Запуск планировщика
    await scheduler.start();
    
    // Сохраняем ссылку на планировщик для graceful shutdown
    global.scheduler = scheduler;
    
    console.log('Scheduler initialized successfully');
  } catch (error) {
    console.error('Failed to initialize scheduler:', error);
    process.exit(1);
  }
}

const app = createApp();

// Инициализация приложения
async function initializeApp() {
  await initializeDatabase();
  await initializeScheduler();
}

initializeApp();

module.exports = app;