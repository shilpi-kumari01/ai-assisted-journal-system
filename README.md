# AI Assisted Journal System

An AI-powered journaling application that analyzes user emotions and provides insights into the user's mental state over time. The system allows users to write journal entries, analyze emotions using an AI model, and visualize emotional insights through a simple and professional interface.

---

## Features

* Create journal entries with ambience selection (forest, ocean, mountain)
* AI-based emotion detection using Hugging Face model
* Insights dashboard showing emotional trends
* Rate limiting to prevent API abuse (5 requests per minute)
* Caching of repeated emotion analysis results
* Clean and professional UI using Tailwind CSS
* Docker support for easy deployment

---

## Tech Stack

Frontend

* React
* TypeScript
* Tailwind CSS

Backend

* Next.js API Routes
* Node.js

Database

* SQLite

AI Integration

* Hugging Face Emotion Analysis Model

Deployment

* Docker

---

## API Endpoints

Create Journal Entry

POST /api/journal

Get Entries by User

GET /api/journal/:userId

Analyze Emotion

POST /api/journal/analyze

Get Insights

GET /api/journal/insights/:userId

---

## Setup

Clone the repository

git clone https://github.com/shilpi-kumari01/ai-assisted-journal-system.git

Move to project folder

cd ai-assisted-journal-system

Install dependencies

npm install

Run development server

npm run dev

Open in browser

http://localhost:3000

---

## Environment Variables

Create a file named `.env.local`

Add the following variable

HUGGINGFACE_API_KEY=your_api_key_here

You can generate the API key from
https://huggingface.co/settings/tokens

---

## Database

The application uses **SQLite**.

The database file `journal.db` is automatically created when the application runs for the first time.

---

## Docker

Build and run using Docker

docker compose up --build

---

## Project Architecture

app/
├── api/
│   └── journal/
│       ├── route.ts
│       ├── [userId]/route.ts
│       ├── analyze/route.ts
│       └── insights/[userId]/route.ts

├── layout.tsx
├── page.tsx
└── globals.css

lib/
└── db.ts

Dockerfile
docker-compose.yml
README.md

---

## API Examples

Create Entry

curl -X POST http://localhost:3000/api/journal 
-H "Content-Type: application/json" 
-d '{
"userId": "123",
"ambience": "forest",
"text": "I felt calm today",
"emotion": "calm",
"keywords": ["calm","peace"],
"summary": "User experienced calm"
}'

Analyze Emotion

curl -X POST http://localhost:3000/api/journal/analyze 
-H "Content-Type: application/json" 
-d '{"text": "I feel happy and relaxed"}'

Example Response

{
"emotion": "joy",
"keywords": ["happy","relaxed"],
"summary": "User experienced joy during the session"
}

---

## Screenshots

Main Interface
Journal writing interface with ambience selection.

Emotion Analysis
Displays detected emotion, keywords, and emotional summary.

Insights Dashboard
Shows statistics such as total entries, top emotions, and ambience usage.

---

## Deployment

The application can be deployed on platforms that support **Next.js**, such as:

* Vercel
* Netlify
* Docker based servers

---

## Future Improvements

* Add user authentication system
* Implement charts for emotion trends
* Replace SQLite with PostgreSQL for production
* Add Redis caching for faster API responses

---

## Author

Shilpi Kumari
