const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

function generateInvoiceNumber(existingCount = 0) {
  const year = new Date().getFullYear();
  const num = String(existingCount + 1).padStart(3, '0');
  return `SKT-INV-${year}-${num}`;
}

function calculateInvoiceFinancials(items = [], taxRate = 0, discountRate = 0, amountPaid = 0) {
  const calculatedItems = (items || []).map((item, idx) => {
    const qty = Math.max(0, Number(item.quantity) || 1);
    const rate = Math.max(0, Number(item.rate) || 0);
    const amount = Number((qty * rate).toFixed(2));
    return {
      id: item.id || `item-${Date.now()}-${idx}`,
      description: String(item.description || '').trim(),
      category: item.category || 'Branding',
      quantity: qty,
      rate: rate,
      amount: amount,
    };
  });

  const subtotal = Number(calculatedItems.reduce((acc, it) => acc + it.amount, 0).toFixed(2));
  const tRate = Math.max(0, Number(taxRate) || 0);
  const dRate = Math.max(0, Number(discountRate) || 0);

  const discountAmount = Number(((subtotal * dRate) / 100).toFixed(2));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(((taxable * tRate) / 100).toFixed(2));
  const total = Number((taxable + taxAmount).toFixed(2));

  const paid = Math.max(0, Number(amountPaid) || 0);
  const balanceDue = Number(Math.max(0, total - paid).toFixed(2));

  return {
    items: calculatedItems,
    subtotal,
    taxRate: tRate,
    taxAmount,
    discountRate: dRate,
    discountAmount,
    total,
    amountPaid: paid,
    balanceDue,
  };
}

