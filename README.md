# NEXUS - Autonomous M&A Intelligence Agent

NEXUS is a Next.js + Tailwind CSS app that runs a three-agent M&A intelligence workflow:

1. Agent A collects live public web signals through Firecrawl search with clean markdown extraction.
2. Agent B scores the acquisition probability from 0 to 100 using weighted signal math plus Gemini validation.
3. Agent C drafts an investment intelligence memo and can deliver it to Microsoft Teams as an adaptive card.

The product idea is simple: acquisition announcements often have visible public signals weeks earlier. NEXUS turns those fragmented signals into a fast analyst workflow.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs in demo mode without API keys. Add real credentials to `.env.local` to enable live Firecrawl collection, Gemini validation, and Teams delivery.

## Environment

Copy `.env.example` to `.env.local` and fill in the values you want to use.

```bash
GEMINI_API_KEY=
FIRECRAWL_API_KEY=
TEAMS_WEBHOOK_URL=
APP_URL=http://localhost:3000
```

## Scripts

```bash
npm run dev      # Next.js development server
npm run build    # production build
npm start        # production server after build
npm run cli -- "Figma" 65
```

## Project Structure

```text
src/app          Next.js App Router pages and API routes
src/components   Reusable UI components
src/agents       Agent A/B/C pipeline code
src/lib          Data, Teams delivery, and page content helpers
```

## API

```bash
POST /analyze
GET /reports
GET /report/:company
GET /health
GET /.well-known/ai-plugin.json
GET /openapi.yaml
```

Example:

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"company\":\"Figma\",\"threshold\":65}"
```

## Hackathon Positioning

- Firecrawl: live web/news search with markdown extraction for Gemini-ready context.
- Gradient: deterministic three-agent workflow with structured scoring outputs.
- Microsoft: adaptive-card delivery into Teams and an OpenAPI surface for Copilot Studio.
