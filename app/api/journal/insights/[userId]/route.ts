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
    const entries = stmt.all(userId) as any[];

    if (entries.length === 0) {
      return NextResponse.json({
        totalEntries: 0,
        topEmotion: null,
        mostUsedAmbience: null,
        recentKeywords: [],
      });
    }

    const totalEntries = entries.length;

    // Count emotions
    const emotionCount: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.emotion) {
        emotionCount[entry.emotion] = (emotionCount[entry.emotion] || 0) + 1;
      }
    });
    const topEmotion = Object.keys(emotionCount).reduce((a, b) => emotionCount[a] > emotionCount[b] ? a : b, '');

    // Count ambiences
    const ambienceCount: { [key: string]: number } = {};
    entries.forEach(entry => {
      ambienceCount[entry.ambience] = (ambienceCount[entry.ambience] || 0) + 1;
    });
    const mostUsedAmbience = Object.keys(ambienceCount).reduce((a, b) => ambienceCount[a] > ambienceCount[b] ? a : b, '');

    // Recent keywords
    const recentKeywords: string[] = [];
    entries.slice(0, 5).forEach(entry => {
      if (entry.keywords) {
        recentKeywords.push(...entry.keywords.split(','));
      }
    });
    const uniqueKeywords = [...new Set(recentKeywords)].slice(0, 4);

    return NextResponse.json({
      totalEntries,
      topEmotion,
      mostUsedAmbience,
      recentKeywords: uniqueKeywords,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}