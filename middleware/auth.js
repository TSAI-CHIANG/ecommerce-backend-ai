import jwt from 'jsonwebtoken';
import { AUTH_ENABLED, DEFAULT_USER_ID, JWT_SECRET } from '../config/auth.js';
import { BlockedToken } from '../models/BlockedToken.js';

/**
 * Authentication middleware that handles both auth-enabled and auth-disabled modes.
 *
 * When AUTH_ENABLED is false:
 *   - Sets req.userId to DEFAULT_USER_ID for all requests
 *   - All routes work without authentication (original behavior)
 *
 * When AUTH_ENABLED is true:
 *   - Extracts JWT from HttpOnly cookie
 *   - Checks if token is blocklisted (logged out)
 *   - Sets req.userId from token if valid, otherwise null
 */
export async function setUserId(req, res, next) {
  if (!AUTH_ENABLED) {
    // Auth is OFF - use default user ID for backwards compatibility
    req.userId = DEFAULT_USER_ID;
    return next();
  }

  // Auth is ON - extract JWT from cookie
  const token = req.cookies?.token;

  if (!token) {
    req.userId = null;
    return next();
  }

  try {
    // Check if token is blocklisted
    const blocked = await BlockedToken.findOne({ where: { token } });
    if (blocked) {
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
  } catch (err) {
    // Invalid token - userId stays null
    req.userId = null;
  }

  next();
}

/**
 * Middleware that requires authentication when AUTH_ENABLED is true.
 * When AUTH_ENABLED is false, this middleware does nothing (allows all requests).
 */
export function requireAuth(req, res, next) {
  if (!AUTH_ENABLED) {
    // Auth is OFF - allow all requests
    return next();
  }

  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}

/**
 * Middleware that requires the user to be logged OUT (for login/register routes).
 * When AUTH_ENABLED is false, this middleware does nothing.
 */
export function requireLoggedOut(req, res, next) {
  if (!AUTH_ENABLED) {
    return next();
  }

  if (req.userId) {
    return res.status(400).json({ error: 'Already logged in' });
  }

  next();
}
