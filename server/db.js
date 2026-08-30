import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

let db = null;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  db = new DatabaseSync(config.dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  const schema = fs.readFileSync(path.join(config.dataDir, 'schemas.sql'), 'utf8');
  db.exec(schema);
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
