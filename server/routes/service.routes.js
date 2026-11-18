const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Service = require('../models/Service');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;

    if (isMongoConnected()) {
      try {
        const filter = all === 'true' ? {} : { published: true };
        const services = await Service.find(filter).sort({ order: 1 });
        if (services && services.length) return res.json(services);
      } catch (e) {
        console.warn('[Service Route] Mongo find error:', e.message);
      }
    }

    const db = getJsonDb();
    let services = Array.isArray(db.services) ? [...db.services] : [];
    if (all !== 'true') {
      services = services.filter((s) => s.published !== false);
    }
    services.sort((a, b) => (a.order || 0) - (b.order || 0));
    return res.json(services);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/services
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, description, icon = 'Sparkles', deliverables = [], order = 0, published = true } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const newServiceData = {
      id: `serv-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      description: description.trim(),
      icon,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      order,
      published,
    };

    if (isMongoConnected()) {
      try {
        const newService = new Service(newServiceData);
        await newService.save();
        return res.status(201).json(newService);
      } catch (e) {
        console.warn('[Service Route] Mongo save error:', e.message);
      }
    }

    saveJsonDb((db) => {
      if (!Array.isArray(db.services)) db.services = [];
      db.services.push(newServiceData);
      return db;
    });

    return res.status(201).json(newServiceData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/services/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const service = await Service.findOne({ id: req.params.id });
        if (service) {
          Object.assign(service, req.body);
          await service.save();
          return res.json(service);
        }
      } catch (e) {
        console.warn('[Service Route] Mongo put error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.services)) db.services = [];
      const idx = db.services.findIndex((s) => s.id === req.params.id);
      if (idx !== -1) {
        db.services[idx] = { ...db.services[idx], ...req.body };
        updated = db.services[idx];
      }
      return db;
    });

    if (!updated) return res.status(404).json({ error: 'Service not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const deleted = await Service.findOneAndDelete({ id: req.params.id });
        if (deleted) return res.json({ success: true, message: 'Service deleted' });
      } catch (e) {
        console.warn('[Service Route] Mongo delete error:', e.message);
      }
    }

    let found = false;
    saveJsonDb((db) => {
      if (!Array.isArray(db.services)) db.services = [];
      const len = db.services.length;
      db.services = db.services.filter((s) => s.id !== req.params.id);
      found = db.services.length < len;
      return db;
    });

    if (!found) return res.status(404).json({ error: 'Service not found' });
    return res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
