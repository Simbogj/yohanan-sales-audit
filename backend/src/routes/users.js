const express = require('express');
const { body } = require('express-validator');
const { getUsers, createUser, updateUser, updateUserStatus } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All user management routes require OWNER
router.use(authenticateToken, requireRole('OWNER'));

router.get('/', getUsers);

router.post(
  '/',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('username').trim().notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['OWNER', 'WAITER']).withMessage('Role must be OWNER or WAITER'),
  ],
  validate,
  createUser
);

router.put(
  '/:id',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('role').isIn(['OWNER', 'WAITER']).withMessage('Role must be OWNER or WAITER'),
  ],
  validate,
  updateUser
);

router.patch(
  '/:id/status',
  [body('active').isBoolean().withMessage('active must be a boolean')],
  validate,
  updateUserStatus
);

module.exports = router;
