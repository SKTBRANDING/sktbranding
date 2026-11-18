const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Project = require('../models/Project');
const { requireAdmin } = require('../middleware/auth');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// ==========================================
// GET /api/projects
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { category, featured, all } = req.query;

    if (isMongoConnected()) {
      try {
        const filter = {};
        if (all !== 'true') filter.published = true;
        if (category && category !== 'All') filter.category = category;
        if (featured === 'true') filter.isFeatured = true;

        const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
        if (projects && projects.length) return res.json(projects);
      } catch (e) {
        console.warn('[Project Route] Mongo query error, reading json fallback:', e.message);
      }
    }

    const db = getJsonDb();
    let projects = Array.isArray(db.projects) ? [...db.projects] : [];
    if (all !== 'true') {
      projects = projects.filter((p) => p.published !== false);
    }
    if (category && category !== 'All') {
      projects = projects.filter((p) => p.category === category);
    }
    if (featured === 'true') {
      projects = projects.filter((p) => p.isFeatured === true);
    }
    projects.sort((a, b) => (a.order || 0) - (b.order || 0));
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GET /api/projects/:idOrSlug
// ==========================================
router.get('/:idOrSlug', async (req, res) => {
  try {
    const param = req.params.idOrSlug;

    if (isMongoConnected()) {
      try {
        const project = await Project.findOne({
          $or: [{ id: param }, { slug: param }],
        });
        if (project) return res.json(project);
      } catch (e) {
        console.warn('[Project Route] Mongo findOne error:', e.message);
      }
    }

    const db = getJsonDb();
    const projects = Array.isArray(db.projects) ? db.projects : [];
    const found = projects.find((p) => p.id === param || p.slug === param);
    if (!found) return res.status(404).json({ error: 'Project not found' });
    return res.json(found);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/projects (Create Project)
// ==========================================
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      client,
      category = 'Branding',
      year = new Date().getFullYear().toString(),
      coverImage,
      imageAlt = '',
      galleryImages = [],
      videoUrl = '',
      videoAspectRatio = '16:9',
      overview = '',
      services = [],
      approach = '',
      externalLink = '',
      isFeatured = false,
      published = true,
    } = req.body;

    if (!title || !client || !coverImage) {
      return res.status(400).json({ error: 'Title, client, and cover image are required.' });
    }

    const baseSlug = slugify(title);
    const newProjData = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
      client: client.trim(),
      category,
      year,
      coverImage,
      imageAlt,
      galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
      videoUrl,
      videoAspectRatio,
      overview,
      services: Array.isArray(services) ? services : [],
      approach,
      externalLink,
      isFeatured: Boolean(isFeatured),
      published: Boolean(published),
      order: Date.now(),
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const newProject = new Project(newProjData);
        await newProject.save();
        return res.status(201).json(newProject);
      } catch (e) {
        console.warn('[Project Route] Mongo save failed, persisting in db.json:', e.message);
      }
    }

    saveJsonDb((db) => {
      if (!Array.isArray(db.projects)) db.projects = [];
      db.projects.unshift(newProjData);
      return db;
    });

    return res.status(201).json(newProjData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUT /api/projects/:id (Edit Project)
// ==========================================
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const project = await Project.findOne({ id: req.params.id });
        if (project) {
          Object.assign(project, req.body);
          await project.save();
          return res.json(project);
        }
      } catch (e) {
        console.warn('[Project Route] Mongo put error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.projects)) db.projects = [];
      const idx = db.projects.findIndex((p) => p.id === req.params.id);
      if (idx !== -1) {
        db.projects[idx] = { ...db.projects[idx], ...req.body };
        updated = db.projects[idx];
      }
      return db;
    });

    if (!updated) return res.status(404).json({ error: 'Project not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DELETE /api/projects/:id
// ==========================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const deleted = await Project.findOneAndDelete({ id: req.params.id });
        if (deleted) return res.json({ success: true, message: 'Project deleted' });
      } catch (e) {
        console.warn('[Project Route] Mongo delete error:', e.message);
      }
    }

    let found = false;
    saveJsonDb((db) => {
      if (!Array.isArray(db.projects)) db.projects = [];
      const len = db.projects.length;
      db.projects = db.projects.filter((p) => p.id !== req.params.id);
      found = db.projects.length < len;
      return db;
    });

    if (!found) return res.status(404).json({ error: 'Project not found' });
    return res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
