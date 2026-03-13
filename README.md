# AI-Assisted Journal System

An AI-powered journaling application that analyzes user emotions and provides insights into mental state over time.

## Features

- **Journal Entry Creation**: Users can write journal entries with ambience selection (forest, ocean, mountain)
- **Emotion Analysis**: Automatic emotion detection using AI (Hugging Face model) with caching
- **Insights Dashboard**: View statistics on total entries, top emotions, most used ambiences, and recent keywords
- **Professional UI**: Clean white and black design with emotion badges
- **Rate Limiting**: Prevents API abuse (5 requests/minute)
- **Caching**: Repeated analyses are cached in database

## Tech Stack

- **Backend**: Next.js API Routes (Node.js)
- **Frontend**: React with TypeScript
- **Database**: SQLite
- **AI**: Hugging Face Emotion Analysis Model
- **Styling**: Tailwind CSS

## API Endpoints

- `POST /api/journal` - Create a new journal entry
- `GET /api/journal/:userId` - Get all entries for a user
- `POST /api/journal/analyze` - Analyze emotion of text (with caching and rate limiting)
- `GET /api/journal/insights/:userId` - Get user insights

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Create `.env.local`
   - Add `HUGGINGFACE_API_KEY=your_api_key_here` (get from https://huggingface.co/settings/tokens)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

- `HUGGINGFACE_API_KEY`: API key for Hugging Face Inference API

## Database

The application uses SQLite database (`journal.db`) which is created automatically on first run.

## Docker

Build and run with Docker:

```bash
docker compose up --build
```

## Project Architecture

```
├── app/
│   ├── api/
│   │   └── journal/
│   │       ├── route.ts (POST/GET entries)
│   │       ├── [userId]/route.ts (GET entries by user)
│   │       ├── analyze/route.ts (POST analyze text)
│   │       └── insights/[userId]/route.ts (GET insights)
│   ├── layout.tsx
│   ├── page.tsx (main UI)
│   └── globals.css
├── lib/
│   └── db.ts (database setup)
├── .env.local (environment variables)
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## API Examples

### Create Entry
```bash
curl -X POST http://localhost:3000/api/journal \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123",
    "ambience": "forest",
    "text": "I felt calm today",
    "emotion": "calm",
    "keywords": ["calm", "peace"],
    "summary": "User experienced calm"
  }'
```

### Analyze Text
```bash
curl -X POST http://localhost:3000/api/journal/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel happy and relaxed"}'
```

Response:
```json
{
  "emotion": "joy",
  "keywords": ["happy", "relaxed"],
  "summary": "User experienced joy during the session"
}
```

## Screenshots

### Main Interface
- Form to write journal entry with ambience selection
- Analyze button to get emotion analysis
- Insights panel showing statistics
- Previous entries list with emotion badges

### Emotion Analysis
- Shows detected emotion with colored badge and emoji
- Keywords extracted from text
- Summary of the emotional state

## Deployment

The app can be deployed on Vercel, Netlify, or any platform supporting Next.js.

For production, consider:
- Using a more robust database like PostgreSQL
- Adding authentication
- Implementing Redis for caching
