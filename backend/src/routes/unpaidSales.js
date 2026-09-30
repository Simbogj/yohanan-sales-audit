const express = require('express');
const { body } = require('express-validator');
const {
  createUnpaidSale,
  getUnpaidSales,
  getUnpaidSaleById,
  markPaid,
  updateUnpaidSale,
  deleteUnpaidSale,
} = require('../controllers/unpaidSaleController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken);

// Both roles can list, view, and create
router.get('/', getUnpaidSales);
router.get('/:id', getUnpaidSaleById);

router.post(
  '/',
  [
    body('customer_name').trim().notEmpty().withMessage('customer_name is required'),
    body('amount_owed').isFloat({ min: 0 }).withMessage('amount_owed must be a non-negative number'),
  ],
  validate,
  createUnpaidSale
);

// Owner-only: mark paid, update, delete
router.patch('/:id/mark-paid', requireRole('OWNER'), markPaid);
router.put('/:id', requireRole('OWNER'), updateUnpaidSale);
router.delete('/:id', requireRole('OWNER'), deleteUnpaidSale);

module.exports = router;
