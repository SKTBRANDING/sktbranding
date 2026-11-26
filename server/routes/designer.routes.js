const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Designer = require('../models/Designer');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb, findDesignerFromMemory } = require('../utils/dbFallback');

function generateDesignerToken(name) {
  const clean = (name || 'designer').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10);
  const entropy = crypto.randomBytes(8).toString('hex');
  return `dsg_${clean}_${entropy}`;
}

async function findDesignerByTokenOrInput(rawInput) {
  if (!rawInput) return null;
  let str = String(rawInput).trim();

  // If a URL was passed, extract query parameter 'token'
  if (str.includes('token=')) {
    const match = str.match(/[?&]token=([^&#\s]+)/i) || str.match(/token=([a-zA-Z0-9_\-]+)/i);
    if (match && match[1]) {
      try {
        str = decodeURIComponent(match[1]).trim();
      } catch {
        str = match[1].trim();
      }
    }
  }

  // 1. Try MongoDB if connected
  if (isMongoConnected()) {
    try {
      let designer = await Designer.findOne({ token: str, status: 'active' });
      if (designer) return designer;

      const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      designer = await Designer.findOne({
        token: { $regex: `^${escaped}$`, $options: 'i' },
        status: 'active',
      });
      if (designer) return designer;

      if (str.length >= 4) {
        designer = await Designer.findOne({
          token: { $regex: `^${escaped}`, $options: 'i' },
          status: 'active',
        });
        if (designer) return designer;

        designer = await Designer.findOne({
          token: { $regex: escaped, $options: 'i' },
          status: 'active',
        });
        if (designer) return designer;
      }

      designer = await Designer.findOne({
        email: { $regex: `^${escaped}`, $options: 'i' },
        status: 'active',
      });
      if (designer) return designer;

      if (str.length >= 3) {
        designer = await Designer.findOne({
          name: { $regex: escaped, $options: 'i' },
          status: 'active',
        });
        if (designer) return designer;
      }
    } catch (e) {
      console.warn('[Designer Route] Mongo findOne error, falling back to db.json:', e.message);
    }
  }

  // 2. Fallback to resilient JSON dataset
  const memoryDesigner = findDesignerFromMemory(str);
  if (memoryDesigner) {
    return {
      ...memoryDesigner,
      save: async () => {},
    };
  }

  return null;
}

// ==========================================
// GET /api/designers/verify or /api/designer/verify
// ==========================================
router.get('/verify', async (req, res) => {
  try {
    const raw = req.query.token || req.headers['x-designer-token'] || req.cookies?.skt_designer_session;
    if (!raw) {
      return res.status(401).json({ error: 'No invitation access token provided.' });
    }

    const designer = await findDesignerByTokenOrInput(raw);
    if (!designer) {
      return res.status(401).json({ error: 'Invalid, deactivated, or revoked invitation link.' });
    }

    if (typeof designer.save === 'function') {
      designer.lastActiveAt = new Date();
      await designer.save();
    }

    return res.json({
      valid: true,
      designer: {
        id: designer.id,
        name: designer.name,
        email: designer.email,
        specialty: designer.specialty,
        avatar: designer.avatar,
        status: designer.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/designer/auth (Sign-in / establish session)
// ==========================================
router.post('/auth', async (req, res) => {
  try {
    const raw = req.body?.token || req.query?.token;
    if (!raw) {
      return res.status(400).json({ success: false, error: 'Invitation token is required.' });
    }

    const designer = await findDesignerByTokenOrInput(raw);
    if (!designer) {
      return res.status(401).json({ success: false, error: 'Invalid or revoked designer invitation token.' });
    }

    if (typeof designer.save === 'function') {
      designer.lastActiveAt = new Date();
      await designer.save();
    }

    res.cookie('skt_designer_session', designer.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token: designer.token,
      designer: {
        id: designer.id,
        name: designer.name,
        email: designer.email,
        specialty: designer.specialty,
        avatar: designer.avatar,
        status: designer.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// GET /api/designer/me
// ==========================================
router.get('/me', async (req, res) => {
  try {
    const raw = req.cookies?.skt_designer_session || req.headers['x-designer-token'];
    if (!raw) {
      return res.json({ authenticated: false, designer: null });
    }

    const designer = await findDesignerByTokenOrInput(raw);
    if (!designer) {
      return res.json({ authenticated: false, designer: null });
    }

    return res.json({
      authenticated: true,
      designer: {
        id: designer.id,
        name: designer.name,
        email: designer.email,
        specialty: designer.specialty,
        avatar: designer.avatar,
        status: designer.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DELETE /api/designer/auth (Logout)
// ==========================================
router.delete('/auth', (req, res) => {
  res.clearCookie('skt_designer_session');
  return res.json({ success: true, message: 'Designer session terminated.' });
});

// ==========================================
// GET /api/designers (Admin only)
// ==========================================
router.get('/', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const designers = await Designer.find().sort({ createdAt: -1 });
        if (designers && designers.length) {
          return res.json(designers);
        }
      } catch (e) {
        console.warn('[Designer Route] Mongo find error:', e.message);
      }
    }
    const db = getJsonDb();
    return res.json(db.designers || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/designers (Add new Designer)
// ==========================================
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, specialty = 'Brand Designer', avatar = '', notes = '', token: customToken, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Designer name and email are required.' });
    }

    const token = (customToken || password)?.trim() || generateDesignerToken(name);
    const newDesignerData = {
      id: `des-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      specialty: specialty.trim(),
      avatar: avatar.trim(),
      token,
      status: 'active',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const existing = await Designer.findOne({ email: email.trim().toLowerCase() });
        if (existing) {
          return res.status(409).json({ error: 'A designer with this email address already exists.' });
        }
        const newDesigner = new Designer(newDesignerData);
        await newDesigner.save();
        return res.status(201).json(newDesigner);
      } catch (e) {
        console.warn('[Designer Route] Mongo save failed, falling back to db.json:', e.message);
      }
    }

    // Save in json fallback
    saveJsonDb((db) => {
      if (!Array.isArray(db.designers)) db.designers = [];
      db.designers.unshift(newDesignerData);
      return db;
    });

    return res.status(201).json(newDesignerData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUT /api/designers/:id (Edit Designer Profile / Status / Password)
// ==========================================
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, email, specialty, avatar, status, notes, token, password } = req.body;
    const effectiveToken = (token || password)?.trim();

    if (isMongoConnected()) {
      try {
        const designer = await Designer.findOne({ id: req.params.id });
        if (designer) {
          if (name !== undefined) designer.name = name.trim();
          if (email !== undefined) designer.email = email.trim().toLowerCase();
          if (specialty !== undefined) designer.specialty = specialty.trim();
          if (avatar !== undefined) designer.avatar = avatar.trim();
          if (status !== undefined) designer.status = status;
          if (notes !== undefined) designer.notes = notes.trim();
          if (effectiveToken) designer.token = effectiveToken;
          await designer.save();
          return res.json(designer);
        }
      } catch (e) {
        console.warn('[Designer Route] Mongo put error:', e.message);
      }
    }

    let updatedDesigner = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.designers)) db.designers = [];
      const idx = db.designers.findIndex((d) => d.id === req.params.id);
      if (idx !== -1) {
        db.designers[idx] = {
          ...db.designers[idx],
          ...(name !== undefined && { name: name.trim() }),
          ...(email !== undefined && { email: email.trim().toLowerCase() }),
          ...(specialty !== undefined && { specialty: specialty.trim() }),
          ...(avatar !== undefined && { avatar: avatar.trim() }),
          ...(status !== undefined && { status }),
          ...(notes !== undefined && { notes: notes.trim() }),
          ...(effectiveToken && { token: effectiveToken }),
        };
        updatedDesigner = db.designers[idx];
      }
      return db;
    });

    if (!updatedDesigner) {
      return res.status(404).json({ error: 'Designer not found' });
    }
    return res.json(updatedDesigner);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/designers/:id/token (Customize or Regenerate Password / Token)
// ==========================================
router.post(['/:id/token', '/:id/regenerate-token'], requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { customToken, token, password } = req.body;
    const requestedToken = (customToken || token || password)?.trim();

    if (isMongoConnected()) {
      try {
        const designer = await Designer.findOne({ id });
        if (designer) {
          designer.token = requestedToken || generateDesignerToken(designer.name);
          designer.status = 'active';
          await designer.save();
          return res.json({
            success: true,
            message: requestedToken ? 'Designer access password customized successfully.' : 'Access link regenerated successfully.',
            token: designer.token,
            designer,
          });
        }
      } catch (e) {
        console.warn('[Designer Route] Mongo token regen error:', e.message);
      }
    }

    let updatedDesigner = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.designers)) db.designers = [];
      const idx = db.designers.findIndex((d) => d.id === id);
      if (idx !== -1) {
        const newToken = requestedToken || generateDesignerToken(db.designers[idx].name);
        db.designers[idx].token = newToken;
        db.designers[idx].status = 'active';
        updatedDesigner = db.designers[idx];
      }
      return db;
    });

    if (!updatedDesigner) {
      return res.status(404).json({ error: 'Designer not found' });
    }

    return res.json({
      success: true,
      message: requestedToken ? 'Designer access password customized successfully.' : 'Access link regenerated successfully.',
      token: updatedDesigner.token,
      designer: updatedDesigner,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
      designer: updatedDesigner,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DELETE /api/designers/:id
// ==========================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const deleted = await Designer.findOneAndDelete({ id: req.params.id });
        if (deleted) {
          return res.json({ success: true, message: 'Designer removed successfully.' });
        }
      } catch (e) {
        console.warn('[Designer Route] Mongo delete error:', e.message);
      }
    }

    let found = false;
    saveJsonDb((db) => {
      if (!Array.isArray(db.designers)) db.designers = [];
      const initialLen = db.designers.length;
      db.designers = db.designers.filter((d) => d.id !== req.params.id);
      found = db.designers.length < initialLen;
      return db;
    });

    if (!found) {
      return res.status(404).json({ error: 'Designer not found' });
    }
    return res.json({ success: true, message: 'Designer removed successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
