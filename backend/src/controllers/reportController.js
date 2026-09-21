const { query } = require('../db/pool');
const { success, error } = require('../utils/response');

/**
 * GET /api/reports/daily?date=YYYY-MM-DD
 */
async function getDailyReport(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    // Summary totals
    const summaryResult = await query(
      `SELECT
         COUNT(*)                                                   AS total_transactions,
         COALESCE(SUM(quantity), 0)                                 AS total_items,
         COALESCE(SUM(total_amount), 0)                             AS total_revenue,
         COUNT(*) FILTER (WHERE status = 'PENDING')                 AS pending_count,
         COUNT(*) FILTER (WHERE status = 'VERIFIED')                AS verified_count,
         COUNT(*) FILTER (WHERE status = 'DISPUTED')                AS disputed_count
       FROM sales
       WHERE sale_date = $1`,
      [date]
    );

    // Sales by waiter
    const byWaiterResult = await query(
      `SELECT u.id, u.full_name,
              COUNT(s.id)                    AS transaction_count,
              COALESCE(SUM(s.quantity), 0)   AS items_sold,
              COALESCE(SUM(s.total_amount), 0) AS total_sales
       FROM sales s
       JOIN users u ON u.id = s.waiter_id
       WHERE s.sale_date = $1
       GROUP BY u.id, u.full_name
       ORDER BY total_sales DESC`,
      [date]
    );

    // Sales by product
    const byProductResult = await query(
      `SELECT p.id, p.name AS product_name, p.category,
              COUNT(s.id)                    AS transaction_count,
              COALESCE(SUM(s.quantity), 0)   AS total_quantity,
              COALESCE(SUM(s.total_amount), 0) AS total_sales
       FROM sales s
       JOIN products p ON p.id = s.product_id
       WHERE s.sale_date = $1
       GROUP BY p.id, p.name, p.category
       ORDER BY total_sales DESC`,
      [date]
    );

    // Daily audit status
    const dailyAuditResult = await query(
      `SELECT status, closed_by, closed_at FROM daily_audits WHERE audit_date = $1`,
      [date]
    );

    return success(res, {
      date,
      summary: summaryResult.rows[0],
      by_waiter: byWaiterResult.rows,
      by_product: byProductResult.rows,
      daily_audit: dailyAuditResult.rows[0] || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/sales-by-waiter?date=YYYY-MM-DD
 */
async function getSalesByWaiter(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT u.id, u.full_name,
              COUNT(s.id)                      AS transactions,
              COALESCE(SUM(s.total_amount), 0) AS total_sales
       FROM sales s
       JOIN users u ON u.id = s.waiter_id
       WHERE s.sale_date = $1
       GROUP BY u.id, u.full_name
       ORDER BY total_sales DESC`,
      [date]
    );

    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/sales-by-product?date=YYYY-MM-DD
 */
async function getSalesByProduct(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT p.id, p.name, p.category,
              COUNT(s.id)                      AS transactions,
              COALESCE(SUM(s.quantity), 0)     AS total_quantity,
              COALESCE(SUM(s.total_amount), 0) AS total_sales
       FROM sales s
       JOIN products p ON p.id = s.product_id
       WHERE s.sale_date = $1
       GROUP BY p.id, p.name, p.category
       ORDER BY total_sales DESC`,
      [date]
    );

    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/summary?date_from=&date_to=
 */
async function getSummary(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { date_from = today, date_to = today } = req.query;

    const result = await query(
      `SELECT
         COUNT(*)                                                   AS total_transactions,
         COALESCE(SUM(total_amount), 0)                             AS total_revenue,
         COUNT(*) FILTER (WHERE status = 'PENDING')                 AS pending_count,
         COUNT(*) FILTER (WHERE status = 'VERIFIED')                AS verified_count,
         COUNT(*) FILTER (WHERE status = 'DISPUTED')                AS disputed_count
       FROM sales
       WHERE sale_date BETWEEN $1 AND $2`,
      [date_from, date_to]
    );

    return success(res, { date_from, date_to, ...result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDailyReport, getSalesByWaiter, getSalesByProduct, getSummary };
