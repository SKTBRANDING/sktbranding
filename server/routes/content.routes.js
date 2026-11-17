const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { requireAdmin } = require('../middleware/auth');

// GET /api/content
router.get('/', async (req, res) => {
  try {
    let content = await Content.findOne();
    if (!content) {
      content = new Content();
      await content.save();
    }
    return res.json(content);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/content
router.put('/', requireAdmin, async (req, res) => {
  try {
    let content = await Content.findOne();
    if (!content) {
      content = new Content(req.body);
    } else {
      Object.assign(content, req.body);
    }
    await content.save();
    return res.json(content);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
