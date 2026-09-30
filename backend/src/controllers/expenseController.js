const { query, getClient } = require('../db/pool');
const { success, created, error, notFound } = require('../utils/response');

/**
 * POST /api/expenses
 * Owner records an expense.
 */
async function createExpense(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { expense_date, category = 'OTHER', description, amount, note } = req.body;

    if (!description || amount === undefined) {
      await client.query('ROLLBACK');
      return error(res, 'description and amount are required');
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) {
      await client.query('ROLLBACK');
      return error(res, 'amount must be a non-negative number');
    }

    const date = expense_date || new Date().toISOString().split('T')[0];

    const result = await client.query(
      `INSERT INTO expenses (expense_date, category, description, amount, recorded_by, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [date, category.toUpperCase(), description.trim(), amt, req.user.id, note || null]
    );

    await client.query('COMMIT');

    const enriched = await query(
      `SELECT e.*, u.full_name AS recorded_by_name
       FROM expenses e JOIN users u ON u.id = e.recorded_by
       WHERE e.id = $1`,
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
 * GET /api/expenses
 */
async function getExpenses(req, res, next) {
  try {
    const { date, date_from, date_to, category, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT e.*, u.full_name AS recorded_by_name
      FROM expenses e
      JOIN users u ON u.id = e.recorded_by
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      sql += ` AND e.expense_date = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      sql += ` AND e.expense_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      sql += ` AND e.expense_date <= $${params.length}`;
    }
    if (category) {
      params.push(category.toUpperCase());
      sql += ` AND e.category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND e.description ILIKE $${params.length}`;
    }

    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

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
 * GET /api/expenses/:id
 */
async function getExpenseById(req, res, next) {
  try {
    const result = await query(
      `SELECT e.*, u.full_name AS recorded_by_name
       FROM expenses e JOIN users u ON u.id = e.recorded_by
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return notFound(res, 'Expense not found');
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/expenses/:id
 */
async function updateExpense(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res, 'Expense not found');
    }

    const row = existing.rows[0];
    const {
      expense_date = row.expense_date,
      category = row.category,
      description = row.description,
      amount = row.amount,
      note = row.note,
    } = req.body;

    const amt = parseFloat(amount);

    const result = await client.query(
      `UPDATE expenses SET
         expense_date = $1, category = $2, description = $3, amount = $4, note = $5
       WHERE id = $6
       RETURNING *`,
      [expense_date, category.toUpperCase(), description.trim(), amt, note, req.params.id]
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
 * DELETE /api/expenses/:id
 */
async function deleteExpense(req, res, next) {
  try {
    const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return notFound(res, 'Expense not found');
    return success(res, { deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense };
