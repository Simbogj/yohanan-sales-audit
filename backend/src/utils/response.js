/**
 * Standardized API response helpers.
 */

const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

const created = (res, data) => {
  return res.status(201).json({ success: true, data });
};

const error = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};

const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({ success: false, message });
};

const unauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, message });
};

const forbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ success: false, message });
};

const serverError = (res, message = 'Internal server error') => {
  return res.status(500).json({ success: false, message });
};

module.exports = { success, created, error, notFound, unauthorized, forbidden, serverError };
