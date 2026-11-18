const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const designerRoutes = require('./routes/designer.routes');
const projectRoutes = require('./routes/project.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const serviceRoutes = require('./routes/service.routes');
const testimonialRoutes = require('./routes/testimonial.routes');
const settingRoutes = require('./routes/setting.routes');
const contentRoutes = require('./routes/content.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static uploads serving
const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    framework: 'MERN Stack (Express + MongoDB + Node)',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/designers', designerRoutes);
app.use('/api/designer', designerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);

// Static client production build serving
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Express Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  SKT Branding MERN API Server running on port ${PORT}`);
    console.log(`  API Base: http://localhost:${PORT}/api`);
    console.log(`  Health:   http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
