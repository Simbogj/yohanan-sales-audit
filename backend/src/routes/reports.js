const express = require('express');
const { getDailyReport, getSalesByWaiter, getSalesByProduct, getSummary, getProfitReport } = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRole('OWNER'));

router.get('/daily', getDailyReport);
router.get('/sales-by-waiter', getSalesByWaiter);
router.get('/sales-by-product', getSalesByProduct);
router.get('/summary', getSummary);
router.get('/profit', getProfitReport);

module.exports = router;
