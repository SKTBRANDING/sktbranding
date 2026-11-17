const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Resolve target upload directory
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'public', 'uploads');
const TASK_UPLOADS = path.join(UPLOAD_ROOT, 'tasks');

// Ensure upload folders exist
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
if (!fs.existsSync(TASK_UPLOADS)) fs.mkdirSync(TASK_UPLOADS, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // If it's a task attachment or deliverable, store in uploads/tasks
    cb(null, TASK_UPLOADS);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = crypto.randomUUID().slice(0, 10);
    cb(null, `${uniqueSuffix}_${safeBase}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.js', '.ts', '.html', '.htm', '.php', '.phtml'];
  
  if (dangerousExtensions.includes(ext)) {
    return cb(new Error(`File extension "${ext}" is blocked for security reasons.`), false);
  }
  cb(null, true);
}

function getFileCategory(filename = '', mimetype = '') {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (['obj', 'fbx', 'glb', 'gltf', 'blend', 'c4d', '3ds', 'stl', 'dae', 'step', 'stp'].includes(ext)) return 'model';
  if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'webm'].includes(ext) || mimetype.includes('audio')) return 'audio';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mimetype.includes('image')) return 'image';
  if (ext === 'pdf' || mimetype.includes('pdf')) return 'pdf';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext) || mimetype.includes('video')) return 'video';
  if (['psd', 'ai', 'eps', 'indd', 'fig', 'sketch'].includes(ext)) return 'design';
  return 'doc';
}

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter,
});

module.exports = {
  upload,
  getFileCategory,
};
