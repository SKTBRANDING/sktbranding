const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function uploadToCloudinary(buffer, filename, folder = 'sktbranding') {
  const ext = filename.split('.').pop().toLowerCase();
  let resourceType = 'auto';

  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
    resourceType = 'image';
  } else if (['mp3', 'wav', 'm4a', 'ogg', 'webm', 'aac', 'mp4', 'mov'].includes(ext)) {
    resourceType = 'video';
  } else if (['obj', 'fbx', 'glb', 'gltf', 'blend', 'pdf', 'zip', 'rar', 'psd', 'ai'].includes(ext)) {
    resourceType = 'raw';
  }

  const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}_${cleanName}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadToCloudinary,
};
