const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Service = require('../models/Service');
const { requireAdmin } = require('../middleware/auth');

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;
    const filter = all === 'true' ? {} : { published: true };
    const services = await Service.find(filter).sort({ order: 1 });
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

    const newService = new Service({
      id: `serv-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      description: description.trim(),
      icon,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      order,
      published,
    });

    await newService.save();
    return res.status(201).json(newService);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/services/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const service = await Service.findOne({ id: req.params.id });
    if (!service) return res.status(404).json({ error: 'Service not found' });

    Object.assign(service, req.body);
    await service.save();
    return res.json(service);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Service.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Service not found' });
    return res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
