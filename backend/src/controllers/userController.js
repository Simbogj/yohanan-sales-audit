const bcrypt = require('bcrypt');
const { query } = require('../db/pool');
const { success, created, error, notFound } = require('../utils/response');

const SALT_ROUNDS = 12;

/**
 * GET /api/users
 */
async function getUsers(req, res, next) {
  try {
    const { role, active } = req.query;
    let sql = `SELECT id, full_name, username, role, active, created_at FROM users WHERE 1=1`;
    const params = [];

    if (role) {
      params.push(role.toUpperCase());
      sql += ` AND role = $${params.length}`;
    }
    if (active !== undefined) {
      params.push(active === 'true');
      sql += ` AND active = $${params.length}`;
    }

    sql += ' ORDER BY role, full_name';

    const result = await query(sql, params);
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users
 */
async function createUser(req, res, next) {
  try {
    const { full_name, username, password, role } = req.body;

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (full_name, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, username, role, active, created_at`,
      [full_name.trim(), username.trim().toLowerCase(), passwordHash, role.toUpperCase()]
    );

    return created(res, result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, 'Username is already taken', 409);
    }
    next(err);
  }
}

/**
 * PUT /api/users/:id
 */
async function updateUser(req, res, next) {
  try {
    const { full_name, username, password, role } = req.body;

    let passwordHash = null;
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    let sql, params;

    if (passwordHash) {
      sql = `UPDATE users SET full_name = $1, username = $2, password_hash = $3, role = $4, updated_at = NOW()
             WHERE id = $5
             RETURNING id, full_name, username, role, active`;
      params = [full_name.trim(), username.trim().toLowerCase(), passwordHash, role.toUpperCase(), req.params.id];
    } else {
      sql = `UPDATE users SET full_name = $1, username = $2, role = $3, updated_at = NOW()
             WHERE id = $4
             RETURNING id, full_name, username, role, active`;
      params = [full_name.trim(), username.trim().toLowerCase(), role.toUpperCase(), req.params.id];
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return notFound(res, 'User not found');
    }

    return success(res, result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, 'Username is already taken', 409);
    }
    next(err);
  }
}

/**
 * PATCH /api/users/:id/status
 */
async function updateUserStatus(req, res, next) {
  try {
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return error(res, 'active must be a boolean');
    }

    // Prevent owner from deactivating themselves
    if (req.params.id === req.user.id && !active) {
      return error(res, 'You cannot deactivate your own account');
    }

    const result = await query(
      `UPDATE users SET active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, full_name, username, role, active`,
      [active, req.params.id]
    );

    if (result.rows.length === 0) {
      return notFound(res, 'User not found');
    }

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, createUser, updateUser, updateUserStatus };
