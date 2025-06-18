const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');
const { calculateNextRun } = require('../utils/cronUtils');
const models = require('../models');

class DistributedScheduler {
  constructor() {
    this.instanceId = uuidv4();
    this.jobs = {};
    this.heartbeatInterval = null;
    this.schedulerInterval = null;
    this.isRunning = false;
  }

  /**
   * Запуск планировщика
   */
  async start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log(`🚀 Starting distributed scheduler on instance ${this.instanceId}`);
    
    try {
      // Регистрация экземпляра
      await this.registerInstance();
      
      // Запуск периодических задач
      this.heartbeatInterval = setInterval(
        () => this.updateHeartbeat(), 
        30 * 1000 // 30 секунд
      );
      
      this.schedulerInterval = setInterval(
        () => this.runScheduler(),
        15 * 1000 // 15 секунд
      );
      
      this.isRunning = true;
      
      // Очистка при завершении
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());
      
      console.log('✅ Scheduler started successfully');
    } catch (error) {
      console.error('❌ Failed to start scheduler:', error);
      throw error;
    }
  }

  /**
   * Остановка планировщика
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log(`🛑 Stopping scheduler instance ${this.instanceId}`);
    
    try {
      // Остановка интервалов
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      if (this.schedulerInterval) {
        clearInterval(this.schedulerInterval);
        this.schedulerInterval = null;
      }
      
      // Освобождение всех задач текущего экземпляра
      await models.SchedulerHistory.update(
        { 
          finished_at: new Date(),
          status: 'failed',
          error_message: 'Instance stopped'
        },
        { 
          where: {
            instance_id: this.instanceId,
            finished_at: null
          }
        }
      );
      
      // Удаление экземпляра
      await models.SchedulerInstance.destroy({
        where: { id: this.instanceId }
      });
      
      this.isRunning = false;
      console.log('✅ Scheduler stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping scheduler:', error);
    }
  }

  /**
   * Регистрация экземпляра в базе данных
   */
  async registerInstance() {
    const [instance] = await models.SchedulerInstance.upsert({
      id: this.instanceId,
      last_heartbeat: new Date()
    });
    
    console.log(`📝 Registered instance ${this.instanceId}`);
    return instance;
  }

  /**
   * Обновление heartbeat экземпляра
   */
  async updateHeartbeat() {
    try {
      await models.SchedulerInstance.update(
        { last_heartbeat: new Date() },
        { where: { id: this.instanceId } }
      );
      
      // Очистка мертвых экземпляров (более 2 минут без heartbeat)
      const twoMinutesAgo = new Date(Date.now() - 120 * 1000);
      const deadInstances = await models.SchedulerInstance.destroy({
        where: {
          last_heartbeat: { [Sequelize.Op.lt]: twoMinutesAgo }
        }
      });
      
      if (deadInstances > 0) {
        console.log(`🧹 Cleaned up ${deadInstances} dead instances`);
      }
    } catch (error) {
      console.error('❌ Error updating heartbeat:', error);
    }
  }

  /**
   * Добавление обработчика задачи
   */
  addJob(name, handler) {
    this.jobs[name] = handler;
    console.log(`📋 Registered job handler: ${name}`);
  }

  /**
   * Основной цикл планировщика
   */
  async runScheduler() {
    if (!this.isRunning) return;
    
    const now = new Date();
    
    try {
      // Поиск задач для выполнения
      const jobsToRun = await models.SchedulerJob.findAll({
        where: {
          next_run: { [Sequelize.Op.lte]: now },
          is_active: true
        }
      });
      
      if (jobsToRun.length > 0) {
        console.log(`🔍 Found ${jobsToRun.length} jobs to run`);
      }
      
      const MAX_JOBS_PER_CYCLE = 1;
      let jobsTaken = 0;
      for (const job of jobsToRun) {
        if (jobsTaken >= MAX_JOBS_PER_CYCLE) break;
        // Случайная задержка 0-200 мс
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        
        // Попытка захватить задачу с помощью advisory lock
        const lockId = `job-${job.id}`;
        const [lockResult] = await models.sequelize.query(
          `SELECT pg_try_advisory_lock(hashtext(:lockId)) as locked`,
          { 
            replacements: { lockId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        if (lockResult.locked) {
          jobsTaken++;
          console.log(`🔒 Locked job: ${job.name}`);
          
          // Запуск задачи в фоне
          this.executeJob(job);
          
          // Обновление времени следующего запуска
          try {
            const nextRun = calculateNextRun(job.interval);
            await job.update({ next_run: nextRun });
            console.log(`⏰ Next run for ${job.name}: ${nextRun}`);
          } catch (error) {
            console.error(`❌ Error calculating next run for ${job.name}:`, error);
          }
        } else {
          console.log(`🔓 Job ${job.name} is already running on another instance`);
        }
      }
    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  }

  /**
   * Выполнение задачи
   */
  async executeJob(job) {
    console.log(`▶️  Starting job: ${job.name}`);
    
    const history = await models.SchedulerHistory.create({
      job_id: job.id,
      instance_id: this.instanceId,
      started_at: new Date(),
      status: 'running'
    });
    
    try {
      const jobHandler = this.jobs[job.handler];
      if (!jobHandler) {
        throw new Error(`Handler ${job.handler} not found`);
      }
      
      // Запуск обработчика с минимальным временем выполнения 2 минуты
      await Promise.all([
        jobHandler(),
        new Promise(resolve => setTimeout(resolve, 120 * 1000)) // 2 минуты
      ]);
      
      await history.update({
        finished_at: new Date(),
        status: 'completed'
      });
      
      console.log(`✅ Job ${job.name} completed successfully`);
    } catch (error) {
      console.error(`❌ Job ${job.name} failed:`, error);
      
      await history.update({
        finished_at: new Date(),
        status: 'failed',
        error_message: error.message
      });
    } finally {
      // Освобождение блокировки
      try {
        const lockId = `job-${job.id}`;
        await models.sequelize.query(
          `SELECT pg_advisory_unlock(hashtext(:lockId))`,
          { replacements: { lockId } }
        );
        console.log(`🔓 Unlocked job: ${job.name}`);
      } catch (unlockError) {
        console.error(`❌ Error unlocking job ${job.name}:`, unlockError);
      }
    }
  }

  /**
   * Получение информации о текущем экземпляре
   */
  getInstanceInfo() {
    return {
      instanceId: this.instanceId,
      isRunning: this.isRunning,
      registeredJobs: Object.keys(this.jobs)
    };
  }
}

module.exports = DistributedScheduler;