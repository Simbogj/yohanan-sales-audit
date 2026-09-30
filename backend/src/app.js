const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const auditRoutes = require('./routes/audits');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const dailyAuditRoutes = require('./routes/dailyAudit');
const purchaseRoutes = require('./routes/purchases');
const expenseRoutes = require('./routes/expenses');
const otherSalesRoutes = require('./routes/otherSales');
const unpaidSalesRoutes = require('./routes/unpaidSales');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/daily-audit', dailyAuditRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/other-sales', otherSalesRoutes);
app.use('/api/unpaid-sales', unpaidSalesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Yohanan Sales Audit API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
