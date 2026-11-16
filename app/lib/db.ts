
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dataDirectory = join(process.cwd(), 'data');

mkdirSync(dataDirectory, { recursive: true });

const databasePath = join(dataDirectory, 'dashboard.sqlite');

const globalForDb = globalThis as typeof globalThis & {
    sqliteDb?: Database.Database;
};

export const db =
    globalForDb.sqliteDb ?? new Database(databasePath);

if (process.env.NODE_ENV !== 'production') {
    globalForDb.sqliteDb = db;
}

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    image_url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (customer_id)
      REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS revenue (
    month TEXT NOT NULL UNIQUE,
    revenue INTEGER NOT NULL
  );
`);

