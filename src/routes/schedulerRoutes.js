const express = require('express');
const SchedulerController = require('../controllers/SchedulerController');

const router = express.Router();
const schedulerController = new SchedulerController();

/**
 * GET /scheduler/jobs
 * Получение списка всех задач с информацией о выполнении
 */
router.get('/jobs', schedulerController.getJobs.bind(schedulerController));

/**
 * POST /scheduler/jobs
 * Создание новой задачи
 */
router.post('/jobs', schedulerController.createJob.bind(schedulerController));

/**
 * PUT /scheduler/jobs/:id
 * Обновление задачи
 */
router.put('/jobs/:id', schedulerController.updateJob.bind(schedulerController));

/**
 * DELETE /scheduler/jobs/:id
 * Удаление задачи
 */
router.delete('/jobs/:id', schedulerController.deleteJob.bind(schedulerController));

/**
 * GET /scheduler/jobs/:id/history
 * Получение истории выполнения задачи
 */
router.get('/jobs/:id/history', schedulerController.getJobHistory.bind(schedulerController));

module.exports = router;