// ==========================================
// GET /api/invoices
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { status, client, search } = req.query;

    if (isMongoConnected()) {
      try {
        const filter = {};
        if (status && status !== 'all') filter.status = status;
        if (client) filter.clientName = { $regex: client, $options: 'i' };
        if (search) {
          filter.$or = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { clientName: { $regex: search, $options: 'i' } },
            { clientCompany: { $regex: search, $options: 'i' } },
            { projectName: { $regex: search, $options: 'i' } },
          ];
        }

        const invoices = await Invoice.find(filter).sort({ issueDate: -1, createdAt: -1 });
        if (invoices && invoices.length) return res.json(invoices);
      } catch (e) {
        console.warn('[Invoice Route] Mongo query error, reading json fallback:', e.message);
      }
    }

    const db = getJsonDb();
    let invoices = Array.isArray(db.invoices) ? [...db.invoices] : [];

    if (status && status !== 'all') {
      invoices = invoices.filter((inv) => inv.status === status);
    }
    if (client) {
      const cLower = client.toLowerCase();
      invoices = invoices.filter((inv) => (inv.clientName || '').toLowerCase().includes(cLower));
    }
    if (search) {
      const sLower = search.toLowerCase();
      invoices = invoices.filter(
        (inv) =>
          (inv.invoiceNumber || '').toLowerCase().includes(sLower) ||
          (inv.clientName || '').toLowerCase().includes(sLower) ||
          (inv.clientCompany || '').toLowerCase().includes(sLower) ||
          (inv.projectName || '').toLowerCase().includes(sLower)
      );
    }

    invoices.sort((a, b) => new Date(b.issueDate || b.createdAt).getTime() - new Date(a.issueDate || a.createdAt).getTime());
    return res.json(invoices);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GET /api/invoices/:id
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      try {
        const invoice = await Invoice.findOne({
          $or: [{ id }, { invoiceNumber: id }],
        });
        if (invoice) return res.json(invoice);
      } catch (e) {
        console.warn('[Invoice Route] Mongo findOne error:', e.message);
      }
    }

    const db = getJsonDb();
    const invoices = Array.isArray(db.invoices) ? db.invoices : [];
    const invoice = invoices.find((inv) => inv.id === id || inv.invoiceNumber === id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/invoices
// ==========================================
router.post('/', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.clientName || !body.clientName.trim()) {
      return res.status(400).json({ error: 'Client name is required.' });
    }

    const db = getJsonDb();
    const existingCount = Array.isArray(db.invoices) ? db.invoices.length : 0;

    const id = body.id || `inv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const invoiceNumber = (body.invoiceNumber && body.invoiceNumber.trim()) || generateInvoiceNumber(existingCount);

    const financials = calculateInvoiceFinancials(
      body.items || [],
      body.taxRate || 0,
      body.discountRate || 0,
      body.amountPaid || 0
    );

    let status = body.status || 'pending';
    if (financials.balanceDue <= 0 && financials.total > 0) {
      status = 'paid';
    } else if (financials.amountPaid > 0 && financials.balanceDue > 0) {
      status = 'partially_paid';
    }

    const newInvoiceData = {
      id,
      invoiceNumber,
      clientId: body.clientId || '',
      clientName: body.clientName.trim(),
      clientEmail: (body.clientEmail || '').trim().toLowerCase(),
      clientPhone: (body.clientPhone || '').trim(),
      clientCompany: (body.clientCompany || '').trim(),
      clientAddress: (body.clientAddress || '').trim(),
      projectId: body.projectId || '',
      projectName: (body.projectName || '').trim(),
      issueDate: body.issueDate || new Date().toISOString().split('T')[0],
      dueDate: body.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...financials,
      status,
      currency: (body.currency || 'INR').toUpperCase(),
      paymentMethod: body.paymentMethod || 'bank_transfer',
      paymentDetails: (body.paymentDetails || '').trim(),
      notes: (body.notes || '').trim(),
      paidAt: status === 'paid' ? (body.paidAt || new Date().toISOString()) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const created = await Invoice.create(newInvoiceData);
        saveJsonDb((currentDb) => {
          if (!Array.isArray(currentDb.invoices)) currentDb.invoices = [];
          currentDb.invoices.unshift(created.toObject ? created.toObject() : newInvoiceData);
          return currentDb;
        });
        return res.status(201).json(created);
      } catch (e) {
        console.warn('[Invoice Route] Mongo create failed, saving to json:', e.message);
      }
    }

    saveJsonDb((currentDb) => {
      if (!Array.isArray(currentDb.invoices)) currentDb.invoices = [];
      currentDb.invoices.unshift(newInvoiceData);
      return currentDb;
    });

    return res.status(201).json(newInvoiceData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUT /api/invoices/:id
// ==========================================
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const financials = calculateInvoiceFinancials(
      body.items || [],
      body.taxRate || 0,
      body.discountRate || 0,
      body.amountPaid || 0
    );

    let status = body.status || 'pending';
    if (financials.balanceDue <= 0 && financials.total > 0) {
      status = 'paid';
    } else if (financials.amountPaid > 0 && financials.balanceDue > 0) {
      status = 'partially_paid';
    }

    const updates = {
      ...(body.invoiceNumber ? { invoiceNumber: body.invoiceNumber.trim() } : {}),
      ...(body.clientName ? { clientName: body.clientName.trim() } : {}),
      ...(body.clientEmail !== undefined ? { clientEmail: body.clientEmail.trim().toLowerCase() } : {}),
      ...(body.clientPhone !== undefined ? { clientPhone: body.clientPhone.trim() } : {}),
      ...(body.clientCompany !== undefined ? { clientCompany: body.clientCompany.trim() } : {}),
      ...(body.clientAddress !== undefined ? { clientAddress: body.clientAddress.trim() } : {}),
      ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
      ...(body.projectName !== undefined ? { projectName: body.projectName.trim() } : {}),
      ...(body.issueDate ? { issueDate: body.issueDate } : {}),
      ...(body.dueDate ? { dueDate: body.dueDate } : {}),
      ...financials,
      status,
      ...(body.currency ? { currency: body.currency.toUpperCase() } : {}),
      ...(body.paymentMethod ? { paymentMethod: body.paymentMethod } : {}),
      ...(body.paymentDetails !== undefined ? { paymentDetails: body.paymentDetails.trim() } : {}),
      ...(body.notes !== undefined ? { notes: body.notes.trim() } : {}),
      paidAt: status === 'paid' ? (body.paidAt || new Date().toISOString()) : null,
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const updated = await Invoice.findOneAndUpdate(
          { $or: [{ id }, { invoiceNumber: id }] },
          { $set: updates },
          { new: true }
        );
        if (updated) {
          saveJsonDb((currentDb) => {
            if (!Array.isArray(currentDb.invoices)) currentDb.invoices = [];
            const idx = currentDb.invoices.findIndex((inv) => inv.id === id || inv.invoiceNumber === id);
            if (idx !== -1) {
              currentDb.invoices[idx] = updated.toObject ? updated.toObject() : { ...currentDb.invoices[idx], ...updates };
            }
            return currentDb;
          });
          return res.json(updated);
        }
      } catch (e) {
        console.warn('[Invoice Route] Mongo update error:', e.message);
      }
    }

    let updatedInvoice = null;
    saveJsonDb((currentDb) => {
      if (!Array.isArray(currentDb.invoices)) currentDb.invoices = [];
      const idx = currentDb.invoices.findIndex((inv) => inv.id === id || inv.invoiceNumber === id);
      if (idx !== -1) {
        currentDb.invoices[idx] = {
          ...currentDb.invoices[idx],
          ...updates,
        };
        updatedInvoice = currentDb.invoices[idx];
      }
      return currentDb;
    });

    if (!updatedInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(updatedInvoice);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PATCH /api/invoices/:id/payment (Record a payment)
// ==========================================
router.patch('/:id/payment', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDetails, date, notes } = req.body || {};

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'A valid positive payment amount is required.' });
    }

    const db = getJsonDb();
    const invoices = Array.isArray(db.invoices) ? db.invoices : [];
    let existing = invoices.find((inv) => inv.id === id || inv.invoiceNumber === id);

    if (isMongoConnected()) {
      try {
        const mongoInv = await Invoice.findOne({ $or: [{ id }, { invoiceNumber: id }] });
        if (mongoInv) existing = mongoInv;
      } catch (e) {
        console.warn('[Invoice Route] Mongo lookup error:', e.message);
      }
    }

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const currentPaid = Number(existing.amountPaid || 0);
    const newPaid = Number((currentPaid + payAmount).toFixed(2));
    const total = Number(existing.total || 0);
    const newBalance = Number(Math.max(0, total - newPaid).toFixed(2));

    const status = newBalance <= 0 ? 'paid' : 'partially_paid';
    const paidAt = status === 'paid' ? (date || new Date().toISOString()) : existing.paidAt;

    const paymentNote = notes ? `\n[Payment ${new Date().toLocaleDateString()}]: ${notes}` : '';
    const combinedNotes = (existing.notes || '') + paymentNote;

    const updates = {
      amountPaid: newPaid,
      balanceDue: newBalance,
      status,
      paidAt,
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(paymentDetails ? { paymentDetails: paymentDetails.trim() } : {}),
      notes: combinedNotes.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const updated = await Invoice.findOneAndUpdate(
          { $or: [{ id }, { invoiceNumber: id }] },
          { $set: updates },
          { new: true }
        );
        if (updated) {
          saveJsonDb((currentDb) => {
            if (!Array.isArray(currentDb.invoices)) currentDb.invoices = [];
            const idx = currentDb.invoices.findIndex((inv) => inv.id === id || inv.invoiceNumber === id);
            if (idx !== -1) currentDb.invoices[idx] = updated.toObject ? updated.toObject() : { ...currentDb.invoices[idx], ...updates };
            return currentDb;
          });
          return res.json(updated);
        }
      } catch (e) {
        console.warn('[Invoice Route] Mongo payment error:', e.message);
      }
    }

    let updatedInvoice = null;
    saveJsonDb((currentDb) => {
      if (!Array.isArray(currentDb.invoices)) currentDb.invoices = [];
      const idx = currentDb.invoices.findIndex((inv) => inv.id === id || inv.invoiceNumber === id);
      if (idx !== -1) {
        currentDb.invoices[idx] = {
          ...currentDb.invoices[idx],
          ...updates,
        };
        updatedInvoice = currentDb.invoices[idx];
      }
      return currentDb;
    });

    return res.json(updatedInvoice);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DELETE /api/invoices/:id
// ==========================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      try {
        await Invoice.findOneAndDelete({ $or: [{ id }, { invoiceNumber: id }] });
      } catch (e) {
        console.warn('[Invoice Route] Mongo delete error:', e.message);
      }
    }

    let found = false;
    saveJsonDb((currentDb) => {
      if (!Array.isArray(currentDb.invoices)) currentDb.invoices = [];
      const initialLen = currentDb.invoices.length;
      currentDb.invoices = currentDb.invoices.filter((inv) => inv.id !== id && inv.invoiceNumber !== id);
      found = currentDb.invoices.length < initialLen;
      return currentDb;
    });

    return res.json({ success: true, message: 'Invoice removed successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
