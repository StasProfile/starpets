const { SchedulerJob, SchedulerHistory, SchedulerInstance } = require('../models');
const { Sequelize } = require('sequelize');
const { calculateNextRun, validateCronExpression } = require('../utils/cronUtils');

class SchedulerController {
  /**
   * Получение списка всех задач с информацией о выполнении
   */
  async getJobs(req, res) {
    try {
      // Получаем все задачи
      const jobs = await SchedulerJob.findAll({
        order: [['name', 'ASC']]
      });

      // Получаем активные экземпляры
      const activeInstances = await SchedulerInstance.findAll({
        where: {
          last_heartbeat: {
            [Sequelize.Op.gte]: new Date(Date.now() - 120 * 1000) // Активные за последние 2 минуты
          }
        },
        order: [['last_heartbeat', 'DESC']]
      });

      // Получаем текущие выполняющиеся задачи
      const runningJobs = await SchedulerHistory.findAll({
        where: {
          status: 'running',
          finished_at: null
        },
        include: [
          {
            model: SchedulerJob,
            as: 'job',
            attributes: ['name', 'handler', 'interval']
          },
          {
            model: SchedulerInstance,
            as: 'instance',
            attributes: ['id', 'last_heartbeat']
          }
        ],
        order: [['started_at', 'DESC']]
      });

      // Формируем ответ
      const jobsWithStatus = jobs.map(job => {
        const runningJob = runningJobs.find(rj => rj.job_id === job.id);
        const isRunning = !!runningJob;
        const runningInstance = runningJob ? runningJob.instance : null;
        const runningTime = runningJob ?
          Math.floor((Date.now() - new Date(runningJob.started_at).getTime()) / 1000) : null;

        return {
          id: job.id,
          name: job.name,
          handler: job.handler,
          interval: job.interval,
          is_active: job.is_active,
          next_run: job.next_run,
          is_running: isRunning,
          running_instance: runningInstance ? {
            id: runningInstance.id,
            last_heartbeat: runningInstance.last_heartbeat
          } : null,
          running_time_seconds: runningTime,
          status: isRunning ? 'running' : 'waiting'
        };
      });

      // Получаем статистику по последним выполнениям
      const recentHistory = await SchedulerHistory.findAll({
        where: {
          finished_at: {
            [Sequelize.Op.not]: null
          }
        },
        include: [
          {
            model: SchedulerJob,
            as: 'job',
            attributes: ['name']
          }
        ],
        order: [['finished_at', 'DESC']],
        limit: 50
      });

      const response = {
        jobs: jobsWithStatus,
        active_instances: activeInstances.map(instance => ({
          id: instance.id,
          last_heartbeat: instance.last_heartbeat,
          is_active: true
        })),
        recent_history: recentHistory.map(record => ({
          id: record.id,
          job_name: record.job.name,
          instance_id: record.instance_id,
          started_at: record.started_at,
          finished_at: record.finished_at,
          status: record.status,
          error_message: record.error_message,
          duration_seconds: record.finished_at ? 
            Math.floor((new Date(record.finished_at).getTime() - new Date(record.started_at).getTime()) / 1000) : null
        })),
        summary: {
          total_jobs: jobs.length,
          active_jobs: jobs.filter(j => j.is_active).length,
          running_jobs: runningJobs.length,
          active_instances: activeInstances.length
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting jobs:', error);
      res.status(500).json({
        error: {
          message: 'Failed to get jobs information',
          details: error.message
        }
      });
    }
  }

  /**
   * Создание новой задачи
   */
  async createJob(req, res) {
    try {
      const { name, handler, interval, is_active = true } = req.body;

      // Валидация
      if (!name || !handler || !interval) {
        return res.status(400).json({
          error: {
            message: 'Name, handler and interval are required'
          }
        });
      }

      // Проверка cron выражения
      const validation = validateCronExpression(interval);
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            message: 'Invalid cron expression',
            details: validation.error
          }
        });
      }

      // Проверка уникальности имени
      const existingJob = await SchedulerJob.findOne({
        where: { name }
      });

