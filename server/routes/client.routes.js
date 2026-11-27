const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Client = require('../models/Client');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

const DEFAULT_CLIENTS = [
  {
    id: 'client-baithulrasa',
    name: 'BAITHULRASA',
    company: 'Baithulrasa Hospitality & Estate',
    phone: '+91 9544931226',
    email: 'accounts@baithulrasa.com',
    address: 'Level 42, Al Saada Tower, Downtown Dubai, UAE',
    notes: 'Premium luxury hospitality & lifestyle client',
    serviceRates: [
      { serviceName: 'Poster Design', rate: 300, category: 'Poster Design' },
      { serviceName: 'Video / Motion Graphics', rate: 500, category: 'Video' },
      { serviceName: 'Social Media Post & Creatives', rate: 300, category: 'Social Media' },
      { serviceName: 'Logo Design & Monogram', rate: 1500, category: 'Logo Design' },
      { serviceName: 'Brand Identity & Guidelines', rate: 3500, category: 'Branding' },
      { serviceName: 'Packaging & Label Design', rate: 2000, category: 'Packaging' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        let clients = await Client.find().sort({ name: 1 });
        if (clients.length === 0) {
          clients = await Client.insertMany(DEFAULT_CLIENTS);
        }
        return res.json(clients);
      } catch (err) {
        console.warn('[MongoDB clients error, fallback to JSON db]:', err.message);
      }
    }

    const db = getJsonDb();
    if (!Array.isArray(db.clients) || db.clients.length === 0) {
      db.clients = DEFAULT_CLIENTS;
      saveJsonDb(db);
    }
    return res.json(db.clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Failed to retrieve clients list' });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const { name, logo, company, phone, email, address, notes, serviceRates } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Client name is required.' });
    }

    const clientPayload = {
      name: name.trim(),
      logo: (logo || '').trim(),
      company: (company || '').trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim().toLowerCase(),
      address: (address || '').trim(),
      notes: (notes || '').trim(),
      serviceRates: Array.isArray(serviceRates) && serviceRates.length > 0
        ? serviceRates.map((s) => ({
            serviceName: String(s.serviceName || '').trim(),
            rate: Math.max(0, Number(s.rate) || 0),
            category: s.category || 'Custom',
          }))
        : [
            { serviceName: 'Poster Design', rate: 300, category: 'Poster Design' },
            { serviceName: 'Video / Motion Graphics', rate: 500, category: 'Video' },
          ],
    };

    if (isMongoConnected()) {
      try {
        const created = await Client.create(clientPayload);
        return res.status(201).json(created);
      } catch (err) {
        console.warn('[MongoDB Client create fallback]:', err.message);
      }
    }

    const db = getJsonDb();
    if (!Array.isArray(db.clients)) db.clients = [];
    const newClient = {
      id: `client-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      ...clientPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.clients.unshift(newClient);
    saveJsonDb(db);
    return res.status(201).json(newClient);
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo, company, phone, email, address, notes, serviceRates } = req.body;

    const updatePayload = {
      ...(name ? { name: name.trim() } : {}),
      ...(logo !== undefined ? { logo: String(logo).trim() } : {}),
      ...(company !== undefined ? { company: company.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
      ...(address !== undefined ? { address: address.trim() } : {}),
      ...(notes !== undefined ? { notes: notes.trim() } : {}),
      ...(Array.isArray(serviceRates)
        ? {
            serviceRates: serviceRates.map((s) => ({
              serviceName: String(s.serviceName || '').trim(),
              rate: Math.max(0, Number(s.rate) || 0),
              category: s.category || 'Custom',
            })),
          }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const updated = await Client.findByIdAndUpdate(id, updatePayload, { new: true });
        if (updated) return res.json(updated);
      } catch (err) {
        console.warn('[MongoDB Client update fallback]:', err.message);
      }
    }

    const db = getJsonDb();
    if (!Array.isArray(db.clients)) db.clients = [];
    const idx = db.clients.findIndex((c) => c.id === id || c._id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Client not found' });
    }

    db.clients[idx] = {
      ...db.clients[idx],
      ...updatePayload,
    };
    saveJsonDb(db);
    return res.json(db.clients[idx]);
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      try {
        await Client.findByIdAndDelete(id);
      } catch (err) {
        console.warn('[MongoDB Client delete fallback]:', err.message);
      }
    }

    const db = getJsonDb();
    if (Array.isArray(db.clients)) {
      db.clients = db.clients.filter((c) => c.id !== id && c._id !== id);
      saveJsonDb(db);
    }
    return res.json({ success: true, message: 'Client removed' });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
