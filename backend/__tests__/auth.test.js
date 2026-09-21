/**
 * Auth & Business Rule Tests
 * Requires a running PostgreSQL test database.
 * Set TEST_DATABASE_URL in your .env or environment.
 */
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { pool, query } = require('../src/db/pool');

// Override DB URL for tests if provided
beforeAll(async () => {
  // Ensure test tables exist and are clean
  await query(`
    TRUNCATE TABLE audit_records CASCADE;
    TRUNCATE TABLE daily_audits CASCADE;
    TRUNCATE TABLE sales CASCADE;
    TRUNCATE TABLE products CASCADE;
    TRUNCATE TABLE users CASCADE;
  `);

  const ownerHash = await bcrypt.hash('owner123', 10);
  const waiterHash = await bcrypt.hash('waiter123', 10);

  await query(`
    INSERT INTO users (full_name, username, password_hash, role, active) VALUES
    ('Test Owner',   'testowner',   $1, 'OWNER',  TRUE),
    ('Test Waiter1', 'testwaiter1', $2, 'WAITER', TRUE),
    ('Test Waiter2', 'testwaiter2', $2, 'WAITER', TRUE),
    ('Inactive User','inactive',    $2, 'WAITER', FALSE)
  `, [ownerHash, waiterHash]);

  await query(`
    INSERT INTO products (product_code, name, category, price, active) VALUES
    ('T-001', 'Test Coffee',    'COFFEE', 80.00, TRUE),
    ('T-002', 'Inactive Drink', 'COFFEE', 50.00, FALSE)
  `);
});

afterAll(async () => {
  await pool.end();
});

// ─── Login Tests ─────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('valid owner login returns token and role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testowner', password: 'owner123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('OWNER');
  });

  test('valid waiter login returns token and role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testwaiter1', password: 'waiter123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('WAITER');
  });

  test('invalid password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testowner', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('non-existent user returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'password' });

    expect(res.status).toBe(401);
  });

  test('inactive user cannot login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'inactive', password: 'waiter123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

// ─── Sales Tests ─────────────────────────────────────────────────────────────

describe('POST /api/sales', () => {
  let waiter1Token;
  let waiter2Token;
  let ownerToken;
  let activeProductId;
  let inactiveProductId;
  let createdSaleId;

  beforeAll(async () => {
    const w1 = await request(app).post('/api/auth/login').send({ username: 'testwaiter1', password: 'waiter123' });
    waiter1Token = w1.body.data.token;

    const w2 = await request(app).post('/api/auth/login').send({ username: 'testwaiter2', password: 'waiter123' });
    waiter2Token = w2.body.data.token;

    const o = await request(app).post('/api/auth/login').send({ username: 'testowner', password: 'owner123' });
    ownerToken = o.body.data.token;

    const products = await query("SELECT id, active FROM products WHERE product_code IN ('T-001','T-002')");
    for (const p of products.rows) {
      if (p.active) activeProductId = p.id;
      else inactiveProductId = p.id;
    }
  });

  test('waiter can create a sale and total is calculated server-side', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${waiter1Token}`)
      .send({ product_id: activeProductId, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.total_amount).toBe('160.00');
    expect(res.body.data.unit_price).toBe('80.00');
    expect(res.body.data.status).toBe('PENDING');
    createdSaleId = res.body.data.id;
  });

  test('waiter cannot sell inactive product', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${waiter1Token}`)
      .send({ product_id: inactiveProductId, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  test('owner cannot create a sale', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ product_id: activeProductId, quantity: 1 });

    expect(res.status).toBe(403);
  });

  test('waiter only sees their own sales in my-sales', async () => {
    const res = await request(app)
      .get('/api/sales/my-sales')
      .set('Authorization', `Bearer ${waiter2Token}`);

    expect(res.status).toBe(200);
    // waiter2 has made no sales, so should be empty
    expect(res.body.data.length).toBe(0);
  });

  test('owner sees all sales', async () => {
    const res = await request(app)
      .get('/api/sales')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // ─── Audit Tests ───────────────────────────────────────────────────────────

  test('waiter cannot verify a sale', async () => {
    const res = await request(app)
      .post(`/api/audits/${createdSaleId}/verify`)
      .set('Authorization', `Bearer ${waiter1Token}`);

    expect(res.status).toBe(403);
  });

  test('owner can verify a sale', async () => {
    const res = await request(app)
      .post(`/api/audits/${createdSaleId}/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ note: 'Matches paper book' });

    expect(res.status).toBe(200);
    expect(res.body.data.result).toBe('VERIFIED');
  });

  test('already-verified sale cannot be verified again', async () => {
    const res = await request(app)
      .post(`/api/audits/${createdSaleId}/verify`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/VERIFIED/);
  });

  test('dispute requires a note', async () => {
    // Create a new sale to dispute
    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${waiter1Token}`)
      .send({ product_id: activeProductId, quantity: 1 });

    const saleId = saleRes.body.data.id;

    const res = await request(app)
      .post(`/api/audits/${saleId}/dispute`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({}); // no note

    expect(res.status).toBe(422);
  });

  test('owner can dispute a sale with note', async () => {
    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${waiter1Token}`)
      .send({ product_id: activeProductId, quantity: 1 });

    const saleId = saleRes.body.data.id;

    const res = await request(app)
      .post(`/api/audits/${saleId}/dispute`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ note: 'Paper book shows quantity 2 but system shows 1' });

    expect(res.status).toBe(200);
    expect(res.body.data.result).toBe('DISPUTED');
  });

  test('historical unit_price is preserved after product price change', async () => {
    // Create sale
    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${waiter1Token}`)
      .send({ product_id: activeProductId, quantity: 1 });

    const originalPrice = saleRes.body.data.unit_price;

    // Change product price
    await query('UPDATE products SET price = 999 WHERE id = $1', [activeProductId]);

    // Fetch the same sale
    const fetchRes = await request(app)
      .get(`/api/sales/${saleRes.body.data.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(fetchRes.body.data.unit_price).toBe(originalPrice);

    // Restore price
    await query('UPDATE products SET price = 80.00 WHERE id = $1', [activeProductId]);
  });

  test('closed day cannot be closed twice', async () => {
    const today = new Date().toISOString().split('T')[0];

    const first = await request(app)
      .post('/api/daily-audit/close')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ date: today });

    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/daily-audit/close')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ date: today });

    expect(second.status).toBe(400);
    expect(second.body.message).toMatch(/already been closed/i);
  });
});
