const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Inquiry = require('../models/Inquiry');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

// GET /api/inquiries (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        if (inquiries && inquiries.length) return res.json(inquiries);
      } catch (e) {
        console.warn('[Inquiry Route] Mongo find error:', e.message);
      }
    }
    const db = getJsonDb();
    return res.json(db.inquiries || []);
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

    const newInquiryData = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      company: company.trim(),
      service: service.trim(),
      description: description.trim(),
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const newInquiry = new Inquiry(newInquiryData);
        await newInquiry.save();
        return res.status(201).json({ success: true, message: 'Your commission inquiry has been received.', inquiry: newInquiry });
      } catch (e) {
        console.warn('[Inquiry Route] Mongo save error:', e.message);
      }
    }

    saveJsonDb((db) => {
      if (!Array.isArray(db.inquiries)) db.inquiries = [];
      db.inquiries.unshift(newInquiryData);
      return db;
    });

    return res.status(201).json({ success: true, message: 'Your commission inquiry has been received.', inquiry: newInquiryData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/inquiries/:id (Update status / notes)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (isMongoConnected()) {
      try {
        const inquiry = await Inquiry.findOne({ id: req.params.id });
        if (inquiry) {
          if (status !== undefined) inquiry.status = status;
          if (notes !== undefined) inquiry.notes = notes;
          await inquiry.save();
          return res.json(inquiry);
        }
      } catch (e) {
        console.warn('[Inquiry Route] Mongo put error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.inquiries)) db.inquiries = [];
      const idx = db.inquiries.findIndex((i) => i.id === req.params.id);
      if (idx !== -1) {
        if (status !== undefined) db.inquiries[idx].status = status;
        if (notes !== undefined) db.inquiries[idx].notes = notes;
        updated = db.inquiries[idx];
      }
      return db;
    });

    if (!updated) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inquiries/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const deleted = await Inquiry.findOneAndDelete({ id: req.params.id });
        if (deleted) return res.json({ success: true, message: 'Inquiry deleted' });
      } catch (e) {
        console.warn('[Inquiry Route] Mongo delete error:', e.message);
      }
    }

    let found = false;
    saveJsonDb((db) => {
      if (!Array.isArray(db.inquiries)) db.inquiries = [];
      const len = db.inquiries.length;
      db.inquiries = db.inquiries.filter((i) => i.id !== req.params.id);
      found = db.inquiries.length < len;
      return db;
    });

    if (!found) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json({ success: true, message: 'Inquiry deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
