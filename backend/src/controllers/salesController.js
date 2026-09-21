const { query, getClient } = require('../db/pool');
const { generateSaleNumber } = require('../utils/saleNumber');
const { success, created, error, notFound, forbidden } = require('../utils/response');

/**
 * POST /api/sales
 * Waiter creates a new sale.
 */
async function createSale(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { product_id, quantity } = req.body;
    const waiterId = req.user.id; // Always taken from JWT, never from body

    // Fetch the product (must exist and be active)
    const productResult = await client.query(
      'SELECT id, name, price, active FROM products WHERE id = $1',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res, 'Product not found');
    }

    const product = productResult.rows[0];

    if (!product.active) {
      await client.query('ROLLBACK');
      return error(res, 'Product is currently unavailable');
    }

    // Server-side calculations — never trust client values
    const unitPrice = parseFloat(product.price);
    const qty = parseInt(quantity, 10);
    const totalAmount = unitPrice * qty;

    // Use server date/time
    const now = new Date();
    const saleDate = now.toISOString().split('T')[0];
    const saleTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    const saleNumber = await generateSaleNumber(saleDate);

    const insertResult = await client.query(
      `INSERT INTO sales
         (sale_number, waiter_id, product_id, sale_date, sale_time, status, quantity, unit_price, total_amount)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, $8)
       RETURNING *`,
      [saleNumber, waiterId, product_id, saleDate, saleTime, qty, unitPrice, totalAmount]
    );

    await client.query('COMMIT');

    // Return sale with product and waiter details
    const sale = insertResult.rows[0];
    const enrichedResult = await query(
      `SELECT s.*, p.name AS product_name, p.category AS product_category,
              u.full_name AS waiter_name
       FROM sales s
       JOIN products p ON p.id = s.product_id
       JOIN users u ON u.id = s.waiter_id
       WHERE s.id = $1`,
      [sale.id]
    );

    return created(res, enrichedResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/sales
 * Owner: all sales with filters.
 * Waiter: redirected to /my-sales.
 */
async function getSales(req, res, next) {
  try {
    const { date, date_from, date_to, waiter_id, product_id, category, status, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT s.id, s.sale_number, s.sale_date, s.sale_time, s.status,
             s.quantity, s.unit_price, s.total_amount, s.created_at,
             p.name AS product_name, p.category AS product_category,
             u.full_name AS waiter_name, u.id AS waiter_id
      FROM sales s
      JOIN products p ON p.id = s.product_id
      JOIN users u ON u.id = s.waiter_id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      sql += ` AND s.sale_date = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      sql += ` AND s.sale_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      sql += ` AND s.sale_date <= $${params.length}`;
    }
    if (waiter_id) {
      params.push(waiter_id);
      sql += ` AND s.waiter_id = $${params.length}`;
    }
    if (product_id) {
      params.push(product_id);
      sql += ` AND s.product_id = $${params.length}`;
    }
    if (category) {
      params.push(category.toUpperCase());
      sql += ` AND p.category = $${params.length}`;
    }
    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND s.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (s.sale_number ILIKE $${params.length} OR p.name ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`;
    }

    sql += ' ORDER BY s.sale_date DESC, s.sale_time DESC';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit));
    sql += ` LIMIT $${params.length}`;
    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const result = await query(sql, params);
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sales/today
 * Owner only: today's sales.
 */
async function getTodaySales(req, res, next) {
  try {
    const result = await query(
      `SELECT s.id, s.sale_number, s.sale_date, s.sale_time, s.status,
              s.quantity, s.unit_price, s.total_amount, s.created_at,
              p.name AS product_name, p.category AS product_category,
              u.full_name AS waiter_name, u.id AS waiter_id
       FROM sales s
       JOIN products p ON p.id = s.product_id
       JOIN users u ON u.id = s.waiter_id
       WHERE s.sale_date = CURRENT_DATE
       ORDER BY s.sale_time DESC`
    );
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sales/my-sales
 * Waiter: their own sales only.
 */
async function getMySales(req, res, next) {
  try {
    const { date, status } = req.query;
    let sql = `
      SELECT s.id, s.sale_number, s.sale_date, s.sale_time, s.status,
             s.quantity, s.unit_price, s.total_amount, s.created_at,
             p.name AS product_name, p.category AS product_category
      FROM sales s
      JOIN products p ON p.id = s.product_id
      WHERE s.waiter_id = $1
    `;
    const params = [req.user.id];

    if (date) {
      params.push(date);
      sql += ` AND s.sale_date = $${params.length}`;
    } else {
      // Default to today
      sql += ` AND s.sale_date = CURRENT_DATE`;
    }

    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND s.status = $${params.length}`;
    }

    sql += ' ORDER BY s.sale_time DESC';

    const result = await query(sql, params);
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sales/:id
 */
async function getSaleById(req, res, next) {
  try {
    const result = await query(
      `SELECT s.*, p.name AS product_name, p.category AS product_category,
              u.full_name AS waiter_name
       FROM sales s
       JOIN products p ON p.id = s.product_id
       JOIN users u ON u.id = s.waiter_id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return notFound(res, 'Sale not found');
    }

    const sale = result.rows[0];

    // Waiters can only view their own sales
    if (req.user.role === 'WAITER' && sale.waiter_id !== req.user.id) {
      return forbidden(res, 'You can only view your own sales');
    }

    // Fetch audit records for this sale
    const audits = await query(
      `SELECT ar.id, ar.result, ar.note, ar.created_at, u.full_name AS auditor_name
       FROM audit_records ar
       JOIN users u ON u.id = ar.auditor_id
       WHERE ar.sale_id = $1
       ORDER BY ar.created_at DESC`,
      [req.params.id]
    );

    return success(res, { ...sale, audit_records: audits.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSale, getSales, getTodaySales, getMySales, getSaleById };
