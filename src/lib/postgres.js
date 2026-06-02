import postgres from "postgres";

let sqlInstance;
let initPromise;

function getDatabaseUrl() {
  return process.env.DATABASE_URL || "";
}

export function hasDatabaseConfig() {
  return Boolean(getDatabaseUrl());
}

export function getSql() {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!sqlInstance) {
    sqlInstance = postgres(getDatabaseUrl(), {
      max: 5,
      ssl: "require",
    });
  }

  return sqlInstance;
}

export async function ensureDatabaseSchema() {
  if (!hasDatabaseConfig()) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const sql = getSql();

    await sql`
      create table if not exists app_reports (
        id text primary key,
        company text not null,
        score integer not null,
        prev_score integer not null default 0,
        recommendation text not null,
        confidence text not null,
        signals jsonb not null default '[]'::jsonb,
        signal_count integer not null default 0,
        score_breakdown jsonb,
        memo jsonb,
        key_insight text,
        has_alert boolean not null default false,
        created_at timestamptz not null default now()
      )
    `;

    await sql`
      create index if not exists idx_app_reports_company_created_at
      on app_reports (lower(company), created_at desc)
    `;

    await sql`
      create table if not exists app_watchlist (
        company text primary key,
        status text not null default 'active',
        alert_threshold integer not null default 70,
        created_at timestamptz not null default now()
      )
    `;

    await sql`
      create table if not exists app_settings (
        id integer primary key default 1,
        data jsonb not null,
        updated_at timestamptz not null default now()
      )
    `;

    await sql`
      create table if not exists team_members (
        id text primary key,
        email text not null unique,
        name text not null,
        role text not null default 'member',
        status text not null default 'active',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;

    await sql`
      create index if not exists idx_team_members_email
      on team_members (email)
    `;

    await sql`
      create index if not exists idx_team_members_status
      on team_members (status)
    `;

    return true;
  })();

  return initPromise;
}
