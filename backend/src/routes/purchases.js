const express = require('express');
const { body } = require('express-validator');
const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} = require('../controllers/purchaseController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All purchases routes are OWNER-only
router.use(authenticateToken, requireRole('OWNER'));

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);

router.post(
  '/',
  [
    body('item_name').trim().notEmpty().withMessage('item_name is required'),
    body('quantity').isFloat({ min: 0.001 }).withMessage('quantity must be a positive number'),
    body('unit_cost').isFloat({ min: 0 }).withMessage('unit_cost must be a non-negative number'),
  ],
  validate,
  createPurchase
);

router.put(
  '/:id',
  [
    body('item_name').optional().trim().notEmpty(),
    body('quantity').optional().isFloat({ min: 0.001 }),
    body('unit_cost').optional().isFloat({ min: 0 }),
  ],
  validate,
  updatePurchase
);

router.delete('/:id', deletePurchase);

module.exports = router;
