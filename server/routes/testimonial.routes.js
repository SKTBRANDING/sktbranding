const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Testimonial = require('../models/Testimonial');
const { requireAdmin } = require('../middleware/auth');

// GET /api/testimonials
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;
    const filter = all === 'true' ? {} : { published: true };
    const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
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

    const newTestimonial = new Testimonial({
      id: `test-${crypto.randomUUID().slice(0, 8)}`,
      quote: quote.trim(),
      author: author.trim(),
      role: role.trim(),
      company: company.trim(),
      avatar: avatar.trim(),
      rating: Number(rating) || 5,
      published,
    });

    await newTestimonial.save();
    return res.status(201).json(newTestimonial);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/testimonials/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Testimonial.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Testimonial not found' });

    Object.assign(item, req.body);
    await item.save();
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/testimonials/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Testimonial.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Testimonial not found' });
    return res.json({ success: true, message: 'Testimonial deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
