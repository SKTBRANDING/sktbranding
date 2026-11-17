# SKT Branding — MERN Stack Architecture Guide
**MongoDB • Express.js • React • Node.js**

This project includes a complete, production-grade **MERN Stack** implementation alongside the existing full-stack setup.

---

## 📁 Architecture Overview

```
sktbranding/
├── server/                      # Node.js + Express.js + MongoDB API
│   ├── config/
│   │   └── db.js                # MongoDB connection handler (Mongoose)
│   ├── models/                  # Mongoose ODM Models
│   │   ├── Project.js           # Portfolio projects & video showcases
│   │   ├── Task.js              # Tasks, text copy, voice briefs & revision histories
│   │   ├── Designer.js          # Designer profiles & private access tokens
│   │   ├── Inquiry.js           # Client commission inquiries
│   │   ├── Service.js           # Agency service offerings
│   │   ├── Testimonial.js       # Client reviews & star ratings
│   │   ├── Setting.js           # Global branding, contact info & SEO
│   │   └── Content.js           # Website copywriting (Hero, About, Process)
│   ├── middleware/
│   │   ├── auth.js              # Admin JWT & Designer private token validation
│   │   └── upload.js            # Multer file upload (3D models, audio, PDF, PNG)
│   ├── routes/
│   │   ├── auth.routes.js       # /api/auth (Login, Logout, Verify)
│   │   ├── task.routes.js       # /api/tasks (CRUD, Claim, Start, Submit, Review, Upload)
│   │   ├── designer.routes.js   # /api/designers (CRUD, Token Regenerate, Verify)
│   │   ├── project.routes.js    # /api/projects (CRUD & category filtering)
│   │   ├── inquiry.routes.js    # /api/inquiries (Public submissions & status management)
│   │   ├── service.routes.js    # /api/services
│   │   ├── testimonial.routes.js# /api/testimonials
│   │   ├── setting.routes.js    # /api/settings
│   │   └── content.routes.js    # /api/content
│   ├── scripts/
│   │   └── seed.js              # 1-Click Database Migration script (JSON -> MongoDB)
│   ├── server.js                # Express app entry point
│   ├── .env.example             # Server environment variables template
│   └── package.json             # Express & Mongoose dependencies
│
├── client/                      # React SPA Frontend
│   ├── src/
│   │   ├── api.js               # Unified API Client for Express endpoints
│   │   ├── App.jsx              # Client router (/, /admin, /designer)
│   │   ├── main.jsx             # React DOM entry point
│   │   └── index.css            # Tailwind CSS luxury theme
│   ├── index.html
│   ├── vite.config.js           # Vite dev server with /api proxy to Express :5000
│   └── package.json
│
├── public/uploads/              # Static file storage (shared across client & server)
│   └── tasks/                   # Deliverables, 3D models, audio recordings, PDFs, PNGs
└── package.json                 # Root unified scripts
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the install command to install both server and client packages:
```bash
npm run mern:install
```
*(Or navigate to `server/` and `client/` and run `npm install` in each).*

### 2. Configure MongoDB in `server/.env`
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sktbranding
# Or for MongoDB Atlas Cloud:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sktbranding?retryWrites=true&w=majority
ADMIN_PASSWORD=admin123
JWT_SECRET=skt_luxury_branding_jwt_secret_key_2026
CLIENT_URL=http://localhost:3000
```

### 3. Migrate Existing Data to MongoDB
Run the automated seed script to import all current projects, tasks, designers, audio recordings, and website copy into your MongoDB instance:
```bash
npm run mern:seed
```

### 4. Start the Express API Server
```bash
npm run mern:server
```
*API Base:* `http://localhost:5000/api`  
*Health Check:* `http://localhost:5000/api/health`

### 5. Start the React Frontend
```bash
npm run mern:client
```
*Frontend URL:* `http://localhost:3000`

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Admin authentication | Public |
| `GET` | `/api/auth/verify` | Verify current admin session | Admin |
| `GET` | `/api/tasks` | Get all tasks (supports `?status=`, `?priority=`) | Public / Admin |
| `POST` | `/api/tasks` | Create task with text copy, voice brief & references | Admin |
| `POST` | `/api/tasks/:id/claim` | Designer claims available task | Designer Token |
| `POST` | `/api/tasks/:id/submit` | Submit deliverables & voice walkthrough | Designer Token |
| `POST` | `/api/tasks/:id/review` | Request changes (with voice & files) or approve | Admin |
| `POST` | `/api/tasks/upload` | Upload audio notes, 3D models, PDFs, PNGs (100MB) | Admin / Designer |
| `GET` | `/api/designers` | List all designers | Admin |
| `POST` | `/api/designers` | Add designer & generate unique invitation token | Admin |
| `GET` | `/api/designers/verify` | Validate private invitation link token | Public / Designer |
| `GET` | `/api/projects` | List portfolio projects (supports `?category=`) | Public |
| `POST` | `/api/inquiries` | Submit client commission inquiry | Public |
