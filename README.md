# Sift

Course course planning for Texas A&M CSCE students. Sift combines grade distributions, professor ratings, prerequisite chains, and transcript data to generate personalized course recommendations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query |
| Backend | Express.js (TypeScript) |
| Database | Supabase (PostgreSQL) |
| Data Sources | Anex grade distributions, RateMyProfessors |
| Transcript Parsing | pdf-parse + Claude API |

## Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com) (for transcript parsing)

### 1. Install dependencies

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment variables

**`client/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**`server/.env`**
```
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### 3. Populate the database

Run the scraper to pull grade distributions from Anex and professor ratings from RateMyProfessors:

```bash
cd server && npm run scrape
```

### 4. Run the dev servers

```bash
# From root — starts both client and server
npm run dev
```

Or individually:

```bash
cd client && npm run dev    # http://localhost:3000
cd server && npm run dev    # http://localhost:3001
```

## Project Structure

```
sift/
├── client/          # Next.js frontend
├── server/          # Express API server
│   └── scripts/     # Data scraping scripts
└── supabase/        # Database migrations
```
