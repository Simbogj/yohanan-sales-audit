const express = require('express');
const { body } = require('express-validator');
const { closeDay, getDailyAuditStatus } = require('../controllers/dailyAuditController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken, requireRole('OWNER'));

router.get('/', getDailyAuditStatus);
router.post(
  '/close',
  [body('date').optional().isDate().withMessage('date must be a valid date (YYYY-MM-DD)')],
  validate,
  closeDay
);

module.exports = router;
