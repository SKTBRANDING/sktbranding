const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Testimonial = require('../models/Testimonial');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

// GET /api/testimonials
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;

    if (isMongoConnected()) {
      try {
        const filter = all === 'true' ? {} : { published: true };
        const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
        if (testimonials && testimonials.length) return res.json(testimonials);
      } catch (e) {
        console.warn('[Testimonial Route] Mongo find error:', e.message);
      }
    }

    const db = getJsonDb();
    let testimonials = Array.isArray(db.testimonials) ? [...db.testimonials] : [];
    if (all !== 'true') {
      testimonials = testimonials.filter((t) => t.published !== false);
    }
    return res.json(testimonials);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/testimonials
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { quote, author, role = '', company = '', avatar = '', rating = 5, published = true } = req.body;
    if (!quote || !author) {
      return res.status(400).json({ error: 'Quote and author name are required.' });
    }

    const newTestimonialData = {
      id: `test-${crypto.randomUUID().slice(0, 8)}`,
      quote: quote.trim(),
      author: author.trim(),
      role: role.trim(),
      company: company.trim(),
      avatar: avatar.trim(),
      rating: Number(rating) || 5,
      published,
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const newTestimonial = new Testimonial(newTestimonialData);
        await newTestimonial.save();
        return res.status(201).json(newTestimonial);
      } catch (e) {
        console.warn('[Testimonial Route] Mongo save error:', e.message);
      }
    }

    saveJsonDb((db) => {
      if (!Array.isArray(db.testimonials)) db.testimonials = [];
      db.testimonials.unshift(newTestimonialData);
      return db;
    });

    return res.status(201).json(newTestimonialData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/testimonials/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const item = await Testimonial.findOne({ id: req.params.id });
        if (item) {
          Object.assign(item, req.body);
          await item.save();
          return res.json(item);
        }
      } catch (e) {
        console.warn('[Testimonial Route] Mongo put error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.testimonials)) db.testimonials = [];
      const idx = db.testimonials.findIndex((t) => t.id === req.params.id);
      if (idx !== -1) {
        db.testimonials[idx] = { ...db.testimonials[idx], ...req.body };
        updated = db.testimonials[idx];
      }
      return db;
    });

    if (!updated) return res.status(404).json({ error: 'Testimonial not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/testimonials/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const deleted = await Testimonial.findOneAndDelete({ id: req.params.id });
        if (deleted) return res.json({ success: true, message: 'Testimonial deleted' });
      } catch (e) {
        console.warn('[Testimonial Route] Mongo delete error:', e.message);
      }
    }

    let found = false;
    saveJsonDb((db) => {
      if (!Array.isArray(db.testimonials)) db.testimonials = [];
      const len = db.testimonials.length;
      db.testimonials = db.testimonials.filter((t) => t.id !== req.params.id);
      found = db.testimonials.length < len;
      return db;
    });

    if (!found) return res.status(404).json({ error: 'Testimonial not found' });
    return res.json({ success: true, message: 'Testimonial deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
