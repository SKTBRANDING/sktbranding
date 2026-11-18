const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Bundled static database reference so @vercel/nft automatically bundles data/db.json
let bundledDb = null;
try {
  bundledDb = require('../../data/db.json');
} catch (e) {
  try {
    bundledDb = require('../data/db.json');
  } catch (e2) {
    // bundled db will be loaded from disk candidates
  }
}

const DEFAULT_DESIGNERS = [
  {
    id: 'des-1',
    name: 'FIDHA WAFIYYA',
    email: 'fida@gmail.com',
    specialty: 'graphic designer',
    avatar: '',
    token: 'dsg_aria_7f8e91a2bc4d',
    status: 'active',
    notes: 'Specializes in Swiss minimalism, typography systems, and modern luxury brand guidelines.',
  },
  {
    id: 'des-2',
    name: 'Lucas Silva',
    email: 'lucas.silva@designers.sktbranding.com',
    specialty: '3D Packaging & Industrial Design',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    token: 'dsg_lucas_4b2c19e3fe5a',
    status: 'active',
  },
  {
    id: 'des-3',
    name: 'Elena Vane',
    email: 'elena.vane@designers.sktbranding.com',
    specialty: 'Social Media & Motion Graphics',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    token: 'dsg_elena_8c3d55f190ab',
    status: 'active',
  },
];

let memoryDb = null;

function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function getJsonDb() {
  if (memoryDb && Array.isArray(memoryDb.designers) && memoryDb.designers.length > 0) {
    return memoryDb;
  }

  // Attempt reading from potential filesystem paths
  const candidatePaths = [
    path.join(__dirname, '..', '..', 'data', 'db.json'),
    path.join(process.cwd(), 'data', 'db.json'),
    path.join(__dirname, '..', 'data', 'db.json'),
    path.join(process.cwd(), 'server', 'data', 'db.json'),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf-8');
        memoryDb = JSON.parse(raw);
        if (memoryDb && typeof memoryDb === 'object') {
          break;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  if (!memoryDb && bundledDb) {
    memoryDb = JSON.parse(JSON.stringify(bundledDb));
  }

  if (!memoryDb) {
    memoryDb = {
      projects: [],
      services: [],
      content: {},
      testimonials: [],
      inquiries: [],
      settings: {},
      designers: DEFAULT_DESIGNERS,
      tasks: [],
      invoices: [],
    };
  }

  // Ensure default designers exist
  if (!Array.isArray(memoryDb.designers) || memoryDb.designers.length === 0) {
    memoryDb.designers = [...DEFAULT_DESIGNERS];
  }

  if (!Array.isArray(memoryDb.invoices)) {
    memoryDb.invoices = [];
  }

  return memoryDb;
}

function saveJsonDb(updater) {
  try {
    const current = getJsonDb();
    const updated = typeof updater === 'function' ? updater(current) : updater;
    memoryDb = updated;

    const candidatePaths = [
      path.join(__dirname, '..', '..', 'data', 'db.json'),
      path.join(process.cwd(), 'data', 'db.json'),
    ];

    for (const candidate of candidatePaths) {
      try {
        if (fs.existsSync(path.dirname(candidate))) {
          fs.writeFileSync(candidate, JSON.stringify(updated, null, 2), 'utf-8');
          break;
        }
      } catch {}
    }

    return true;
  } catch (err) {
    console.warn('[dbFallback] Could not write to disk (read-only environment), updated in-memory:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// Designer matching helper (supports token, prefix, email, URL)
// -------------------------------------------------------------
function findDesignerFromMemory(rawInput) {
  if (!rawInput) return null;
  let str = String(rawInput).trim();

  // If a URL was passed, extract query parameter 'token'
  if (str.includes('token=')) {
    const match = str.match(/[?&]token=([^&#\s]+)/i) || str.match(/token=([a-zA-Z0-9_\-]+)/i);
    if (match && match[1]) {
      try {
        str = decodeURIComponent(match[1]).trim();
      } catch {
        str = match[1].trim();
      }
    }
  }

  const db = getJsonDb();
  let designers = Array.isArray(db.designers) ? db.designers : [];
  if (designers.length === 0) {
    designers = DEFAULT_DESIGNERS;
  }

  const lower = str.toLowerCase();

  // 1. Exact token match
  let d = designers.find((x) => x.status === 'active' && x.token === str);
  if (d) return d;

  // 2. Case-insensitive token match
  d = designers.find((x) => x.status === 'active' && x.token && x.token.toLowerCase() === lower);
  if (d) return d;

  // 3. Prefix match on token (e.g. 'dsg_aria_7' matching 'dsg_aria_7f8e91a2bc4d')
  if (lower.length >= 4) {
    d = designers.find(
      (x) => x.status === 'active' && x.token && x.token.toLowerCase().startsWith(lower)
    );
    if (d) return d;
  }

  // 4. Token contains input (e.g. 'aria_7' or 'aria')
  if (lower.length >= 4) {
    d = designers.find(
      (x) => x.status === 'active' && x.token && x.token.toLowerCase().includes(lower)
    );
    if (d) return d;
  }

  // 5. Match by email (exact or prefix)
  d = designers.find(
    (x) => x.status === 'active' && x.email && (x.email.toLowerCase() === lower || x.email.toLowerCase().startsWith(lower))
  );
  if (d) return d;

  // 6. Match by name (e.g. 'fidha' or 'wafiyya')
  if (lower.length >= 3) {
    d = designers.find(
      (x) => x.status === 'active' && x.name && x.name.toLowerCase().includes(lower)
    );
    if (d) return d;
  }

  // 7. Match by ID
  d = designers.find((x) => x.status === 'active' && x.id === str);
  if (d) return d;

  return null;
}

module.exports = {
  isMongoConnected,
  getJsonDb,
  saveJsonDb,
  findDesignerFromMemory,
  DEFAULT_DESIGNERS,
};
