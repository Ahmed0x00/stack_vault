const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/db');
const { JWT_SECRET } = require('./auth');

/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, req.user is populated.
 * If no token (or invalid token), req.user = null and the request continues.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await queryOne(
      'SELECT id, email, username, balance, deposit_address, role, telegram_id, created_at FROM users WHERE id = ?',
      [decoded.id]
    );
    req.user = user || null;
  } catch (err) {
    // Invalid or expired token — treat as guest
    req.user = null;
  }

  next();
}

module.exports = { optionalAuth };
