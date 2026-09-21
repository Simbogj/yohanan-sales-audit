const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
} = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const VALID_CATEGORIES = ['COFFEE', 'NON_COFFEE', 'BREAKFAST', 'FOOD', 'OTHER'];

const productValidation = [
  body('product_code').trim().notEmpty().withMessage('Product code is required'),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category')
    .notEmpty()
    .toUpperCase()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
];

// All product routes require authentication
router.use(authenticateToken);

router.get('/', getProducts);
router.get('/:id', getProductById);

// Owner only for write operations
router.post('/', requireRole('OWNER'), productValidation, validate, createProduct);
router.put('/:id', requireRole('OWNER'), productValidation, validate, updateProduct);
router.patch(
  '/:id/status',
  requireRole('OWNER'),
  [body('active').isBoolean().withMessage('active must be a boolean')],
  validate,
  updateProductStatus
);

module.exports = router;
