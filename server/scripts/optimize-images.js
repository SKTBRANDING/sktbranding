const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const DB_JSON_PATH = path.join(__dirname, '..', 'data', 'db.json');

async function optimizeImages() {
  console.log('=== SKT BRANDING IMAGE ACCELERATOR ===');
  console.log('Scanning uploads in:', UPLOADS_DIR);

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error('Uploads directory does not exist!');
    return;
  }

  const files = fs.readdirSync(UPLOADS_DIR);
  let convertedCount = 0;
  let totalSavedBytes = 0;
  const urlMap = new Map(); // e.g. '/uploads/xxx.png' -> '/uploads/xxx.webp'

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const inputPath = path.join(UPLOADS_DIR, file);
      const baseName = path.basename(file, ext);
      const outputName = `${baseName}.webp`;
      const outputPath = path.join(UPLOADS_DIR, outputName);

      try {
        const originalStats = fs.statSync(inputPath);
        
        // Generate WebP
        await sharp(inputPath)
          .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toFile(outputPath);

        const newStats = fs.statSync(outputPath);
        const saved = originalStats.size - newStats.size;
        totalSavedBytes += saved;
        convertedCount++;

        const originalUrl = `/uploads/${file}`;
        const newUrl = `/uploads/${outputName}`;
        urlMap.set(originalUrl, newUrl);

        console.log(`✓ ${file} (${(originalStats.size / 1024).toFixed(0)}KB) -> ${outputName} (${(newStats.size / 1024).toFixed(0)}KB) [-${((saved / originalStats.size) * 100).toFixed(0)}%]`);
      } catch (err) {
        console.warn(`! Could not optimize ${file}:`, err.message);
      }
    }
  }

  console.log(`\nOptimization Complete! Converted ${convertedCount} images.`);
  console.log(`Total Bandwidth Saved: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB!`);

  // Update data/db.json
  if (fs.existsSync(DB_JSON_PATH)) {
    let raw = fs.readFileSync(DB_JSON_PATH, 'utf8');
    for (const [oldUrl, newUrl] of urlMap.entries()) {
      raw = raw.split(oldUrl).join(newUrl);
    }
    fs.writeFileSync(DB_JSON_PATH, raw, 'utf8');
    console.log('✓ Updated data/db.json with optimized .webp URLs');
  }

  // Update MongoDB Atlas if URI is present
  if (process.env.MONGODB_URI) {
    try {
      console.log('Connecting to MongoDB Atlas to update project URLs...');
      await mongoose.connect(process.env.MONGODB_URI);
      const Project = require('../models/Project');
      const Content = require('../models/Content');

      const projects = await Project.find({});
      for (const p of projects) {
        let changed = false;
        if (p.coverImage && urlMap.has(p.coverImage)) {
          p.coverImage = urlMap.get(p.coverImage);
          changed = true;
        }
        if (Array.isArray(p.galleryImages)) {
          p.galleryImages = p.galleryImages.map((img) => (urlMap.has(img) ? urlMap.get(img) : img));
          changed = true;
        }
        if (changed) {
          await p.save();
        }
      }
      console.log(`✓ Synchronized ${projects.length} projects in MongoDB Atlas`);
      await mongoose.disconnect();
    } catch (dbErr) {
      console.warn('MongoDB Atlas update notice:', dbErr.message);
    }
  }
}

optimizeImages().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
