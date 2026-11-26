const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ADMIN_PASSWORD, JWT_SECRET, requireAdmin, getAdminPassword } = require('../middleware/auth');
const { isMongoConnected, saveJsonDb } = require('../utils/dbFallback');
const Setting = require('../models/Setting');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { password } = req.body;
  const currentAdminPassword = await getAdminPassword();

  if (!password || (password !== currentAdminPassword && password !== ADMIN_PASSWORD)) {
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

// POST /api/auth/change-password
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const trimmed = newPassword.trim();

    if (isMongoConnected()) {
      try {
        let setting = await Setting.findOne();
        if (!setting) {
          setting = new Setting({ adminPassword: trimmed });
        } else {
          setting.adminPassword = trimmed;
        }
        await setting.save();
      } catch (e) {
        console.warn('[Auth] Mongo password save failed, using db.json:', e.message);
      }
    }

    saveJsonDb((db) => {
      if (!db.settings) db.settings = {};
      db.settings.adminPassword = trimmed;
      return db;
    });

    return res.json({
      success: true,
      message: 'Admin Studio password updated successfully!',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
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
