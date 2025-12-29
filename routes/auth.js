import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { BlockedToken } from '../models/BlockedToken.js';
import { requireAuth, requireLoggedOut } from '../middleware/auth.js';
import { AUTH_ENABLED, JWT_SECRET, JWT_EXPIRES_IN } from '../config/auth.js';

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Cookie options for JWT
const cookieOptions = {
  httpOnly: true,      // JavaScript can't access it (XSS protection)
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
};

// POST /api/auth/register - Register a new user
router.post('/register', requireLoggedOut, async (req, res) => {
  if (!AUTH_ENABLED) {
    return res.status(400).json({ error: 'Authentication is disabled' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password and create user
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash
    });

    // Generate JWT and set as HttpOnly cookie
    const token = generateToken(user);
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      id: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login - Log in an existing user
router.post('/login', requireLoggedOut, async (req, res) => {
  if (!AUTH_ENABLED) {
    return res.status(400).json({ error: 'Authentication is disabled' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT and set as HttpOnly cookie
    const token = generateToken(user);
    res.cookie('token', token, cookieOptions);

    res.json({
      id: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout - Log out the current user
router.post('/logout', requireAuth, async (req, res) => {
  if (!AUTH_ENABLED) {
    return res.status(400).json({ error: 'Authentication is disabled' });
  }

  try {
    const token = req.cookies?.token;

    if (token) {
      // Decode token to get expiration time
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000); // exp is in seconds

      // Add token to blocklist
      await BlockedToken.create({ token, expiresAt });
    }

    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/profile - Get current user info
router.get('/profile', requireAuth, async (req, res) => {
  if (!AUTH_ENABLED) {
    return res.status(400).json({ error: 'Authentication is disabled' });
  }

  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    res.json({
      id: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