      if (existingJob) {
        return res.status(409).json({
          error: {
            message: 'Job with this name already exists'
          }
        });
      }

      // Вычисляем время следующего запуска
      const nextRun = calculateNextRun(interval);

      // Создаем задачу
      const job = await SchedulerJob.create({
        name,
        handler,
        interval,
        is_active,
        next_run: nextRun
      });

      res.status(201).json({
        message: 'Job created successfully',
        job: {
          id: job.id,
          name: job.name,
          handler: job.handler,
          interval: job.interval,
          is_active: job.is_active,
          next_run: job.next_run
        }
      });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create job',
          details: error.message
        }
      });
    }
  }

  /**
   * Обновление задачи
   */
  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const { name, handler, interval, is_active } = req.body;

      const job = await SchedulerJob.findByPk(id);
      if (!job) {
        return res.status(404).json({
          error: {
            message: 'Job not found'
          }
        });
      }

      // Валидация cron выражения если передан
      if (interval) {
        const validation = validateCronExpression(interval);
        if (!validation.valid) {
          return res.status(400).json({
            error: {
              message: 'Invalid cron expression',
              details: validation.error
            }
          });
        }
      }

      // Обновляем поля
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (handler !== undefined) updateData.handler = handler;
      if (interval !== undefined) updateData.interval = interval;
      if (is_active !== undefined) updateData.is_active = is_active;

      // Если изменился интервал, пересчитываем время следующего запуска
      if (interval && interval !== job.interval) {
        updateData.next_run = calculateNextRun(interval);
      }

      await job.update(updateData);

      res.json({
        message: 'Job updated successfully',
        job: {
          id: job.id,
          name: job.name,
          handler: job.handler,
          interval: job.interval,
          is_active: job.is_active,
          next_run: job.next_run
        }
      });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update job',
          details: error.message
        }
      });
    }
  }

  /**
   * Удаление задачи
   */
  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const job = await SchedulerJob.findByPk(id);
      if (!job) {
        return res.status(404).json({
          error: {
            message: 'Job not found'
          }
        });
      }

      // Проверяем, не выполняется ли задача сейчас
      const runningJob = await SchedulerHistory.findOne({
        where: {
          job_id: id,
          status: 'running',
          finished_at: null
        }
      });

      if (runningJob) {
        return res.status(400).json({
          error: {
            message: 'Cannot delete job that is currently running'
          }
        });
      }

      await job.destroy();

      res.json({
        message: 'Job deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({
        error: {
          message: 'Failed to delete job',
          details: error.message
        }
      });
    }
  }

  /**
   * Получение истории выполнения задачи
   */
  async getJobHistory(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const job = await SchedulerJob.findByPk(id);
      if (!job) {
        return res.status(404).json({
          error: {
            message: 'Job not found'
          }
        });
      }

      const history = await SchedulerHistory.findAndCountAll({
        where: { job_id: id },
        include: [
          {
            model: SchedulerInstance,
            as: 'instance',
            attributes: ['id', 'last_heartbeat']
          }
        ],
        order: [['started_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const historyWithDuration = history.rows.map(record => ({
        id: record.id,
        instance_id: record.instance_id,
        started_at: record.started_at,
        finished_at: record.finished_at,
        status: record.status,
        error_message: record.error_message,
        duration_seconds: record.finished_at ? 
          Math.floor((new Date(record.finished_at).getTime() - new Date(record.started_at).getTime()) / 1000) : null,
        instance: record.instance ? {
          id: record.instance.id,
          last_heartbeat: record.instance.last_heartbeat
        } : null
      }));

      res.json({
        job: {
          id: job.id,
          name: job.name,
          handler: job.handler,
          interval: job.interval,
          is_active: job.is_active
        },
        history: historyWithDuration,
        pagination: {
          total: history.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil(history.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting job history:', error);
      res.status(500).json({
        error: {
          message: 'Failed to get job history',
          details: error.message
        }
      });
    }
  }
}

module.exports = SchedulerController; 