const express = require('express');
const router = express.Router();
const fs = require('fs');
const { upload } = require('../middleware/upload');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    // 1. If Cloudinary is configured, upload to Cloudinary CDN
    if (isCloudinaryConfigured()) {
      try {
        let buffer = req.file.buffer;
        if (!buffer && req.file.path && fs.existsSync(req.file.path)) {
          buffer = fs.readFileSync(req.file.path);
        }
        if (buffer) {
          const cloudRes = await uploadToCloudinary(buffer, req.file.originalname, 'sktbranding');
          return res.json({
            url: cloudRes.secure_url || cloudRes.url,
            name: req.file.originalname,
            size: cloudRes.bytes || req.file.size,
            public_id: cloudRes.public_id,
            storage: 'cloudinary',
          });
        }
      } catch (cloudErr) {
        console.warn('[Upload Route] Cloudinary upload warning, falling back to local storage:', cloudErr.message);
      }
    }

    // 2. Fallback to local uploads
    const publicUrl = `/uploads/${req.file.filename}`;
    return res.json({
      url: publicUrl,
      name: req.file.originalname,
      size: req.file.size,
      storage: 'local',
    });
  } catch (err) {
    console.error('[Upload Error]:', err);
    return res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

module.exports = router;
