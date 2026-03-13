import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'journal.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    ambience TEXT NOT NULL,
    text TEXT NOT NULL,
    emotion TEXT,
    keywords TEXT,
    summary TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrate if needed (add columns if not exist)
try {
  db.exec(`ALTER TABLE journal_entries ADD COLUMN emotion TEXT;`);
} catch {}
try {
  db.exec(`ALTER TABLE journal_entries ADD COLUMN keywords TEXT;`);
} catch {}
try {
  db.exec(`ALTER TABLE journal_entries ADD COLUMN summary TEXT;`);
} catch {}

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    const stmt = db.prepare('SELECT * FROM journal_entries WHERE userId = ? ORDER BY createdAt DESC');
    const entries = stmt.all(userId);

    return NextResponse.json(entries);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}