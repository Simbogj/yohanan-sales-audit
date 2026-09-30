const { query, getClient } = require('../db/pool');
const { success, created, error, notFound, forbidden } = require('../utils/response');

/**
 * POST /api/other-sales
 * Waiter (or Owner) manually records a sale not in the product catalogue.
 */
async function createOtherSale(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { item_name, quantity, unit_price, note, sale_date } = req.body;

    if (!item_name || !quantity || unit_price === undefined) {
      await client.query('ROLLBACK');
      return error(res, 'item_name, quantity, and unit_price are required');
    }

    const qty = parseInt(quantity, 10);
    const price = parseFloat(unit_price);

    if (isNaN(qty) || qty <= 0) {
      await client.query('ROLLBACK');
      return error(res, 'quantity must be a positive integer');
    }
    if (isNaN(price) || price < 0) {
      await client.query('ROLLBACK');
      return error(res, 'unit_price must be a non-negative number');
    }

    const totalAmount = qty * price;
    const date = sale_date || new Date().toISOString().split('T')[0];

    const result = await client.query(
      `INSERT INTO other_sales (sale_date, item_name, quantity, unit_price, total_amount, waiter_id, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [date, item_name.trim(), qty, price, totalAmount, req.user.id, note || null]
    );

    await client.query('COMMIT');

    const enriched = await query(
      `SELECT os.*, u.full_name AS waiter_name
       FROM other_sales os JOIN users u ON u.id = os.waiter_id
       WHERE os.id = $1`,
      [result.rows[0].id]
    );

    return created(res, enriched.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/other-sales
 * Owner: all; Waiter: only their own.
 */
async function getOtherSales(req, res, next) {
  try {
    const { date, date_from, date_to, status, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT os.*, u.full_name AS waiter_name
      FROM other_sales os
      JOIN users u ON u.id = os.waiter_id
      WHERE 1=1
    `;
    const params = [];

    // Waiters see only their own records
    if (req.user.role === 'WAITER') {
      params.push(req.user.id);
      sql += ` AND os.waiter_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      sql += ` AND os.sale_date = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      sql += ` AND os.sale_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      sql += ` AND os.sale_date <= $${params.length}`;
    }
    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND os.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND os.item_name ILIKE $${params.length}`;
    }

    sql += ' ORDER BY os.sale_date DESC, os.created_at DESC';

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
 * GET /api/other-sales/:id
 */
async function getOtherSaleById(req, res, next) {
  try {
    const result = await query(
      `SELECT os.*, u.full_name AS waiter_name
       FROM other_sales os JOIN users u ON u.id = os.waiter_id
       WHERE os.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return notFound(res, 'Other sale not found');
    const row = result.rows[0];
    // Waiters can only view their own records
    if (req.user.role === 'WAITER' && row.waiter_id !== req.user.id) {
      return forbidden(res, 'You can only view your own records');
    }
    return success(res, row);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/other-sales/:id/status
 * Owner: verify or dispute an other-sale.
 */
async function updateOtherSaleStatus(req, res, next) {
  try {
    const { status, note } = req.body;
    const validStatuses = ['PENDING', 'VERIFIED', 'DISPUTED'];
    if (!validStatuses.includes(status?.toUpperCase())) {
      return error(res, `status must be one of: ${validStatuses.join(', ')}`);
    }
    if (status.toUpperCase() === 'DISPUTED' && !note) {
      return error(res, 'A note is required when disputing a sale');
    }

    const result = await query(
      `UPDATE other_sales SET status = $1, note = COALESCE($2, note) WHERE id = $3 RETURNING *`,
      [status.toUpperCase(), note || null, req.params.id]
    );
    if (result.rows.length === 0) return notFound(res, 'Other sale not found');
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/other-sales/:id
 * Owner only.
 */
async function deleteOtherSale(req, res, next) {
  try {
    const result = await query('DELETE FROM other_sales WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return notFound(res, 'Other sale not found');
    return success(res, { deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOtherSale, getOtherSales, getOtherSaleById, updateOtherSaleStatus, deleteOtherSale };
