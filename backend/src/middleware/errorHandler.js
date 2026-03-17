export function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({ error: 'Database constraint violation' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Validation errors
  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }

  // Default
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(status).json({ error: message });
}
