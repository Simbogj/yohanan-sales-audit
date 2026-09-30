const express = require('express');
const { body } = require('express-validator');
const {
  createOtherSale,
  getOtherSales,
  getOtherSaleById,
  updateOtherSaleStatus,
  deleteOtherSale,
} = require('../controllers/otherSaleController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken);

// Both roles can list / view; controller filters by role
router.get('/', getOtherSales);
router.get('/:id', getOtherSaleById);

// Both roles can create an other-sale
router.post(
  '/',
  [
    body('item_name').trim().notEmpty().withMessage('item_name is required'),
    body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
    body('unit_price').isFloat({ min: 0 }).withMessage('unit_price must be a non-negative number'),
  ],
  validate,
  createOtherSale
);

// Only owner can update status or delete
router.patch('/:id/status', requireRole('OWNER'), updateOtherSaleStatus);
router.delete('/:id', requireRole('OWNER'), deleteOtherSale);

module.exports = router;
