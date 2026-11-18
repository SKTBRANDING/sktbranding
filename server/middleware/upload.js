const multer = require('multer');
const path = require('path');

// Use memoryStorage so file buffers are kept in RAM and can be written to disk,
// uploaded to Cloudinary, or encoded as data URIs without failing on read-only environments
const storage = multer.memoryStorage();

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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

module.exports = {
  upload,
  getFileCategory,
};
