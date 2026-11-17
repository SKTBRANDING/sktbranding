const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { requireAdmin } = require('../middleware/auth');

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
      await setting.save();
    }
    return res.json(setting);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', requireAdmin, async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting(req.body);
    } else {
      Object.assign(setting, req.body);
    }
    await setting.save();
    return res.json(setting);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
