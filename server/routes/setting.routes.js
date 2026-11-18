const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const setting = await Setting.findOne();
        if (setting) return res.json(setting);
      } catch (e) {
        console.warn('[Setting Route] Mongo findOne error, falling back to db.json:', e.message);
      }
    }
    const db = getJsonDb();
    return res.json(db.settings || {});
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        let setting = await Setting.findOne();
        if (!setting) {
          setting = new Setting(req.body);
        } else {
          Object.assign(setting, req.body);
        }
        await setting.save();
        return res.json(setting);
      } catch (e) {
        console.warn('[Setting Route] Mongo update failed, persisting in db.json:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      db.settings = { ...(db.settings || {}), ...req.body };
      updated = db.settings;
      return db;
    });

    return res.json(updated || req.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
