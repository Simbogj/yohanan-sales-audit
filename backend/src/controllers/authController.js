const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const { success, error, unauthorized } = require('../utils/response');

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 'Username and password are required');
    }

    const result = await query(
      'SELECT id, full_name, username, password_hash, role, active FROM users WHERE username = $1',
      [username.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return unauthorized(res, 'Invalid username or password');
    }

    const user = result.rows[0];

    if (!user.active) {
      return unauthorized(res, 'Your account has been deactivated. Please contact the owner.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return unauthorized(res, 'Invalid username or password');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    return success(res, {
      id: req.user.id,
      full_name: req.user.full_name,
      username: req.user.username,
      role: req.user.role,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, getMe };
