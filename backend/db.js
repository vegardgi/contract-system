const Database = require('better-sqlite3');
const path     = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'contracts.db');
const db     = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    id              TEXT    PRIMARY KEY,
    title           TEXT    NOT NULL DEFAULT '',
    content         TEXT    NOT NULL DEFAULT '',
    status          TEXT    NOT NULL DEFAULT 'draft',
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    sent_at         INTEGER,
    signed_at       INTEGER,
    recipient_name  TEXT,
    recipient_email TEXT,
    signature_type  TEXT,
    signature_data  TEXT,
    signature_font  TEXT
  )
`);

module.exports = db;
