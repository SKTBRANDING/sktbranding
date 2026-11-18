const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Disable Mongoose command buffering so queries fail-fast when offline
// instead of hanging for 10000ms
mongoose.set('bufferCommands', false);

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI not set. Running in resilient JSON dataset fallback mode.');
    return null;
  }
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Connection failed (${err.message}). Seamlessly utilizing resilient JSON fallback dataset.`);
    return null;
  }
}

module.exports = connectDB;
