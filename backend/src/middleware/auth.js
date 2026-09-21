const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const { unauthorized, forbidden } = require('../utils/response');

/**
 * Verify JWT and attach user to request.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return unauthorized(res, 'Authentication token required');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-fetch user from DB to confirm they are still active
    const result = await query(
      'SELECT id, full_name, username, role, active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return unauthorized(res, 'User not found');
    }

    const user = result.rows[0];

    if (!user.active) {
      return unauthorized(res, 'Account is deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token has expired');
    }
    return unauthorized(res, 'Invalid token');
  }
}

/**
 * Require a specific role. Must be used after authenticateToken.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'Insufficient permissions');
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
