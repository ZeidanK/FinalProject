import jwt from 'jsonwebtoken';

/**
 * Middleware that validates the Bearer token and attaches decoded user to req.user.
 * Routes that must be public (login, register) should be mounted BEFORE this middleware.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    );
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * Middleware factory that restricts access to specific roles.
 * Usage: requireRole('admin') or requireRole('admin', 'accountant')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied.',
        message: `This action requires one of the following roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
}
