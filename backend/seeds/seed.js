/**
 * Seed runner - creates users with hashed passwords and products.
 * Run: node seeds/seed.js
 *
 * Development credentials:
 *   owner   / owner123
 *   hana    / waiter123
 *   sara    / waiter123
 *   abel    / waiter123
 *
 * CHANGE THESE PASSWORDS BEFORE PRODUCTION.
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../src/db/pool');

const SALT_ROUNDS = 12;

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Clearing existing data...');
    await client.query('TRUNCATE TABLE audit_records CASCADE');
    await client.query('TRUNCATE TABLE daily_audits CASCADE');
    await client.query('TRUNCATE TABLE sales CASCADE');
    await client.query('TRUNCATE TABLE products CASCADE');
    await client.query('TRUNCATE TABLE users CASCADE');

    console.log('Seeding users...');
    const ownerHash = await bcrypt.hash('owner123', SALT_ROUNDS);
    const waiterHash = await bcrypt.hash('waiter123', SALT_ROUNDS);

    await client.query(
      `INSERT INTO users (full_name, username, password_hash, role) VALUES
       ('Yohanan Owner', 'owner', $1, 'OWNER'),
       ('Hana Girma',    'hana',  $2, 'WAITER'),
       ('Sara Tadesse',  'sara',  $2, 'WAITER'),
       ('Abel Bekele',   'abel',  $2, 'WAITER')`,
      [ownerHash, waiterHash]
    );

    console.log('Seeding products...');
    await client.query(
      `INSERT INTO products (product_code, name, category, price) VALUES
       ('COF-001', 'Espresso',       'COFFEE',     60.00),
       ('COF-002', 'Steamed Coffee', 'COFFEE',     50.00),
       ('COF-003', 'Macchiato',      'COFFEE',     80.00),
       ('COF-004', 'Spris',          'COFFEE',     60.00),
       ('NCF-001', 'Milk',           'NON_COFFEE', 80.00),
       ('NCF-002', 'Tea',            'NON_COFFEE', 35.00),
       ('NCF-003', 'Ginger Tea',     'NON_COFFEE', 50.00),
       ('NCF-004', 'Peanut Tea',     'NON_COFFEE', 60.00),
       ('NCF-005', 'Green Tea',      'NON_COFFEE', 60.00),
       ('NCF-006', 'Soft Drink',     'NON_COFFEE', 80.00)`
    );

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully');
    console.log('\nDevelopment accounts:');
    console.log('  OWNER:  username=owner   password=owner123');
    console.log('  WAITER: username=hana    password=waiter123');
    console.log('  WAITER: username=sara    password=waiter123');
    console.log('  WAITER: username=abel    password=waiter123');
    console.log('\n⚠️  Change all passwords before deploying to production!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
