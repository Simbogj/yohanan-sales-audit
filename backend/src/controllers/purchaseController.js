const { query, getClient } = require('../db/pool');
const { success, created, error, notFound } = require('../utils/response');

/**
 * POST /api/purchases
 * Owner records a raw-material purchase.
 */
async function createPurchase(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      purchase_date,
      supplier_name,
      item_name,
      category = 'OTHER',
      quantity,
      unit = 'unit',
      unit_cost,
      note,
    } = req.body;

    if (!item_name || !quantity || unit_cost === undefined) {
      await client.query('ROLLBACK');
      return error(res, 'item_name, quantity, and unit_cost are required');
    }

    const qty = parseFloat(quantity);
    const cost = parseFloat(unit_cost);

    if (isNaN(qty) || qty <= 0) {
      await client.query('ROLLBACK');
      return error(res, 'quantity must be a positive number');
    }
    if (isNaN(cost) || cost < 0) {
      await client.query('ROLLBACK');
      return error(res, 'unit_cost must be a non-negative number');
    }

    const totalCost = qty * cost;
    const date = purchase_date || new Date().toISOString().split('T')[0];

    const result = await client.query(
      `INSERT INTO purchases
         (purchase_date, supplier_name, item_name, category, quantity, unit, unit_cost, total_cost, recorded_by, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [date, supplier_name || null, item_name.trim(), category.toUpperCase(), qty, unit, cost, totalCost, req.user.id, note || null]
    );

    await client.query('COMMIT');

    // Enrich with recorder name
    const enriched = await query(
      `SELECT p.*, u.full_name AS recorded_by_name
       FROM purchases p JOIN users u ON u.id = p.recorded_by
       WHERE p.id = $1`,
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
 * GET /api/purchases
 * Owner: list purchases with optional date filter.
 */
async function getPurchases(req, res, next) {
  try {
    const { date, date_from, date_to, category, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT p.*, u.full_name AS recorded_by_name
      FROM purchases p
      JOIN users u ON u.id = p.recorded_by
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      sql += ` AND p.purchase_date = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      sql += ` AND p.purchase_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      sql += ` AND p.purchase_date <= $${params.length}`;
    }
    if (category) {
      params.push(category.toUpperCase());
      sql += ` AND p.category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.item_name ILIKE $${params.length} OR p.supplier_name ILIKE $${params.length})`;
    }

    sql += ' ORDER BY p.purchase_date DESC, p.created_at DESC';

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
 * GET /api/purchases/:id
 */
async function getPurchaseById(req, res, next) {
  try {
    const result = await query(
      `SELECT p.*, u.full_name AS recorded_by_name
       FROM purchases p JOIN users u ON u.id = p.recorded_by
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return notFound(res, 'Purchase not found');
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/purchases/:id
 */
async function updatePurchase(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM purchases WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res, 'Purchase not found');
    }

    const row = existing.rows[0];
    const {
      purchase_date = row.purchase_date,
      supplier_name = row.supplier_name,
      item_name = row.item_name,
      category = row.category,
      quantity = row.quantity,
      unit = row.unit,
      unit_cost = row.unit_cost,
      note = row.note,
    } = req.body;

    const qty = parseFloat(quantity);
    const cost = parseFloat(unit_cost);
    const totalCost = qty * cost;

    const result = await client.query(
      `UPDATE purchases SET
         purchase_date = $1, supplier_name = $2, item_name = $3, category = $4,
         quantity = $5, unit = $6, unit_cost = $7, total_cost = $8, note = $9
       WHERE id = $10
       RETURNING *`,
      [purchase_date, supplier_name, item_name.trim(), category.toUpperCase(), qty, unit, cost, totalCost, note, req.params.id]
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
 * DELETE /api/purchases/:id
 */
async function deletePurchase(req, res, next) {
  try {
    const result = await query('DELETE FROM purchases WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return notFound(res, 'Purchase not found');
    return success(res, { deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPurchase, getPurchases, getPurchaseById, updatePurchase, deletePurchase };
