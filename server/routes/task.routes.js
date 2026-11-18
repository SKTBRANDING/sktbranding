const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Task = require('../models/Task');
const Designer = require('../models/Designer');
const { requireAdmin, requireDesigner, requireAnyAuth } = require('../middleware/auth');
const { upload, getFileCategory } = require('../middleware/upload');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');
const { isMongoConnected, getJsonDb, saveJsonDb } = require('../utils/dbFallback');

// ==========================================
// File Upload Endpoint (Audio, 3D models, PDF, PNG, etc.)
// POST /api/tasks/upload
// ==========================================
router.post('/upload', requireAnyAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const category = getFileCategory(req.file.originalname, req.file.mimetype);

  // If Cloudinary is configured, upload to Cloudinary CDN
  if (isCloudinaryConfigured() && req.file.buffer) {
    try {
      const cloudRes = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'sktbranding/tasks');
      return res.json({
        id: crypto.randomUUID(),
        name: req.file.originalname,
        url: cloudRes.secure_url || cloudRes.url,
        size: cloudRes.bytes || req.file.size,
        type: req.file.mimetype || req.file.originalname.split('.').pop() || 'unknown',
        uploadedAt: new Date().toISOString(),
        category,
        storage: 'cloudinary',
      });
    } catch (err) {
      console.warn('[Server Upload] Cloudinary error, using local disk fallback:', err.message);
    }
  }

  const publicUrl = `/uploads/tasks/${req.file.filename}`;

  return res.json({
    id: crypto.randomUUID(),
    name: req.file.originalname,
    url: publicUrl,
    size: req.file.size,
    type: req.file.mimetype || req.file.originalname.split('.').pop() || 'unknown',
    uploadedAt: new Date().toISOString(),
    category,
    storage: 'local',
  });
});

// ==========================================
// GET /api/tasks
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { status, priority, designerId } = req.query;

    if (isMongoConnected()) {
      try {
        const filter = {};
        if (status && status !== 'all') {
          if (status === 'in_progress') {
            filter.status = { $in: ['assigned', 'in_progress'] };
          } else if (status === 'awaiting_review') {
            filter.status = { $in: ['submitted', 'resubmitted'] };
          } else {
            filter.status = status;
          }
        }
        if (priority && priority !== 'all') {
          filter.priority = priority;
        }
        if (designerId && designerId !== 'all') {
          filter.assignedDesignerId = designerId === 'unassigned' ? null : designerId;
        }

        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        if (tasks && tasks.length) return res.json(tasks);
      } catch (e) {
        console.warn('[Task Route] Mongo find error:', e.message);
      }
    }

    const db = getJsonDb();
    let tasks = Array.isArray(db.tasks) ? [...db.tasks] : [];
    if (status && status !== 'all') {
      if (status === 'in_progress') {
        tasks = tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress');
      } else if (status === 'awaiting_review') {
        tasks = tasks.filter((t) => t.status === 'submitted' || t.status === 'resubmitted');
      } else {
        tasks = tasks.filter((t) => t.status === status);
      }
    }
    if (priority && priority !== 'all') {
      tasks = tasks.filter((t) => t.priority === priority);
    }
    if (designerId && designerId !== 'all') {
      tasks = tasks.filter((t) =>
        designerId === 'unassigned' ? !t.assignedDesignerId : t.assignedDesignerId === designerId
      );
    }
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch tasks: ' + err.message });
  }
});

