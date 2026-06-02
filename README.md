# NEXUS: Real-Time Corporate Target Intelligence Infrastructure
NEXUS is an enterprise-grade corporate intelligence pipeline and monitoring engine built for institutional investors, venture capitalists, and data analysts. The platform handles complex, multi-threaded target scanning, text normalization, and risk analytics across unstructured global market data.

By automating heavy ingestion overhead, NEXUS normalizes raw web payloads into scannable data matrices and streams structured telemetry packages directly to centralized enterprise webhook architectures in under 600ms.



## Core Engineering Architecture

- **Frictionless Data Ingestion**: Executes high-throughput web scraping utilizing direct headless parsing infrastructure to isolate core article markdown content while completely bypassing client-side rendering bottlenecks and script-heavy tracking code.
- **Polymorphic Metric Normalization**: Evaluates target entities using a multi-category structural rubric, translating un-curated financial news into deterministic numerical data points against absolute score limits:**Regulatory Analytics**: Compliance updates and policy shifts mapped to a **36-point ceiling**.
- **Personnel Volatility**: Leadership departures and board changes mapped to a **23-point ceiling**.
- **Strategic Capacity Tracking**: Continuous observation of macro-economic scaling parameters and workforce growth/contraction velocities to detect structural vulnerabilities.

- **Asynchronous Processing Loops**: Decoupled ingestion logic that routes data seamlessly through serialization handlers without blocking the main browser application interface.
- **Dynamic Session Synchronization**: Direct hydration hooks that bridge active user credentials with local React states to ensure crisp user-profile data rendering.
- **Hybrid Feature Partitioning**: Monitored access controls providing standard email analytics summaries via a free tier while conditionally gating system webhooks (such as Slack or Microsoft Teams channels) for advanced integration pipelines.



## Data Flow Blueprint

```
[ Frontend Client Dashboard ] ---> Fires Asynchronous Stream Request
                                             |
                                             v
[ Normalization Layer ]       ---> Web Payload Processing & Extraction
                                             |
                                             v
[ Analytics Parser Engine ]   ---> Schema Evaluation & Scoring (36pt / 23pt Caps)
                                             |
                                             v
[ Persistence Layer ]         ---> Non-blocking Optimized PostgreSQL Commits
                                             |
                                             v
[ Webhook Dispatcher ]        ---> Dispatches Structured Payloads to Endpoints
```

1. **Ingestion & Isolation**: The request initializes a background search loop. A specialized web integration handles live data queries, stripping out heavy nesting, broken HTML strings, and site noise to provide a clean markdown string directly to the ingestion layer.
2. **Structural Categorization**: The data engine reviews the raw text block, isolating key metrics like leadership changes, legal filings, and macro shifts (e.g., asset price actions or operational scaling) and parsing them directly into predictable JSON structures.
3. **Database Integration Optimization**: Database table initializations (`CREATE TABLE IF NOT EXISTS`) are completely decoupled from active route handlers and placed in independent setup migrations, removing transactional table locks and eliminating query-path latency overhead.
4. **System Output Dispatch**: The compiled summary is verified against active tier permission toggles. If authorized, the structured JSON is dispatched immediately via serverless handlers straight to client webhooks for automated workflow monitoring.




## Technical Infrastructure

- Next.js  TypeScript
- Tailwind CSS v4 via `@tailwindcss/postcss`
- `firecrawl` SDK for signal ingestion
- `@google/genai` (Gemini) for scoring validation
- PostgreSQL via `postgres` with local JSON fallback
- `next-auth` authentication
- Microsoft Teams Adaptive Cards via `TEAMS_WEBHOOK_URL`

## Environment Variables Configuration
Create a `.env.local` file in your project's root folder and add the following keys:

Bash

```
# Data Connection and Extraction Keys
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
ANALYTICS_PROCESSING_KEY=your_processing_key_here

# Database Connectivity
DATABASE_URL=postgresql://username:password@localhost:5432/nexus_db

# Client Session Configurations
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXT_PUBLIC_BILLING_PORTAL_URL=#
```

## Local Installation & Setup

1. **Clone the Architecture**:

git clone https://github.com/your-username/nexus-infrastructure.git
cd nexus-infrastructure

```
2.  **Install Base Dependencies**:
    ```bash
npm install
```

1. **Run Database Migrations**:
Execute the standalone migration runner to spin up the system schemas (`app_reports`, `app_watchlist`, `app_settings`) prior to initiating local request loops.

npm run db:migrate

```
4.  **Boot Development Server**:
    ```bash
npm run dev
```

```
Open [http://localhost:3000](http://localhost:3000) inside your browser window to monitor the dashboard.
```

## System Verification Protocol
To verify the systemic integrity and routing speeds of the architecture during review sessions, run this live sequence:

1. **Navigate to Engine**: Open the `/analyze` route on the side navigation grid.
2. **Input Target Query**: Enter an enterprise entity experiencing heavy public market transitions into the text box (e.g., `Binance`, `Tesla`, or `OpenAI`) and hit **Run**.
3. **Observe Server Console**: Review the terminal logs to watch the request parse, log to the data table, and exit without encountering table locks or execution blocks.
4. **Check Telemetry Webhook**: Inspect your active `webhook.site` terminal tab to verify that a structured JSON package containing populated category fields and strict point maximum scores has been cleanly delivered.
