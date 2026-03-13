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

db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text_hash TEXT UNIQUE NOT NULL,
    text TEXT NOT NULL,
    emotion TEXT NOT NULL,
    keywords TEXT NOT NULL,
    summary TEXT NOT NULL,
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

async function analyzeText(text: string) {
  const response = await fetch('https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze emotion');
  }

  const result = await response.json();
  const emotions = result[0] || [];
  const topEmotion = emotions.reduce((prev: any, current: any) => (prev.score > current.score) ? prev : current);
  const keywords = text.toLowerCase().split(/\s+/).filter((word: string) => word.length > 3).slice(0, 3);
  const summary = `User experienced ${topEmotion.label} during the session.`;

  return {
    emotion: topEmotion.label,
    keywords: keywords.join(','),
    summary,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId, ambience, text, emotion, keywords, summary } = await request.json();

    if (!userId || !ambience || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO journal_entries (userId, ambience, text, emotion, keywords, summary) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(userId, ambience, text, emotion || null, keywords ? keywords.join(',') : null, summary || null);

    return NextResponse.json({ id: result.lastInsertRowid, message: 'Entry created' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}