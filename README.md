# AI Lead Generation Engine Backend

Production-grade Node.js backend for running an AI-assisted lead generation pipeline with:

- Gemini keyword expansion
- Google Places Text Search + Place Details
- In-memory deduplication
- Gemini lead enrichment
- Firestore batch persistence with duplicate skipping

## Quick Start

```bash
npm install
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Required Environment Variables

- `PORT`
- `GOOGLE_API_KEY`
- `GEMINI_API_KEY`
- Firebase admin credentials via:
  - `FIREBASE_SERVICE_ACCOUNT_JSON`, or
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

## Endpoint

`POST /api/scrape-leads`

Headers:

- `x-user-id: your-user-id`

Example payload:

```json
{
  "keywords": ["freight forwarder London"],
  "region": "UK",
  "limit": 50,
  "sources": {
    "google": true,
    "directories": false,
    "linkedin": false
  }
}
```
