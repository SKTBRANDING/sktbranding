const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { upload } = require('../middleware/upload');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

const PUBLIC_UPLOADS = path.join(__dirname, '..', 'public', 'uploads');

async function processSingleFile(file) {
  if (!file || !file.buffer) {
    throw new Error('File buffer is empty or missing');
  }

  // 1. If Cloudinary CDN is configured, upload directly to Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      const cloudRes = await uploadToCloudinary(file.buffer, file.originalname, 'sktbranding');
      return {
        url: cloudRes.secure_url || cloudRes.url,
        name: file.originalname,
        size: cloudRes.bytes || file.size,
        public_id: cloudRes.public_id,
        storage: 'cloudinary',
      };
    } catch (cloudErr) {
      console.warn('[Upload Route] Cloudinary failed, attempting local/base64 fallback:', cloudErr.message);
    }
  }

  // 2. Attempt saving to local filesystem (works in development & persistent servers)
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .slice(0, 30);
    const filename = `${crypto.randomUUID().slice(0, 10)}_${safeBase}${ext}`;

    if (!fs.existsSync(PUBLIC_UPLOADS)) fs.mkdirSync(PUBLIC_UPLOADS, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC_UPLOADS, filename), file.buffer);

    return {
      url: `/uploads/${filename}`,
      name: file.originalname,
      size: file.size,
      storage: 'local',
    };
  } catch (fsErr) {
    console.warn('[Upload Route] Read-only filesystem detected, generating inline data URL:', fsErr.message);
  }

  // 3. Fallback to high-reliability inline Data URI (never 404s, works 100% on Vercel Serverless)
  const mime = file.mimetype || 'image/jpeg';
  const dataUri = `data:${mime};base64,${file.buffer.toString('base64')}`;
  return {
    url: dataUri,
    name: file.originalname,
    size: file.size,
    storage: 'inline',
  };
}

// POST /api/upload (Single file)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }
    const result = await processSingleFile(req.file);
    return res.json(result);
  } catch (err) {
    console.error('[Upload Error]:', err);
    return res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

// POST /api/upload/multiple (Batch upload up to 20 files at once)
router.post('/multiple', upload.array('files', 20), async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const results = await Promise.all(files.map((f) => processSingleFile(f)));
    return res.json({
      success: true,
      files: results,
      urls: results.map((r) => r.url),
    });
  } catch (err) {
    console.error('[Batch Upload Error]:', err);
    return res.status(500).json({ error: err.message || 'Multiple file upload failed.' });
  }
});

module.exports = router;
