const express = require('express');
const { body } = require('express-validator');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All expenses routes are OWNER-only
router.use(authenticateToken, requireRole('OWNER'));

router.get('/', getExpenses);
router.get('/:id', getExpenseById);

router.post(
  '/',
  [
    body('description').trim().notEmpty().withMessage('description is required'),
    body('amount').isFloat({ min: 0 }).withMessage('amount must be a non-negative number'),
  ],
  validate,
  createExpense
);

router.put(
  '/:id',
  [
    body('description').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ min: 0 }),
  ],
  validate,
  updateExpense
);

router.delete('/:id', deleteExpense);

module.exports = router;
