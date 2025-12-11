require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_FILE = process.env.DB_FILE || './mydatabase.db';

// Ensure the data directory exists
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`📁 Created directory: ${dbDir}`);
}

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database:", DB_FILE);
    
    // Enable WAL mode for better concurrency and persistence
    db.run('PRAGMA journal_mode = WAL', (err) => {
      if (err) {
        console.error('❌ Error setting WAL mode:', err);
      } else {
        console.log('✅ WAL mode enabled');
      }
    });
    
    // Set synchronous to NORMAL for better performance with durability
    db.run('PRAGMA synchronous = NORMAL', (err) => {
      if (err) {
        console.error('❌ Error setting synchronous mode:', err);
      } else {
        console.log('✅ Synchronous mode set to NORMAL');
      }
    });
  }
});

// Graceful shutdown - checkpoint WAL before closing
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Checkpointing database before shutdown...`);
  
  db.run('PRAGMA wal_checkpoint(FULL)', (err) => {
    if (err) {
      console.error('❌ Error during checkpoint:', err);
    } else {
      console.log('✅ Database checkpoint completed');
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = db;
