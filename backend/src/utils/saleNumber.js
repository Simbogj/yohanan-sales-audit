const { query } = require('../db/pool');

/**
 * Generate a unique sale number in the format SALE-YYYYMMDD-NNNN
 * Uses a database count to ensure sequential numbering per day.
 * Pads the sequence to 4 digits.
 */
async function generateSaleNumber(saleDate) {
  const dateStr = saleDate.replace(/-/g, '');

  const result = await query(
    `SELECT COUNT(*) AS cnt FROM sales WHERE sale_date = $1`,
    [saleDate]
  );

  const count = parseInt(result.rows[0].cnt, 10) + 1;
  const sequence = String(count).padStart(4, '0');

  return `SALE-${dateStr}-${sequence}`;
}

module.exports = { generateSaleNumber };
