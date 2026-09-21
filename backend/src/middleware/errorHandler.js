/**
 * Centralized Express error handler.
 * Must be registered LAST in the middleware chain.
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  // Validation errors from express-validator are handled in controllers,
  // but catch-all for other validation libraries.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced record does not exist' });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ success: false, message: 'Value violates a database constraint' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;
