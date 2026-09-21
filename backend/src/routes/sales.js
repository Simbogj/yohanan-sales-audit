const express = require('express');
const { body } = require('express-validator');
const {
  createSale,
  getSales,
  getTodaySales,
  getMySales,
  getSaleById,
} = require('../controllers/salesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken);

// These must be before /:id to avoid being captured as IDs
router.get('/today', requireRole('OWNER'), getTodaySales);
router.get('/my-sales', getMySales);

router.get('/', requireRole('OWNER'), getSales);
router.get('/:id', getSaleById);

router.post(
  '/',
  requireRole('WAITER'),
  [
    body('product_id').isUUID().withMessage('Valid product_id is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  validate,
  createSale
);

module.exports = router;
