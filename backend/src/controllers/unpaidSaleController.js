const { query, getClient } = require('../db/pool');
const { success, created, error, notFound, forbidden } = require('../utils/response');

/**
 * POST /api/unpaid-sales
 * Waiter or Owner records an unpaid (credit) sale.
 */
async function createUnpaidSale(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { customer_name, amount_owed, sale_date, due_date, sale_id, other_sale_id, note } = req.body;

    if (!customer_name || amount_owed === undefined) {
      await client.query('ROLLBACK');
      return error(res, 'customer_name and amount_owed are required');
    }

    const amt = parseFloat(amount_owed);
    if (isNaN(amt) || amt < 0) {
      await client.query('ROLLBACK');
      return error(res, 'amount_owed must be a non-negative number');
    }

    const date = sale_date || new Date().toISOString().split('T')[0];

    const result = await client.query(
      `INSERT INTO unpaid_sales
         (sale_id, other_sale_id, customer_name, amount_owed, sale_date, due_date, recorded_by, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        sale_id || null,
        other_sale_id || null,
        customer_name.trim(),
        amt,
        date,
        due_date || null,
        req.user.id,
        note || null,
      ]
    );

    await client.query('COMMIT');

    const enriched = await query(
      `SELECT us.*, u.full_name AS recorded_by_name
       FROM unpaid_sales us JOIN users u ON u.id = us.recorded_by
       WHERE us.id = $1`,
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
 * GET /api/unpaid-sales
 * Owner: all; Waiter: only records they entered.
 */
async function getUnpaidSales(req, res, next) {
  try {
    const { paid, date_from, date_to, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT us.*, u.full_name AS recorded_by_name
      FROM unpaid_sales us
      JOIN users u ON u.id = us.recorded_by
      WHERE 1=1
    `;
    const params = [];

    // Waiters see only what they entered
    if (req.user.role === 'WAITER') {
      params.push(req.user.id);
      sql += ` AND us.recorded_by = $${params.length}`;
    }

    if (paid !== undefined) {
      params.push(paid === 'true' || paid === true);
      sql += ` AND us.paid = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      sql += ` AND us.sale_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      sql += ` AND us.sale_date <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND us.customer_name ILIKE $${params.length}`;
    }

    sql += ' ORDER BY us.paid ASC, us.sale_date DESC, us.created_at DESC';

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
 * GET /api/unpaid-sales/:id
 */
async function getUnpaidSaleById(req, res, next) {
  try {
    const result = await query(
      `SELECT us.*, u.full_name AS recorded_by_name
       FROM unpaid_sales us JOIN users u ON u.id = us.recorded_by
       WHERE us.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return notFound(res, 'Unpaid sale not found');
    const row = result.rows[0];
    if (req.user.role === 'WAITER' && row.recorded_by !== req.user.id) {
      return forbidden(res, 'You can only view records you entered');
    }
    return success(res, row);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/unpaid-sales/:id/mark-paid
 * Owner marks an unpaid sale as paid.
 */
async function markPaid(req, res, next) {
  try {
    const result = await query(
      `UPDATE unpaid_sales
       SET paid = TRUE, paid_at = NOW()
       WHERE id = $1 AND paid = FALSE
       RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      // Either not found or already paid
      const check = await query('SELECT id, paid FROM unpaid_sales WHERE id = $1', [req.params.id]);
      if (check.rows.length === 0) return notFound(res, 'Unpaid sale not found');
      return error(res, 'This sale is already marked as paid');
    }
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/unpaid-sales/:id
 * Owner updates an unpaid sale record.
 */
async function updateUnpaidSale(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM unpaid_sales WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res, 'Unpaid sale not found');
    }

    const row = existing.rows[0];
    const {
      customer_name = row.customer_name,
      amount_owed = row.amount_owed,
      sale_date = row.sale_date,
      due_date = row.due_date,
      note = row.note,
    } = req.body;

    const result = await client.query(
      `UPDATE unpaid_sales
       SET customer_name = $1, amount_owed = $2, sale_date = $3, due_date = $4, note = $5
       WHERE id = $6
       RETURNING *`,
      [customer_name.trim(), parseFloat(amount_owed), sale_date, due_date || null, note, req.params.id]
    );

    await client.query('COMMIT');
    return success(res, result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/unpaid-sales/:id
 * Owner only.
 */
async function deleteUnpaidSale(req, res, next) {
  try {
    const result = await query('DELETE FROM unpaid_sales WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return notFound(res, 'Unpaid sale not found');
    return success(res, { deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUnpaidSale, getUnpaidSales, getUnpaidSaleById, markPaid, updateUnpaidSale, deleteUnpaidSale };
