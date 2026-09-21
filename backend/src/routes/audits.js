const express = require('express');
const { body } = require('express-validator');
const {
  verifySale,
  disputeSale,
  getAuditRecords,
  getAuditBySaleId,
} = require('../controllers/auditController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All audit routes require OWNER role
router.use(authenticateToken, requireRole('OWNER'));

router.get('/', getAuditRecords);
router.get('/:saleId', getAuditBySaleId);

router.post(
  '/:saleId/verify',
  [body('note').optional().isString().withMessage('Note must be a string')],
  validate,
  verifySale
);

router.post(
  '/:saleId/dispute',
  [body('note').notEmpty().withMessage('A reason note is required when disputing a sale')],
  validate,
  disputeSale
);

module.exports = router;
