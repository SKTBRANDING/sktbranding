const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Inquiry = require('../models/Inquiry');
const { requireAdmin } = require('../middleware/auth');

// GET /api/inquiries (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    return res.json(inquiries);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/inquiries (Public commission form)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone = '', company = '', service = 'General Commission', description } = req.body;

    if (!name || !email || !description) {
      return res.status(400).json({ error: 'Name, email, and project brief description are required.' });
    }

    const newInquiry = new Inquiry({
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      company: company.trim(),
      service: service.trim(),
      description: description.trim(),
      status: 'New',
    });

    await newInquiry.save();
    return res.status(201).json({ success: true, message: 'Your commission inquiry has been received.', inquiry: newInquiry });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/inquiries/:id (Update status / notes)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findOne({ id: req.params.id });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const { status, notes } = req.body;
    if (status !== undefined) inquiry.status = status;
    if (notes !== undefined) inquiry.notes = notes;

    await inquiry.save();
    return res.json(inquiry);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inquiries/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Inquiry.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json({ success: true, message: 'Inquiry deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
