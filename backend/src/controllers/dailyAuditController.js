const { query, getClient } = require('../db/pool');
const { success, error } = require('../utils/response');

/**
 * POST /api/daily-audit/close
 * Owner closes the current day.
 */
async function closeDay(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { date } = req.body;
    const auditDate = date || new Date().toISOString().split('T')[0];

    // Check if already closed
    const existing = await client.query(
      'SELECT id, status FROM daily_audits WHERE audit_date = $1',
      [auditDate]
    );

    if (existing.rows.length > 0 && existing.rows[0].status === 'CLOSED') {
      await client.query('ROLLBACK');
      return error(res, 'This day has already been closed');
    }

    // Gather stats
    const statsResult = await client.query(
      `SELECT
         COUNT(*)                                                 AS total_sales,
         COALESCE(SUM(total_amount), 0)                           AS total_amount,
         COUNT(*) FILTER (WHERE status = 'VERIFIED')              AS verified_count,
         COUNT(*) FILTER (WHERE status = 'DISPUTED')              AS disputed_count,
         COUNT(*) FILTER (WHERE status = 'PENDING')               AS pending_count
       FROM sales WHERE sale_date = $1`,
      [auditDate]
    );

    const stats = statsResult.rows[0];

    // Upsert daily_audits record
    await client.query(
      `INSERT INTO daily_audits
         (audit_date, total_sales, total_amount, verified_count, disputed_count, pending_count,
          closed_by, closed_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'CLOSED')
       ON CONFLICT (audit_date) DO UPDATE SET
         total_sales    = EXCLUDED.total_sales,
         total_amount   = EXCLUDED.total_amount,
         verified_count = EXCLUDED.verified_count,
         disputed_count = EXCLUDED.disputed_count,
         pending_count  = EXCLUDED.pending_count,
         closed_by      = EXCLUDED.closed_by,
         closed_at      = EXCLUDED.closed_at,
         status         = 'CLOSED',
         updated_at     = NOW()`,
      [
        auditDate,
        parseInt(stats.total_sales),
        parseFloat(stats.total_amount),
        parseInt(stats.verified_count),
        parseInt(stats.disputed_count),
        parseInt(stats.pending_count),
        req.user.id,
      ]
    );

    await client.query('COMMIT');

    return success(res, {
      audit_date: auditDate,
      status: 'CLOSED',
      ...stats,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/daily-audit?date=YYYY-MM-DD
 */
async function getDailyAuditStatus(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT da.*, u.full_name AS closed_by_name
       FROM daily_audits da
       LEFT JOIN users u ON u.id = da.closed_by
       WHERE da.audit_date = $1`,
      [date]
    );

    // Also get live stats from sales table
    const statsResult = await query(
      `SELECT
         COUNT(*)                                                 AS total_sales,
         COALESCE(SUM(total_amount), 0)                           AS total_amount,
         COUNT(*) FILTER (WHERE status = 'VERIFIED')              AS verified_count,
         COUNT(*) FILTER (WHERE status = 'DISPUTED')              AS disputed_count,
         COUNT(*) FILTER (WHERE status = 'PENDING')               AS pending_count
       FROM sales WHERE sale_date = $1`,
      [date]
    );

    return success(res, {
      date,
      audit_record: result.rows[0] || null,
      live_stats: statsResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { closeDay, getDailyAuditStatus };
