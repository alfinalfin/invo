# AI Lead Generation Engine Backend

Node.js/Express backend for an AI-assisted lead generation pipeline with:

- AI keyword expansion via Groq, OpenRouter, or Gemini
- Google Places Text Search + Place Details
- Website email discovery
- AI lead scoring, summaries, and draft email generation
- Firestore batch persistence with duplicate skipping

## Quick Start

```bash
npm install
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Environment Variables

Required:

- `PORT`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY` if Groq is your default or selected provider
- `OPENROUTER_API_KEY` if OpenRouter is your default or selected provider
- `GEMINI_API_KEY` if Gemini is your default or selected provider
- Firebase admin credentials via:
  - `FIREBASE_SERVICE_ACCOUNT_JSON`, or
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

Optional AI defaults:

- `AI_PROVIDER`
- `AI_MODEL`
- `GROQ_MODEL`
- `OPENROUTER_MODEL`
- `GEMINI_MODEL`
- `KEYWORD_EXPANSION_PROVIDER`
- `KEYWORD_EXPANSION_MODEL`
- `EMAIL_GENERATION_PROVIDER`
- `EMAIL_GENERATION_MODEL`

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
  },
  "ai": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "emailProvider": "openrouter",
    "emailModel": "openai/gpt-4o-mini"
  }
}
```

`ai.provider` and `ai.model` act as the default for both keyword expansion and lead enrichment.
Use `ai.emailProvider` and `ai.emailModel` when you want to target a different model just for draft email generation.
