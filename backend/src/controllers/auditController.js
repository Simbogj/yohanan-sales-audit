const { query, getClient } = require('../db/pool');
const { success, error, notFound } = require('../utils/response');

/**
 * POST /api/audits/:saleId/verify
 * Owner verifies a PENDING sale.
 */
async function verifySale(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { saleId } = req.params;
    const { note } = req.body;

    const saleResult = await client.query(
      'SELECT id, status, sale_number FROM sales WHERE id = $1 FOR UPDATE',
      [saleId]
    );

    if (saleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res, 'Sale not found');
    }

    const sale = saleResult.rows[0];

    if (sale.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return error(res, `Sale is already ${sale.status}. Only PENDING sales can be audited.`);
    }

    // Update sale status
    await client.query(
      `UPDATE sales SET status = 'VERIFIED', updated_at = NOW() WHERE id = $1`,
      [saleId]
    );

    // Create audit record
    const auditResult = await client.query(
      `INSERT INTO audit_records (sale_id, auditor_id, result, note)
       VALUES ($1, $2, 'VERIFIED', $3)
       RETURNING *`,
      [saleId, req.user.id, note || null]
    );

    await client.query('COMMIT');

    return success(res, {
      sale_id: saleId,
      sale_number: sale.sale_number,
      result: 'VERIFIED',
      audit_record: auditResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * POST /api/audits/:saleId/dispute
 * Owner disputes a PENDING sale. A note (reason) is required.
 */
async function disputeSale(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { saleId } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      await client.query('ROLLBACK');
      return error(res, 'A reason (note) is required when disputing a sale');
    }

    const saleResult = await client.query(
      'SELECT id, status, sale_number FROM sales WHERE id = $1 FOR UPDATE',
      [saleId]
    );

    if (saleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res, 'Sale not found');
    }

    const sale = saleResult.rows[0];

    if (sale.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return error(res, `Sale is already ${sale.status}. Only PENDING sales can be audited.`);
    }

    // Update sale status
    await client.query(
      `UPDATE sales SET status = 'DISPUTED', updated_at = NOW() WHERE id = $1`,
      [saleId]
    );

    // Create audit record
    const auditResult = await client.query(
      `INSERT INTO audit_records (sale_id, auditor_id, result, note)
       VALUES ($1, $2, 'DISPUTED', $3)
       RETURNING *`,
      [saleId, req.user.id, note.trim()]
    );

    await client.query('COMMIT');

    return success(res, {
      sale_id: saleId,
      sale_number: sale.sale_number,
      result: 'DISPUTED',
      audit_record: auditResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/audits
 * Owner: all audit records with optional filters.
 */
async function getAuditRecords(req, res, next) {
  try {
    const { date, auditor_id } = req.query;
    let sql = `
      SELECT ar.id, ar.result, ar.note, ar.created_at,
             s.sale_number, s.sale_date, s.total_amount,
             u.full_name AS auditor_name,
             w.full_name AS waiter_name
      FROM audit_records ar
      JOIN sales s ON s.id = ar.sale_id
      JOIN users u ON u.id = ar.auditor_id
      JOIN users w ON w.id = s.waiter_id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      sql += ` AND s.sale_date = $${params.length}`;
    }
    if (auditor_id) {
      params.push(auditor_id);
      sql += ` AND ar.auditor_id = $${params.length}`;
    }

    sql += ' ORDER BY ar.created_at DESC';

    const result = await query(sql, params);
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/audits/:saleId
 * Audit records for a specific sale.
 */
async function getAuditBySaleId(req, res, next) {
  try {
    const result = await query(
      `SELECT ar.id, ar.result, ar.note, ar.created_at,
              u.full_name AS auditor_name
       FROM audit_records ar
       JOIN users u ON u.id = ar.auditor_id
       WHERE ar.sale_id = $1
       ORDER BY ar.created_at DESC`,
      [req.params.saleId]
    );
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { verifySale, disputeSale, getAuditRecords, getAuditBySaleId };
