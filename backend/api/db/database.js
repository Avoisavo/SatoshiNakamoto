import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure db directory exists
const dbPath = join(__dirname, "linkedout.db");

const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
export function initializeDatabase() {
  // Workflows table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      nodes TEXT NOT NULL,
      connections TEXT,
      userId TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      nodes TEXT NOT NULL,
      connections TEXT,
      tags TEXT,
      featured INTEGER DEFAULT 0,
      createdBy TEXT,
      createdAt INTEGER NOT NULL
    )
  `);

  // Executions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      workflowId TEXT NOT NULL,
      status TEXT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER,
      logs TEXT,
      errorMessage TEXT,
      txHashes TEXT,
      FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `);

  console.log("Database initialized successfully");
}

export default db;
