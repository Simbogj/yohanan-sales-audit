const { query } = require('../db/pool');
const { success, created, error, notFound } = require('../utils/response');

/**
 * GET /api/products
 */
async function getProducts(req, res, next) {
  try {
    const { category, active } = req.query;
    let sql = `SELECT id, product_code, name, category, price, active, created_at
               FROM products WHERE 1=1`;
    const params = [];

    if (category) {
      params.push(category.toUpperCase());
      sql += ` AND category = $${params.length}`;
    }

    if (active !== undefined) {
      params.push(active === 'true');
      sql += ` AND active = $${params.length}`;
    }

    sql += ' ORDER BY category, name';

    const result = await query(sql, params);
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id
 */
async function getProductById(req, res, next) {
  try {
    const result = await query(
      'SELECT id, product_code, name, category, price, active, created_at FROM products WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return notFound(res, 'Product not found');
    }
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/products
 */
async function createProduct(req, res, next) {
  try {
    const { product_code, name, category, price } = req.body;

    const result = await query(
      `INSERT INTO products (product_code, name, category, price)
       VALUES ($1, $2, $3, $4)
       RETURNING id, product_code, name, category, price, active, created_at`,
      [product_code.trim().toUpperCase(), name.trim(), category.toUpperCase(), parseFloat(price)]
    );

    return created(res, result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, 'A product with that code already exists', 409);
    }
    next(err);
  }
}

/**
 * PUT /api/products/:id
 */
async function updateProduct(req, res, next) {
  try {
    const { product_code, name, category, price } = req.body;

    const result = await query(
      `UPDATE products
       SET product_code = $1, name = $2, category = $3, price = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, product_code, name, category, price, active, updated_at`,
      [product_code.trim().toUpperCase(), name.trim(), category.toUpperCase(), parseFloat(price), req.params.id]
    );

    if (result.rows.length === 0) {
      return notFound(res, 'Product not found');
    }

    return success(res, result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, 'A product with that code already exists', 409);
    }
    next(err);
  }
}

/**
 * PATCH /api/products/:id/status
 */
async function updateProductStatus(req, res, next) {
  try {
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return error(res, 'active must be a boolean');
    }

    const result = await query(
      `UPDATE products SET active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, product_code, name, category, price, active`,
      [active, req.params.id]
    );

    if (result.rows.length === 0) {
      return notFound(res, 'Product not found');
    }

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, updateProductStatus };