// ==========================================
// POST /api/tasks (Create & Assign Task)
// ==========================================
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      client,
      brief,
      textContent = '',
      voiceBrief = null,
      deliverables,
      dimensions = '',
      fileFormats = 'AI, PSD, PDF, PNG',
      priority = 'medium',
      deadline,
      assignedDesignerId,
      referenceFiles = [],
    } = req.body;

    if (!title || !client || !brief) {
      return res.status(400).json({ error: 'Work title, client name, and project brief are required.' });
    }

    let assignedDesignerName = null;
    let initialStatus = 'available';
    let assignedAt = undefined;

    if (assignedDesignerId) {
      const db = getJsonDb();
      const designers = Array.isArray(db.designers) ? db.designers : [];
      const d = designers.find((x) => x.id === assignedDesignerId);
      if (d) {
        assignedDesignerName = d.name;
        initialStatus = 'assigned';
        assignedAt = new Date().toISOString();
      }
    }

    const newTaskData = {
      id: `task-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      client: client.trim(),
      brief: brief.trim(),
      textContent: textContent.trim(),
      voiceBrief,
      deliverables: deliverables ? deliverables.trim() : '',
      dimensions: dimensions.trim(),
      fileFormats: fileFormats.trim(),
      priority,
      status: initialStatus,
      assignedDesignerId: assignedDesignerId || null,
      assignedDesignerName,
      assignedAt,
      deadline: deadline || null,
      referenceFiles: Array.isArray(referenceFiles) ? referenceFiles : [],
      submissions: [],
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const newTask = new Task(newTaskData);
        await newTask.save();
        return res.status(201).json(newTask);
      } catch (e) {
        console.warn('[Task Route] Mongo save error:', e.message);
      }
    }

    saveJsonDb((db) => {
      if (!Array.isArray(db.tasks)) db.tasks = [];
      db.tasks.unshift(newTaskData);
      return db;
    });

    return res.status(201).json(newTaskData);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create task: ' + err.message });
  }
});

// ==========================================
// GET /api/tasks/:id
// ==========================================
router.get('/:id', requireAnyAuth, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const task = await Task.findOne({ id: req.params.id });
        if (task) return res.json(task);
      } catch (e) {
        console.warn('[Task Route] Mongo findOne error:', e.message);
      }
    }

    const db = getJsonDb();
    const tasks = Array.isArray(db.tasks) ? db.tasks : [];
    const found = tasks.find((t) => t.id === req.params.id);
    if (!found) return res.status(404).json({ error: 'Task not found' });
    return res.json(found);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch task: ' + err.message });
  }
});

// ==========================================
// PUT /api/tasks/:id (Admin Update Task)
// ==========================================
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const body = req.body;

    if (isMongoConnected()) {
      try {
        const task = await Task.findOne({ id: req.params.id });
        if (task) {
          if (body.title !== undefined) task.title = body.title.trim();
          if (body.client !== undefined) task.client = body.client.trim();
          if (body.brief !== undefined) task.brief = body.brief.trim();
          if (body.textContent !== undefined) task.textContent = body.textContent.trim();
          if (body.voiceBrief !== undefined) task.voiceBrief = body.voiceBrief;
          if (body.deliverables !== undefined) task.deliverables = body.deliverables.trim();
          if (body.dimensions !== undefined) task.dimensions = body.dimensions.trim();
          if (body.fileFormats !== undefined) task.fileFormats = body.fileFormats.trim();
          if (body.priority !== undefined) task.priority = body.priority;
          if (body.deadline !== undefined) task.deadline = body.deadline;
          if (body.status !== undefined) task.status = body.status;
          if (body.referenceFiles !== undefined) task.referenceFiles = body.referenceFiles;
          await task.save();
          return res.json(task);
        }
      } catch (e) {
        console.warn('[Task Route] Mongo put error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.tasks)) db.tasks = [];
      const idx = db.tasks.findIndex((t) => t.id === req.params.id);
      if (idx !== -1) {
        db.tasks[idx] = { ...db.tasks[idx], ...body };
        updated = db.tasks[idx];
      }
      return db;
    });

    if (!updated) return res.status(404).json({ error: 'Task not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update task: ' + err.message });
  }
});

// ==========================================
// DELETE /api/tasks/:id
// ==========================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const deleted = await Task.findOneAndDelete({ id: req.params.id });
        if (deleted) return res.json({ success: true, message: 'Task deleted successfully' });
      } catch (e) {
        console.warn('[Task Route] Mongo delete error:', e.message);
      }
    }

    let found = false;
    saveJsonDb((db) => {
      if (!Array.isArray(db.tasks)) db.tasks = [];
      const len = db.tasks.length;
      db.tasks = db.tasks.filter((t) => t.id !== req.params.id);
      found = db.tasks.length < len;
      return db;
    });

    if (!found) return res.status(404).json({ error: 'Task not found' });
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/tasks/:id/claim (Designer Claim Work)
// ==========================================
router.post('/:id/claim', requireDesigner, async (req, res) => {
  try {
    const designer = req.designer;

    if (isMongoConnected()) {
      try {
        const task = await Task.findOne({ id: req.params.id });
        if (task && (task.status === 'available' || !task.assignedDesignerId)) {
          task.assignedDesignerId = designer.id;
          task.assignedDesignerName = designer.name;
          task.assignedAt = new Date().toISOString();
          task.status = 'assigned';
          await task.save();
          return res.json({ success: true, message: `Task successfully claimed by ${designer.name}`, task });
        }
      } catch (e) {
        console.warn('[Task Route] Mongo claim error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.tasks)) db.tasks = [];
      const idx = db.tasks.findIndex((t) => t.id === req.params.id);
      if (idx !== -1) {
        db.tasks[idx].assignedDesignerId = designer.id;
        db.tasks[idx].assignedDesignerName = designer.name;
        db.tasks[idx].assignedAt = new Date().toISOString();
        db.tasks[idx].status = 'assigned';
        updated = db.tasks[idx];
      }
      return db;
    });

    if (!updated) return res.status(404).json({ error: 'Task not found or unavailable' });
    return res.json({ success: true, message: `Task successfully claimed by ${designer.name}`, task: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/tasks/:id/start (Designer Start Work)
// ==========================================
router.post('/:id/start', requireDesigner, async (req, res) => {
  try {
    if (isMongoConnected()) {
      try {
        const task = await Task.findOne({ id: req.params.id });
        if (task && task.assignedDesignerId === req.designer.id) {
          task.status = 'in_progress';
          await task.save();
          return res.json({ success: true, message: 'Task is now in progress', task });
        }
      } catch (e) {
        console.warn('[Task Route] Mongo start error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.tasks)) db.tasks = [];
      const idx = db.tasks.findIndex((t) => t.id === req.params.id);
      if (idx !== -1 && db.tasks[idx].assignedDesignerId === req.designer.id) {
        db.tasks[idx].status = 'in_progress';
        updated = db.tasks[idx];
      }
      return db;
    });

    if (!updated) return res.status(403).json({ error: 'Task not found or unauthorized' });
    return res.json({ success: true, message: 'Task is now in progress', task: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/tasks/:id/submit (Designer Submit Deliverables & Voice Walkthrough)
// ==========================================
router.post('/:id/submit', requireDesigner, async (req, res) => {
  try {
    const { notes = '', files = [], designerVoiceNote = null } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'At least one deliverable file must be uploaded before submitting.' });
    }

    const newSubmission = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      version: 1,
      versionLabel: 'Deliverables Submission',
      submittedAt: new Date().toISOString(),
      designerId: req.designer.id,
      designerName: req.designer.name,
      notes: notes.trim(),
      files,
      designerVoiceNote: designerVoiceNote || null,
      reviewStatus: 'pending',
    };

    if (isMongoConnected()) {
      try {
        const task = await Task.findOne({ id: req.params.id });
        if (task && task.assignedDesignerId === req.designer.id) {
          const versionNumber = (task.submissions?.length || 0) + 1;
          newSubmission.version = versionNumber;
          newSubmission.versionLabel = versionNumber === 1 ? 'Original Submission' : `Revision ${versionNumber - 1}`;
          const newStatus = versionNumber === 1 ? 'submitted' : 'resubmitted';

          if (!Array.isArray(task.submissions)) task.submissions = [];
          task.submissions.unshift(newSubmission);
          task.status = newStatus;
          await task.save();

          return res.json({
            success: true,
            message: `${newSubmission.versionLabel} successfully submitted for admin review!`,
            submission: newSubmission,
            task,
          });
        }
      } catch (e) {
        console.warn('[Task Route] Mongo submit error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.tasks)) db.tasks = [];
      const idx = db.tasks.findIndex((t) => t.id === req.params.id);
      if (idx !== -1 && db.tasks[idx].assignedDesignerId === req.designer.id) {
        const t = db.tasks[idx];
        const versionNumber = (t.submissions?.length || 0) + 1;
        newSubmission.version = versionNumber;
        newSubmission.versionLabel = versionNumber === 1 ? 'Original Submission' : `Revision ${versionNumber - 1}`;
        if (!Array.isArray(t.submissions)) t.submissions = [];
        t.submissions.unshift(newSubmission);
        t.status = versionNumber === 1 ? 'submitted' : 'resubmitted';
        updated = t;
      }
      return db;
    });

    if (!updated) return res.status(403).json({ error: 'Forbidden: You are not assigned to this work.' });
    return res.json({
      success: true,
      message: `${newSubmission.versionLabel} successfully submitted for admin review!`,
      submission: newSubmission,
      task: updated,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit work: ' + err.message });
  }
});

// ==========================================
// POST /api/tasks/:id/review (Admin Review Decision)
// ==========================================
router.post('/:id/review', requireAdmin, async (req, res) => {
  try {
    const { action, feedback = '', voiceFeedback = null, attachments = [] } = req.body;

    if (!action || (action !== 'request_revision' && action !== 'approve')) {
      return res.status(400).json({ error: 'Valid review action required (request_revision or approve).' });
    }

    if (isMongoConnected()) {
      try {
        const task = await Task.findOne({ id: req.params.id });
        if (task && task.submissions && task.submissions.length > 0) {
          const latestSubmission = task.submissions[0];
          if (action === 'request_revision') {
            latestSubmission.reviewStatus = 'revision_requested';
            latestSubmission.adminFeedback = feedback.trim() || 'Please check requested revisions.';
            latestSubmission.adminVoiceFeedback = voiceFeedback || null;
            latestSubmission.adminFeedbackAttachments = Array.isArray(attachments) ? attachments : [];
            latestSubmission.reviewedAt = new Date().toISOString();
            task.status = 'revision_requested';
          } else {
            latestSubmission.reviewStatus = 'approved';
            latestSubmission.adminFeedback = feedback.trim() || 'Work approved without modifications!';
            if (voiceFeedback) latestSubmission.adminVoiceFeedback = voiceFeedback;
            if (attachments?.length) latestSubmission.adminFeedbackAttachments = attachments;
            latestSubmission.reviewedAt = new Date().toISOString();
            task.status = 'completed';
          }
          await task.save();
          return res.json({
            success: true,
            message: action === 'approve' ? 'Work approved!' : 'Revisions requested.',
            task,
          });
        }
      } catch (e) {
        console.warn('[Task Route] Mongo review error:', e.message);
      }
    }

    let updated = null;
    saveJsonDb((db) => {
      if (!Array.isArray(db.tasks)) db.tasks = [];
      const idx = db.tasks.findIndex((t) => t.id === req.params.id);
      if (idx !== -1 && db.tasks[idx].submissions && db.tasks[idx].submissions.length > 0) {
        const t = db.tasks[idx];
        const latestSubmission = t.submissions[0];
        if (action === 'request_revision') {
          latestSubmission.reviewStatus = 'revision_requested';
          latestSubmission.adminFeedback = feedback.trim() || 'Please check requested revisions.';
          latestSubmission.adminVoiceFeedback = voiceFeedback || null;
          latestSubmission.adminFeedbackAttachments = Array.isArray(attachments) ? attachments : [];
          latestSubmission.reviewedAt = new Date().toISOString();
          t.status = 'revision_requested';
        } else {
          latestSubmission.reviewStatus = 'approved';
          latestSubmission.adminFeedback = feedback.trim() || 'Work approved!';
          if (voiceFeedback) latestSubmission.adminVoiceFeedback = voiceFeedback;
          if (attachments?.length) latestSubmission.adminFeedbackAttachments = attachments;
          latestSubmission.reviewedAt = new Date().toISOString();
          t.status = 'completed';
        }
        updated = t;
      }
      return db;
    });

    if (!updated) return res.status(404).json({ error: 'Task or submissions not found' });
    return res.json({
      success: true,
      message: action === 'approve' ? 'Work approved!' : 'Revisions requested.',
      task: updated,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record task review: ' + err.message });
  }
});

module.exports = router;
