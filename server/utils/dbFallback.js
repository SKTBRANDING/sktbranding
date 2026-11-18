const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dbPath = path.join(__dirname, '..', '..', 'data', 'db.json');

let memoryDb = null;

function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function getJsonDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      memoryDb = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[dbFallback] Error reading db.json, using in-memory state:', err.message);
  }
  return memoryDb || {
    projects: [],
    services: [],
    content: {},
    testimonials: [],
    inquiries: [],
    settings: {},
    designers: [],
    tasks: [],
  };
}

function saveJsonDb(updater) {
  try {
    const current = getJsonDb();
    const updated = typeof updater === 'function' ? updater(current) : updater;
    memoryDb = updated;
    if (fs.existsSync(path.dirname(dbPath))) {
      fs.writeFileSync(dbPath, JSON.stringify(updated, null, 2), 'utf-8');
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

  // If a URL was passed, extract 'token' query param
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
  const designers = Array.isArray(db.designers) ? db.designers : [];

  // 1. Exact match by token
  let d = designers.find((x) => x.status === 'active' && x.token === str);
  if (d) return d;

  // 2. Case-insensitive exact match
  const lower = str.toLowerCase();
  d = designers.find((x) => x.status === 'active' && x.token && x.token.toLowerCase() === lower);
  if (d) return d;

  // 3. Prefix match if at least 8 chars (e.g. 'dsg_aria_7' matching 'dsg_aria_7f8e91a2bc4d')
  if (str.length >= 8) {
    d = designers.find(
      (x) => x.status === 'active' && x.token && x.token.toLowerCase().startsWith(lower)
    );
    if (d) return d;
  }

  // 4. Match by email
  if (str.includes('@')) {
    d = designers.find((x) => x.status === 'active' && x.email && x.email.toLowerCase() === lower);
    if (d) return d;
  }

  // 5. Match by ID
  d = designers.find((x) => x.status === 'active' && x.id === str);
  if (d) return d;

  return null;
}

module.exports = {
  isMongoConnected,
  getJsonDb,
  saveJsonDb,
  findDesignerFromMemory,
};
