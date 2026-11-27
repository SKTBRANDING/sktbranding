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
const invoiceRoutes = require('./routes/invoice.routes');
const clientRoutes = require('./routes/client.routes');
const reportRoutes = require('./routes/report.routes');

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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// Static uploads serving with WebP auto-rewrite & 1-year immutable caching
const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
app.use(
  '/uploads',
  (req, res, next) => {
    // If an older .png or .jpg URL is requested but a compressed .webp exists, serve the .webp immediately
    const ext = path.extname(req.path).toLowerCase();
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const webpRel = req.path.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      const absoluteWebp = path.join(uploadsPath, webpRel.replace(/^\//, ''));
      if (fs.existsSync(absoluteWebp)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Type', 'image/webp');
        return res.sendFile(absoluteWebp);
      }
    }
    next();
  },
  express.static(uploadsPath, {
    maxAge: '365d',
    immutable: true,
    etag: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

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
app.use('/api/invoices', invoiceRoutes);
app.use('/api/billing', invoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);

// Static client production build serving
const distPath = path.join(__dirname, '..', 'dist');
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const staticPath = fs.existsSync(distPath) ? distPath : (fs.existsSync(clientDistPath) ? clientDistPath : null);
if (staticPath) {
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
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
