const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Task = require('../models/Task');
const Designer = require('../models/Designer');
const { requireAdmin, requireDesigner, requireAnyAuth } = require('../middleware/auth');
const { upload, getFileCategory } = require('../middleware/upload');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

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
      const designer = await Designer.findOne({ id: assignedDesignerId });
      if (designer) {
        assignedDesignerName = designer.name;
        initialStatus = 'assigned';
        assignedAt = new Date().toISOString();
      }
    }

    const newTask = new Task({
      id: `task-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      client: client.trim(),
      brief: brief.trim(),
      textContent: textContent ? textContent.trim() : '',
      voiceBrief: voiceBrief || null,
      deliverables: deliverables?.trim() || 'Standard design deliverables',
      dimensions: dimensions?.trim() || '',
      fileFormats: fileFormats?.trim() || 'AI, PSD, PDF, PNG',
      priority: priority || 'medium',
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: initialStatus,
      assignedDesignerId: assignedDesignerId || null,
      assignedDesignerName,
      assignedAt,
      referenceFiles: Array.isArray(referenceFiles) ? referenceFiles : [],
      submissions: [],
    });

    await newTask.save();
    return res.status(201).json(newTask);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create task: ' + err.message });
  }
});

// ==========================================
// GET /api/tasks/:id
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUT /api/tasks/:id (Edit Task)
// ==========================================
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const body = req.body;

    if (body.assignedDesignerId !== undefined) {
      if (body.assignedDesignerId) {
        const designer = await Designer.findOne({ id: body.assignedDesignerId });
        task.assignedDesignerId = body.assignedDesignerId;
        task.assignedDesignerName = designer ? designer.name : null;
        if (!task.assignedAt) task.assignedAt = new Date().toISOString();
        if (task.status === 'available') task.status = 'assigned';
      } else {
        task.assignedDesignerId = null;
        task.assignedDesignerName = null;
        task.assignedAt = undefined;
        task.status = 'available';
      }
    }

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
    if (body.referenceFiles !== undefined) task.referenceFiles = body.referenceFiles;

    await task.save();
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update task: ' + err.message });
  }
});

// ==========================================
// DELETE /api/tasks/:id
// ==========================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Task.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
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
    const task = await Task.findOne({ id: req.params.id });

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'available' || task.assignedDesignerId) {
      return res.status(409).json({ error: 'This task has already been claimed or assigned.' });
    }

    task.assignedDesignerId = designer.id;
    task.assignedDesignerName = designer.name;
    task.assignedAt = new Date().toISOString();
    task.status = 'assigned';

    await task.save();
    return res.json({ success: true, message: `Task successfully claimed by ${designer.name}`, task });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/tasks/:id/start (Designer Start Work)
// ==========================================
router.post('/:id/start', requireDesigner, async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.assignedDesignerId !== req.designer.id) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this work.' });
    }

    task.status = 'in_progress';
    await task.save();
    return res.json({ success: true, message: 'Task is now in progress', task });
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

    const task = await Task.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    if (task.assignedDesignerId !== req.designer.id) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this work.' });
    }

    const versionNumber = (task.submissions?.length || 0) + 1;
    const versionLabel = versionNumber === 1 ? 'Original Submission' : `Revision ${versionNumber - 1}`;
    const newStatus = versionNumber === 1 ? 'submitted' : 'resubmitted';

    const newSubmission = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      version: versionNumber,
      versionLabel,
      submittedAt: new Date().toISOString(),
      designerId: req.designer.id,
      designerName: req.designer.name,
      notes: notes.trim(),
      files,
      designerVoiceNote: designerVoiceNote || null,
      reviewStatus: 'pending',
    };

    task.submissions.unshift(newSubmission);
    task.status = newStatus;

    await task.save();

    return res.json({
      success: true,
      message: `${versionLabel} successfully submitted for admin review!`,
      submission: newSubmission,
      task,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit work: ' + err.message });
  }
});

// ==========================================
// POST /api/tasks/:id/review (Admin Review Decision with Voice & References)
// ==========================================
router.post('/:id/review', requireAdmin, async (req, res) => {
  try {
    const { action, feedback = '', voiceFeedback = null, attachments = [] } = req.body;

    if (!action || (action !== 'request_revision' && action !== 'approve')) {
      return res.status(400).json({ error: 'Valid review action required (request_revision or approve).' });
    }

    if (action === 'request_revision' && !feedback.trim() && !voiceFeedback) {
      return res.status(400).json({ error: 'Feedback text or a voice message explaining requested changes is required.' });
    }

    const task = await Task.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    if (!task.submissions || task.submissions.length === 0) {
      return res.status(400).json({ error: 'Cannot review a task without any submitted deliverables.' });
    }

    // Latest submission is at index 0
    const latestSubmission = task.submissions[0];

    if (action === 'request_revision') {
      latestSubmission.reviewStatus = 'revision_requested';
      latestSubmission.adminFeedback = feedback.trim() || 'Please listen to the attached voice message and reference documents for required revisions.';
      latestSubmission.adminVoiceFeedback = voiceFeedback || null;
      latestSubmission.adminFeedbackAttachments = Array.isArray(attachments) ? attachments : [];
      latestSubmission.reviewedAt = new Date().toISOString();
      task.status = 'revision_requested';
    } else if (action === 'approve') {
      latestSubmission.reviewStatus = 'approved';
      latestSubmission.adminFeedback = feedback.trim() || 'Work approved without modifications. Excellent execution!';
      if (voiceFeedback) latestSubmission.adminVoiceFeedback = voiceFeedback;
      if (attachments?.length) latestSubmission.adminFeedbackAttachments = attachments;
      latestSubmission.reviewedAt = new Date().toISOString();
      task.status = 'completed';
    }

    await task.save();

    return res.json({
      success: true,
      message: action === 'approve' ? 'Work approved and marked as Completed!' : 'Revisions requested and notified to designer.',
      task,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record task review: ' + err.message });
  }
});

module.exports = router;
