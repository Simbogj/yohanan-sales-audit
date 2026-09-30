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

/**
 * GET /api/reports/profit?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
 * Returns a full P&L breakdown for the given date range.
 */
async function getProfitReport(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { date_from = today, date_to = today } = req.query;

    // Regular catalogue sales (VERIFIED only for confirmed revenue)
    const salesResult = await query(
      `SELECT
         COUNT(*)                                                         AS sale_count,
         COALESCE(SUM(total_amount), 0)                                   AS total_sales,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'VERIFIED'), 0) AS verified_sales,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'PENDING'), 0)  AS pending_sales,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'DISPUTED'), 0) AS disputed_sales
       FROM sales
       WHERE sale_date BETWEEN $1 AND $2`,
      [date_from, date_to]
    );

    // Other (manual) sales
    const otherSalesResult = await query(
      `SELECT
         COUNT(*)                                                         AS other_sale_count,
         COALESCE(SUM(total_amount), 0)                                   AS total_other_sales,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'VERIFIED'), 0) AS verified_other_sales
       FROM other_sales
       WHERE sale_date BETWEEN $1 AND $2`,
      [date_from, date_to]
    );

    // Purchases (raw material cost)
    const purchasesResult = await query(
      `SELECT
         COUNT(*)                      AS purchase_count,
         COALESCE(SUM(total_cost), 0)  AS total_purchases
       FROM purchases
       WHERE purchase_date BETWEEN $1 AND $2`,
      [date_from, date_to]
    );

    // Expenses
    const expensesResult = await query(
      `SELECT
         COUNT(*)                    AS expense_count,
         COALESCE(SUM(amount), 0)    AS total_expenses,
         json_agg(json_build_object('category', category, 'amount', amount, 'description', description)
           ORDER BY expense_date DESC) AS expense_details
       FROM expenses
       WHERE expense_date BETWEEN $1 AND $2`,
      [date_from, date_to]
    );

    // Unpaid sales (outstanding receivables)
    const unpaidResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE paid = FALSE)                       AS unpaid_count,
         COALESCE(SUM(amount_owed) FILTER (WHERE paid = FALSE), 0)  AS total_unpaid,
         COALESCE(SUM(amount_owed) FILTER (WHERE paid = TRUE), 0)   AS total_collected
       FROM unpaid_sales
       WHERE sale_date BETWEEN $1 AND $2`,
      [date_from, date_to]
    );

    // Purchases breakdown by category
    const purchaseByCategoryResult = await query(
      `SELECT category, COALESCE(SUM(total_cost), 0) AS total
       FROM purchases
       WHERE purchase_date BETWEEN $1 AND $2
       GROUP BY category
       ORDER BY total DESC`,
      [date_from, date_to]
    );

    // Expense breakdown by category
    const expenseByCategoryResult = await query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
       GROUP BY category
       ORDER BY total DESC`,
      [date_from, date_to]
    );

    const s = salesResult.rows[0];
    const os = otherSalesResult.rows[0];
    const p = purchasesResult.rows[0];
    const e = expensesResult.rows[0];
    const u = unpaidResult.rows[0];

    const totalRevenue = parseFloat(s.total_sales) + parseFloat(os.total_other_sales);
    const totalCosts = parseFloat(p.total_purchases) + parseFloat(e.total_expenses);
    const grossProfit = totalRevenue - parseFloat(p.total_purchases);
    const netProfit = totalRevenue - totalCosts;

    return success(res, {
      date_from,
      date_to,
      revenue: {
        catalogue_sales: parseFloat(s.total_sales),
        verified_catalogue_sales: parseFloat(s.verified_sales),
        pending_catalogue_sales: parseFloat(s.pending_sales),
        disputed_catalogue_sales: parseFloat(s.disputed_sales),
        other_sales: parseFloat(os.total_other_sales),
        total_revenue: totalRevenue,
        sale_count: parseInt(s.sale_count),
        other_sale_count: parseInt(os.other_sale_count),
      },
      costs: {
        total_purchases: parseFloat(p.total_purchases),
        purchase_count: parseInt(p.purchase_count),
        purchases_by_category: purchaseByCategoryResult.rows,
        total_expenses: parseFloat(e.total_expenses),
        expense_count: parseInt(e.expense_count),
        expenses_by_category: expenseByCategoryResult.rows,
        total_costs: totalCosts,
      },
      receivables: {
        unpaid_count: parseInt(u.unpaid_count),
        total_unpaid: parseFloat(u.total_unpaid),
        total_collected: parseFloat(u.total_collected),
      },
      profit: {
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin_pct: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDailyReport, getSalesByWaiter, getSalesByProduct, getSummary, getProfitReport };
