const express = require('express');
const UserController = require('../controllers/UserController');

const router = express.Router();
const userController = new UserController();

/**
 * @route GET /users
 * @desc Получить всех пользователей
 * @access Public
 */
router.get('/', (req, res, next) => userController.getUsers(req, res, next));

/**
 * @route GET /users/:id
 * @desc Получить пользователя по ID
 * @access Public
 */
router.get('/:id', (req, res, next) => userController.getUserById(req, res, next));

/**
 * @route PATCH /users/balance
 * @desc Обновить баланс пользователя
 * @access Public
 */
router.patch('/balance', (req, res, next) => userController.updateBalance(req, res, next));

module.exports = router; 