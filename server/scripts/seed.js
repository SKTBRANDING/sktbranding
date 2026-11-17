const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Project = require('../models/Project');
const Designer = require('../models/Designer');
const Task = require('../models/Task');
const Inquiry = require('../models/Inquiry');
const Service = require('../models/Service');
const Testimonial = require('../models/Testimonial');
const Setting = require('../models/Setting');
const Content = require('../models/Content');

async function seedDatabase() {
  await connectDB();

  const dbPath = path.join(__dirname, '..', '..', 'data', 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`[Seed] data/db.json not found at ${dbPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf8');
  const data = JSON.parse(raw);

  console.log('[Seed] Beginning data migration to MongoDB...');

  // 1. Projects
  if (data.projects?.length) {
    await Project.deleteMany({});
    await Project.insertMany(data.projects);
    console.log(`[Seed] Inserted ${data.projects.length} projects`);
  }

  // 2. Designers
  if (data.designers?.length) {
    await Designer.deleteMany({});
    await Designer.insertMany(data.designers);
    console.log(`[Seed] Inserted ${data.designers.length} designers`);
  }

  // 3. Tasks
  if (data.tasks?.length) {
    await Task.deleteMany({});
    await Task.insertMany(data.tasks);
    console.log(`[Seed] Inserted ${data.tasks.length} tasks with revision histories & audio notes`);
  }

  // 4. Inquiries
  if (data.inquiries?.length) {
    await Inquiry.deleteMany({});
    await Inquiry.insertMany(data.inquiries);
    console.log(`[Seed] Inserted ${data.inquiries.length} inquiries`);
  }

  // 5. Services
  if (data.services?.length) {
    await Service.deleteMany({});
    await Service.insertMany(data.services);
    console.log(`[Seed] Inserted ${data.services.length} services`);
  }

  // 6. Testimonials
  if (data.testimonials?.length) {
    await Testimonial.deleteMany({});
    await Testimonial.insertMany(data.testimonials);
    console.log(`[Seed] Inserted ${data.testimonials.length} testimonials`);
  }

  // 7. Settings
  if (data.settings) {
    await Setting.deleteMany({});
    await Setting.create(data.settings);
    console.log('[Seed] Inserted agency settings');
  }

  // 8. Content
  if (data.content) {
    await Content.deleteMany({});
    await Content.create(data.content);
    console.log('[Seed] Inserted website content');
  }

  console.log('[Seed] MongoDB migration completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
