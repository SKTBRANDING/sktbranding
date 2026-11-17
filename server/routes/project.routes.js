const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Project = require('../models/Project');
const { requireAdmin } = require('../middleware/auth');

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
    const filter = {};

    if (all !== 'true') {
      filter.published = true;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
    return res.json(projects);
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
    let slug = baseSlug;
    let count = 1;
    while (await Project.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const highestOrderProj = await Project.findOne().sort({ order: -1 });
    const order = highestOrderProj ? (highestOrderProj.order || 0) + 1 : 1;

    const newProject = new Project({
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      slug,
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
      order,
    });

    await newProject.save();
    return res.status(201).json(newProject);
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
    const project = await Project.findOne({
      $or: [{ id: param }, { slug: param }],
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUT /api/projects/:id (Edit Project)
// ==========================================
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    Object.assign(project, req.body);
    await project.save();
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DELETE /api/projects/:id
// ==========================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Project.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    return res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
