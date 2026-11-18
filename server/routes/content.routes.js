const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

// GET /api/content
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const content = await Content.findOne();
        if (content) return res.json(content);
      } catch (e) {
        console.warn('[Content Route] Mongo findOne error, falling back to db.json:', e.message);
      }
    }
    const db = getJsonDb();
    return res.json(db.content || {});
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/content
router.put('/', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        let content = await Content.findOne();
        if (!content) {
          content = new Content(req.body);
        } else {
          Object.assign(content, req.body);
        }
        await content.save();
        return res.json(content);
      } catch (e) {
        console.warn('[Content Route] Mongo update failed, persisting in db.json:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      db.content = { ...(db.content || {}), ...req.body };
      updated = db.content;
      return db;
    });

    return res.json(updated || req.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
