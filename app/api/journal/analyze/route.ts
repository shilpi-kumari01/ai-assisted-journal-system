import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'journal.db');
const db = new Database(dbPath);

// Create tables
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

// Simple rate limiting (in production, use proper rate limiting)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  // Simple rate limiting: 5 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 0, resetTime: now + windowMs });
  }

  const userRequests = requestCounts.get(ip)!;
  if (now > userRequests.resetTime) {
    userRequests.count = 0;
    userRequests.resetTime = now + windowMs;
  }

  if (userRequests.count >= maxRequests) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
  }

  userRequests.count++;

  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Generate hash
    const textHash = crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');

    // Check cache
    const cacheStmt = db.prepare('SELECT * FROM analysis_cache WHERE text_hash = ?');
    const cached: any = cacheStmt.get(textHash);
    if (cached) {
      return NextResponse.json({
        emotion: cached.emotion,
        keywords: cached.keywords.split(','),
        summary: cached.summary,
      });
    }

    // Use Hugging Face API for emotion analysis
    let analysisResult;

    if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your_api_key_here') {
      // Smart mock response based on text content analysis
      const lowerText = text.toLowerCase();

      let detectedEmotion = 'calm'; // default

      // Simple keyword-based emotion detection (English and Hindi support)
      if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('excited') || lowerText.includes('great') || lowerText.includes('wonderful') ||
          text.includes('खुश') || text.includes('प्रसन्न') || text.includes('आनंदित') || text.includes('उत्साहित')) {
        detectedEmotion = 'happy';
      } else if (lowerText.includes('sad') || lowerText.includes('unhappy') || lowerText.includes('depressed') || lowerText.includes('crying') || lowerText.includes('upset') ||
                 text.includes('दुखी') || text.includes('उदास') || text.includes('गमगीन') || text.includes('रोना')) {
        detectedEmotion = 'sad';
      } else if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('furious') || lowerText.includes('annoyed') || lowerText.includes('frustrated') ||
                 text.includes('गुस्सा') || text.includes('क्रोधित') || text.includes('नाराज') || text.includes('परेशान')) {
        detectedEmotion = 'angry';
      } else if (lowerText.includes('calm') || lowerText.includes('peaceful') || lowerText.includes('relaxed') || lowerText.includes('serene') || lowerText.includes('tranquil') ||
                 text.includes('शांत') || text.includes('शान्त') || text.includes('आरामदायक') || text.includes('सुकून')) {
        detectedEmotion = 'calm';
      }

      // Extract meaningful keywords (prioritize longer words)
      const words = text.split(/\s+/).filter((word: string) => word.length > 1);
      const keywords = words
        .sort((a, b) => b.length - a.length) // Sort by length descending
        .slice(0, 3); // Take top 3 longest words

      analysisResult = {
        emotion: detectedEmotion,
        keywords: keywords.length > 0 ? keywords : ['reflection', 'thoughts', 'feelings'],
        summary: `User experienced ${detectedEmotion} during the session`,
      };
    } else {
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

      // Process the result
      const emotions = result[0] || [];
      const topEmotion = emotions.reduce((prev: any, current: any) => (prev.score > current.score) ? prev : current);

      // For keywords, extract some words
      const keywords = text.toLowerCase().split(/\s+/).filter((word: string) => word.length > 3).slice(0, 3);

      analysisResult = {
        emotion: topEmotion.label,
        keywords,
        summary: `User experienced ${topEmotion.label} during the session`,
      };
    }

    // Cache the result
    const insertStmt = db.prepare('INSERT OR REPLACE INTO analysis_cache (text_hash, text, emotion, keywords, summary) VALUES (?, ?, ?, ?, ?)');
    insertStmt.run(textHash, text, analysisResult.emotion, analysisResult.keywords.join(','), analysisResult.summary);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}