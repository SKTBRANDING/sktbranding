const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ADMIN_PASSWORD, JWT_SECRET, requireAdmin } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  
  // Set HTTP-only cookie
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ success: true, token, role: 'admin' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/verify and /api/auth/me
router.get('/verify', requireAdmin, (req, res) => {
  return res.json({ authenticated: true, role: 'admin' });
});

router.get('/me', (req, res) => {
  const token = req.cookies?.admin_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.json({ authenticated: false });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: true, role: 'admin' });
  } catch (err) {
    return res.json({ authenticated: false });
  }
});

module.exports = router;
