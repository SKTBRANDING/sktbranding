const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ClientReport = require('../models/ClientReport');
const Client = require('../models/Client');
const Task = require('../models/Task');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

function cleanStringKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getStandardServiceName(category, title) {
  const combined = `${category || ''} ${title || ''}`.toLowerCase();
  if (/poster/i.test(combined)) return 'SOCIAL MEDIA CREATIVE POSTERS';
  if (/sticker|rate/i.test(combined)) return 'RATE STICKER';
  if (/menu|card/i.test(combined)) return 'MENU CARD DESIGN';
  if (/growth|metric|analytic/i.test(combined)) return 'SOCIAL MEDIA GROWTH';
  if (/video|motion|reel|animation/i.test(combined)) return 'VIDEO & MOTION DELIVERABLES';
  if (/logo|monogram|icon/i.test(combined)) return 'BRAND IDENTITY & LOGOS';
  if (/packag|label|box/i.test(combined)) return 'PACKAGING & LABEL DESIGN';
  if (/brochure|catalog|lookbook|print/i.test(combined)) return 'BROCHURE & PRINT DESIGN';
  if (/social|creative|banner|flyer/i.test(combined)) return 'SOCIAL MEDIA CREATIVE POSTERS';
  return (category || title || 'Creative Deliverable').toUpperCase().trim();
}

// Default luxury narrative text matching reference report
const DEFAULT_NARRATIVE_TEXT = `We take immense pride in presenting the comprehensive visual deliverables and creative campaign progress executed across this billing cycle. Every assignment was strategically developed to elevate brand recall, reinforce market authority, and drive targeted consumer engagement across digital touchpoints.

Our creative trajectory continues to prioritize strategic visual direction, coherent brand aesthetics, and maximum campaign resonance. Consistent aesthetics and high-fidelity typography selections across all creative formats have solidified an unmistakable and polished visual identity. Visual cohesion is paramount in capturing consumer mindshare, and this month's execution guarantees prominent standing against regional competition.

Through strategic communication architecture, high-impact poster storytelling, and meticulously crafted promotional collateral, we maintained consistent brand visibility and premium market positioning. Every visual asset was engineered to resonate with core demographics, supporting measurable brand growth and sustained customer loyalty.

Moving forward, our studio remains committed to introducing progressive creative assets, refined brand collateral, and forward-looking visual strategies that command lasting attention across every digital and retail medium.`;

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const { client, month } = req.query;

    if (isMongoConnected()) {
      try {
        const query = {};
        if (client) query.clientName = new RegExp(client, 'i');
        if (month) query.reportMonth = new RegExp(month, 'i');
        const reports = await ClientReport.find(query).sort({ updatedAt: -1 });
        if (reports.length > 0) return res.json(reports);
      } catch (mongoErr) {
        console.warn('[Report Route] Mongo get error:', mongoErr.message);
      }
    }

    const db = getJsonDb();
    let reports = Array.isArray(db.reports) ? db.reports : [];

    if (client) {
      const cKey = cleanStringKey(client);
      reports = reports.filter((r) => cleanStringKey(r.clientName).includes(cKey) || cKey.includes(cleanStringKey(r.clientName)));
    }
    if (month) {
      const mKey = cleanStringKey(month);
      reports = reports.filter((r) => cleanStringKey(r.reportMonth).includes(mKey));
    }

    return res.json(reports);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve reports: ' + err.message });
  }
});

