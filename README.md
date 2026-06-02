# NEXUS: Real-Time Corporate Target Intelligence

NEXUS is an AI-assisted corporate intelligence dashboard for monitoring public market signals, operational risk, and strategic movement across companies. It combines Firecrawl web ingestion, Gemini-based signal extraction, PostgreSQL persistence, and a Next.js control panel for analysts who need structured risk telemetry instead of raw search results.

The project is designed for a hackathon/demo workflow: a reviewer can run a target scan, inspect populated signal categories, manage alert settings, and see how free email delivery differs from paid enterprise integrations.

## Core Features

- **Live signal ingestion**: Searches and extracts clean web content with Firecrawl before sending compact markdown context into the analysis pipeline.
- **Broadened intelligence scope**: Detects regulatory, personnel, hiring, macro, crypto/BTC, market-volatility, and strategic-growth signals instead of only looking for M&A language.
- **Structured scoring caps**: Normalizes outputs into predictable score bars, including Regulatory at 36 points and Personnel at 23 points.
- **Persistent dashboard data**: Stores reports, watchlist entries, and settings in PostgreSQL when `DATABASE_URL` is configured, with local JSON fallback behavior for development.
- **Dynamic account hydration**: Uses the active session email to generate display names when explicit profile names are missing.
- **Hybrid alert plan**: Email alerts are free for every account. Slack and Microsoft Teams webhook delivery are gated behind Premium access.
- **Premium upgrade screen**: Locked enterprise controls open an inline paywall explaining the $9/month Premium subscription.
- **Account lifecycle controls**: Settings include a Danger Zone delete action that clears linked account records and returns the user to the landing page.

## Architecture

```text
Frontend Dashboard
  -> API route request
  -> Firecrawl search and markdown extraction
  -> Gemini structured signal analysis
  -> Score normalization and report persistence
  -> Dashboard, watchlist, email, or enterprise webhook delivery
```

Database schema setup is kept out of hot API routes. Run the migration command before starting the app so request handlers do not recreate tables or spam PostgreSQL `42P07` notice logs.

## Tech Stack

- Next.js App Router with TypeScript
- React and Tailwind CSS
- `firecrawl` SDK for web ingestion
- `@google/genai` for Gemini analysis
- PostgreSQL via `postgres`
- NextAuth for session state
- Microsoft Teams Adaptive Cards via webhook delivery

## Environment Variables

Create `.env.local` in the project root:

```bash
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://username:password@localhost:5432/nexus_db
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional billing/demo links
BILLING_CHECKOUT_URL=#
NEXT_PUBLIC_BILLING_PORTAL_URL=#

# Optional enterprise delivery
TEAMS_WEBHOOK_URL=your_teams_webhook_url_here
```

`BILLING_CHECKOUT_URL` is the target opened by the `$9/mo` Premium upgrade button. If it is left as `#`, the UI stays functional and shows a configuration notice instead of crashing.

## Local Setup

```bash
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in before testing the dashboard.

## Demo Flow

1. Open the analysis screen.
2. Search for a broad target such as `Tesla`, `Binance`, `OpenAI`, or `SpaceX`.
3. Confirm that the Signal Feed populates with structured cards instead of returning an empty state.
4. Open Settings and verify that the display name/email match the signed-in account.
5. Toggle Email Alerts to confirm it remains free.
6. Click Microsoft Teams or Slack controls on a free account to show the `$9/mo` Premium upgrade overlay.
7. Use the configured master demo account to confirm Premium controls unlock without checkout.
8. Use Danger Zone only when you intentionally want to delete the active account data.

## Submission Notes

- The master Premium override is implemented in `src/lib/user-profile.ts` for demo access.
- Standard users default to the Free tier until a billing flow is connected.
- Enterprise integrations are intentionally gated because Slack and Microsoft Teams represent team/workspace dispatch pipelines, while email summaries remain a basic user utility.
- The app builds with `npm run build` and can be deployed to Vercel once production environment variables are configured.
