# SKT BRANDING — Full-Stack MERN Architecture

> **Executive Brand Architecture & Designer Studio Monorepo**  
> Built with **MongoDB, Express.js, React (Vite + Tailwind CSS), and Node.js**.

---

## 🏛️ Monorepo Structure

```
sktbranding/ (Root Workspace)
├── client/                     # React Frontend Single Page Application (Vite + Tailwind v4)
│   ├── public/                 # Static vector assets & favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # Admin Studio (Overview, Tasks, Designers, Portfolio, Content, etc.)
│   │   │   ├── designer/       # Designer Studio (Available Works, My Works, Revisions, Submissions)
│   │   │   ├── public/         # Public Website (Hero, About, Process, Services, Portfolio, Contact)
│   │   │   └── ui/             # Voice audio recorder, 3D/PDF/media cards, revision timeline
│   │   ├── lib/                # Date utilities & offline fallback datasets
│   │   ├── types/              # TypeScript interfaces
│   │   ├── api.js              # Full-stack API client
│   │   ├── App.jsx             # React Router root (/, /admin, /designer, 404)
│   │   ├── index.css           # Luxury obsidian & electric orange styling
│   │   └── main.jsx            # Application entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          # Port 3000 & /api reverse proxy to Express
├── server/                     # Express.js REST API & MongoDB Backend
│   ├── config/
│   │   ├── db.js               # Mongoose connection (Atlas / local)
│   │   └── cloudinary.js       # Cloudinary media upload integration
│   ├── middleware/
│   │   ├── auth.js             # Admin JWT & Designer token security
│   │   └── upload.js           # Multer multi-format file uploads (100MB limit)
│   ├── models/                 # Mongoose schemas (Task, Designer, Project, Inquiry, etc.)
│   ├── routes/                 # Express API endpoints
│   ├── scripts/
│   │   └── seed.js             # 1-Click MongoDB data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Express server entry point (Port 5001)
├── api/
│   └── index.js                # Vercel Serverless Function entry point
├── data/
│   └── db.json                 # JSON database backup for migrations
├── public/
│   └── uploads/                # Local file storage for portfolio & task deliverables
├── .env.example                # Root environment template
├── package.json                # Root monorepo orchestrator
└── vercel.json                 # Production deployment configuration
```

---

## ⚡ Quick Start

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```

### 2. Configure Environment
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```
Ensure your MongoDB URI (local or MongoDB Atlas) and optional Cloudinary credentials are set.

### 3. Seed MongoDB (Optional)
Import the initial projects, services, sample tasks, and designers into MongoDB:
```bash
npm run seed
```

### 4. Run Development Servers
In two terminal tabs:
```bash
# Terminal 1: Backend Express API (Runs on port 5001)
npm run server

# Terminal 2: Frontend React SPA (Runs on port 3000)
npm run dev
```

Visit the application at:
- **Public Website:** `http://localhost:3000`
- **Admin Studio:** `http://localhost:3000/admin` (Password: `admin123`)
- **Designer Studio:** `http://localhost:3000/designer?token=dsg_aria_7f8e91a2bc4d`

---

## 🚀 Production Deployment

### Option A: Standalone Node / VPS / Docker
Build the client and start the production Express server (which automatically serves the client build and API):
```bash
npm run build
npm start
```

### Option B: Vercel
Deploy directly using the included `vercel.json` and `api/index.js` serverless function bridge.