// GET /api/reports/:id
router.get('/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const report = await ClientReport.findOne({ id: req.params.id });
        if (report) return res.json(report);
      } catch (err) {}
    }

    const db = getJsonDb();
    const reports = Array.isArray(db.reports) ? db.reports : [];
    const report = reports.find((r) => r.id === req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/reports
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      clientName,
      clientId = '',
      clientLogo = '',
      reportMonth,
      reportTitle,
      executiveSummaryTitle,
      executiveSummaryText,
      sections = [],
      thankYouTitle = 'THANK YOU',
    } = req.body;

    if (!clientName || !clientName.trim()) {
      return res.status(400).json({ error: 'Client name is required.' });
    }

    const now = new Date();
    const month = (reportMonth || now.toLocaleString('en-US', { month: 'long', year: 'numeric' })).trim();
    const id = `rep-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const finalTitle = reportTitle || `${clientName.toUpperCase()} MONTHLY REPORT`;
    const finalSummaryTitle = executiveSummaryTitle || `Social Media Report – ${month}`;
    const finalSummaryText = executiveSummaryText || DEFAULT_NARRATIVE_TEXT;

    const newReport = {
      id,
      clientId,
      clientName: clientName.trim(),
      clientLogo,
      reportMonth: month,
      reportTitle: finalTitle,
      executiveSummaryTitle: finalSummaryTitle,
      executiveSummaryText: finalSummaryText,
      sections: Array.isArray(sections) ? sections : [],
      thankYouTitle,
      status: 'finalized',
      theme: {
        coverBackground: 'dark_gradient',
        pageBackground: '#FAF7F2',
        primaryColor: '#D60000',
        textColor: '#1A1A1A',
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const doc = new ClientReport(newReport);
        await doc.save();
      } catch (err) {
        console.warn('[Report Route] Mongo create error:', err.message);
      }
    }

    saveJsonDb((db) => {
      if (!Array.isArray(db.reports)) db.reports = [];
      db.reports.unshift(newReport);
      return db;
    });

    return res.status(201).json(newReport);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create report: ' + err.message });
  }
});

// PUT /api/reports/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    body.updatedAt = new Date().toISOString();

    if (isMongoConnected()) {
      try {
        const updatedDoc = await ClientReport.findOneAndUpdate(
          { id: req.params.id },
          { $set: body },
          { new: true }
        );
        if (updatedDoc) return res.json(updatedDoc);
      } catch (err) {
        console.warn('[Report Route] Mongo update error:', err.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.reports)) db.reports = [];
      const idx = db.reports.findIndex((r) => r.id === req.params.id);
      if (idx !== -1) {
        db.reports[idx] = { ...db.reports[idx], ...body };
        updated = db.reports[idx];
      }
      return db;
    });

    if (!updated) return res.status(404).json({ error: 'Report not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update report: ' + err.message });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        await ClientReport.findOneAndDelete({ id: req.params.id });
      } catch (err) {}
    }

    saveJsonDb((db) => {
      if (!Array.isArray(db.reports)) db.reports = [];
      db.reports = db.reports.filter((r) => r.id !== req.params.id);
      return db;
    });

    return res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/sync-tasks (Compile approved tasks into report)
router.post('/sync-tasks', requireAdmin, async (req, res) => {
  try {
    const { clientName, reportMonth } = req.body;
    if (!clientName) return res.status(400).json({ error: 'clientName required' });

    const cKey = cleanStringKey(clientName);
    const db = getJsonDb();
    const tasks = (db.tasks || []).filter((t) => {
      if (t.status !== 'completed') return false;
      const tKey = cleanStringKey(t.client);
      return tKey === cKey || tKey.includes(cKey) || cKey.includes(tKey);
    });

    // Extract images from tasks
    const newItemsByService = {};
    tasks.forEach((t) => {
      const serviceTitle = getStandardServiceName(t.serviceCategory, t.title);
      if (!newItemsByService[serviceTitle]) newItemsByService[serviceTitle] = [];

      const submissionFiles = t.submissions?.[0]?.files || [];
      const referenceFiles = t.referenceFiles || [];
      const allFiles = [...submissionFiles, ...referenceFiles];

      allFiles.forEach((f) => {
        if (f.url && (f.category === 'image' || f.type?.includes('image') || /\.(png|jpg|jpeg|webp)$/i.test(f.url))) {
          if (!newItemsByService[serviceTitle].some((it) => it.imageUrl === f.url)) {
            newItemsByService[serviceTitle].push({
              id: `item-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
              taskId: t.id,
              title: t.title || serviceTitle,
              imageUrl: f.url,
              category: t.serviceCategory || serviceTitle,
            });
          }
        }
      });
    });

    // Find or create report
    let report = (db.reports || []).find((r) => {
      const rKey = cleanStringKey(r.clientName);
      return rKey === cKey || rKey.includes(cKey) || cKey.includes(rKey);
    });

    const now = new Date();
    const month = reportMonth || (report ? report.reportMonth : now.toLocaleString('en-US', { month: 'long', year: 'numeric' }));

    if (!report) {
      // Find client logo if available
      const clientObj = (db.clients || []).find((c) => cleanStringKey(c.name) === cKey);
      report = {
        id: `rep-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        clientId: clientObj?.id || '',
        clientName: clientObj?.name || clientName.toUpperCase(),
        clientLogo: clientObj?.logo || '',
        reportMonth: month,
        reportTitle: `${(clientObj?.name || clientName).toUpperCase()} MONTHLY REPORT`,
        executiveSummaryTitle: `Social Media Report – ${month}`,
        executiveSummaryText: DEFAULT_NARRATIVE_TEXT,
        sections: [],
        thankYouTitle: 'THANK YOU',
        status: 'finalized',
        theme: {
          coverBackground: 'dark_gradient',
          pageBackground: '#FAF7F2',
          primaryColor: '#D60000',
          textColor: '#1A1A1A',
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      if (!Array.isArray(db.reports)) db.reports = [];
      db.reports.unshift(report);
    }

    // Merge new items into report sections without duplicating service titles
    if (!Array.isArray(report.sections)) report.sections = [];
    Object.keys(newItemsByService).forEach((serviceTitle) => {
      let existingSection = report.sections.find(
        (s) => s.title.toUpperCase() === serviceTitle.toUpperCase()
      );
      if (existingSection) {
        newItemsByService[serviceTitle].forEach((newItem) => {
          if (!existingSection.items.some((it) => it.imageUrl === newItem.imageUrl)) {
            existingSection.items.push(newItem);
          }
        });
      } else {
        report.sections.push({
          id: `sec-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
          title: serviceTitle,
          category: serviceTitle,
          items: newItemsByService[serviceTitle],
        });
      }
    });

    report.updatedAt = new Date().toISOString();
    saveJsonDb(db);

    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to sync tasks: ' + err.message });
  }
});

module.exports = router;
