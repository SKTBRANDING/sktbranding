const jwt = require('jsonwebtoken');
const Designer = require('../models/Designer');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'skt_luxury_branding_jwt_secret_key_2026';

// Verify Admin Credentials (Cookie or Authorization Bearer header)
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.admin_token || req.cookies?.admin_session;

    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
    }

    // Direct password match or JWT token
    if (token === ADMIN_PASSWORD || token === 'admin_authenticated_session') {
      req.isAdmin = true;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin') {
        req.isAdmin = true;
        return next();
      }
    } catch {
      // Fall through to 401
    }

    return res.status(401).json({ error: 'Unauthorized. Invalid admin session.' });
  } catch (err) {
    return res.status(500).json({ error: 'Auth middleware error: ' + err.message });
  }
}

// Verify Designer Token
async function requireDesigner(req, res, next) {
  try {
    const token =
      req.headers['x-designer-token'] ||
      (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null) ||
      req.query.token ||
      req.cookies?.designer_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Designer access token required.' });
    }

    const designer = await Designer.findOne({ token, status: 'active' });
    if (!designer) {
      return res.status(401).json({ error: 'Invalid or revoked designer invitation link.' });
    }

    // Update last active timestamp
    designer.lastActiveAt = new Date();
    await designer.save();

    req.designer = designer;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Designer auth error: ' + err.message });
  }
}

// Allow either Admin or Designer
async function requireAnyAuth(req, res, next) {
  const token =
    req.headers['x-designer-token'] ||
    (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null) ||
    req.query.token ||
    req.cookies?.designer_token;

  if (token) {
    const designer = await Designer.findOne({ token, status: 'active' });
    if (designer) {
      req.designer = designer;
      return next();
    }
  }

  // Fallback to checking admin
  return requireAdmin(req, res, next);
}

module.exports = {
  requireAdmin,
  requireDesigner,
  requireAnyAuth,
  ADMIN_PASSWORD,
  JWT_SECRET,
};
