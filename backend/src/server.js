require('dotenv').config();
const app = require('./app');
const { pool } = require('./db/pool');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test DB connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified');

    app.listen(PORT, () => {
      console.log(`🚀 Yohanan Sales Audit API running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
