import { existsSync, readFileSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";
import { join } from "path";

import { ensureDatabaseSchema, getSql, hasDatabaseConfig } from "@/lib/postgres";

const DB_PATH = join(process.cwd(), "nexus-reports.json");

const DEFAULT_SETTINGS = {
  displayName: "NEXUS Operator",
  email: "operator@nexus.local",
  scoreThreshold: 65,
  refreshInterval: "6h",
  weeklyDigest: true,
  teamsEnabled: Boolean(process.env.TEAMS_WEBHOOK_URL),
  teamsWebhook: process.env.TEAMS_WEBHOOK_URL || "",
  emailAlerts: true,
  slackAlerts: false,
  darkMode: true,
  language: "English",
  currentPlan: "Pro analyst",
  usageUsed: 0,
  usageTotal: 25000,
  version: "1.0.0",
};

function normalizeReport(report) {
  if (!report || typeof report !== "object") {
    return null;
  }

  const normalizedSignals = Array.isArray(report.signals) ? report.signals : [];
  const normalizedSignalCount =
    typeof report.signalCount === "number" ? report.signalCount : normalizedSignals.length;

  return {
    id: report.id ?? randomUUID(),
    company: report.company ?? "Unknown Company",
    score: typeof report.score === "number" ? report.score : 0,
    prevScore:
      typeof report.prevScore === "number"
        ? report.prevScore
        : typeof report.score === "number"
          ? report.score
          : 0,
    recommendation: report.recommendation ?? report.memo?.recommendation ?? "Insufficient signals",
    confidence: report.confidence ?? report.memo?.confidence ?? "medium",
    signals: normalizedSignals,
    signalCount: normalizedSignalCount,
    scoreBreakdown: report.scoreBreakdown ?? null,
    memo: report.memo ?? null,
    keyInsight: report.keyInsight ?? null,
    hasAlert: typeof report.hasAlert === "boolean" ? report.hasAlert : (report.score ?? 0) >= 65,
    createdAt: report.createdAt ?? new Date().toISOString(),
  };
}

function normalizeWatchlistEntry(entry) {
  if (!entry || typeof entry !== "object" || !entry.company) {
    return null;
  }

  return {
    company: String(entry.company),
    status: entry.status === "paused" ? "paused" : "active",
    alertThreshold:
      typeof entry.alertThreshold === "number" && Number.isFinite(entry.alertThreshold)
        ? entry.alertThreshold
        : 70,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
}

function normalizeSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};

  return {
    displayName:
      typeof source.displayName === "string" && source.displayName.trim()
        ? source.displayName
        : DEFAULT_SETTINGS.displayName,
    email:
      typeof source.email === "string" && source.email.trim()
        ? source.email
        : DEFAULT_SETTINGS.email,
    scoreThreshold:
      typeof source.scoreThreshold === "number"
        ? source.scoreThreshold
        : DEFAULT_SETTINGS.scoreThreshold,
    refreshInterval:
      ["1h", "3h", "6h", "12h", "24h"].includes(source.refreshInterval)
        ? source.refreshInterval
        : DEFAULT_SETTINGS.refreshInterval,
    weeklyDigest:
      typeof source.weeklyDigest === "boolean"
        ? source.weeklyDigest
        : DEFAULT_SETTINGS.weeklyDigest,
    teamsEnabled:
      typeof source.teamsEnabled === "boolean"
        ? source.teamsEnabled
        : DEFAULT_SETTINGS.teamsEnabled,
    teamsWebhook:
      typeof source.teamsWebhook === "string"
        ? source.teamsWebhook
        : DEFAULT_SETTINGS.teamsWebhook,
    emailAlerts:
      typeof source.emailAlerts === "boolean"
        ? source.emailAlerts
        : DEFAULT_SETTINGS.emailAlerts,
    slackAlerts:
      typeof source.slackAlerts === "boolean"
        ? source.slackAlerts
        : DEFAULT_SETTINGS.slackAlerts,
    darkMode:
      typeof source.darkMode === "boolean" ? source.darkMode : DEFAULT_SETTINGS.darkMode,
    language:
      typeof source.language === "string" && source.language.trim()
        ? source.language
        : DEFAULT_SETTINGS.language,
    currentPlan:
      typeof source.currentPlan === "string" && source.currentPlan.trim()
        ? source.currentPlan
        : DEFAULT_SETTINGS.currentPlan,
    usageUsed:
      typeof source.usageUsed === "number" ? source.usageUsed : DEFAULT_SETTINGS.usageUsed,
    usageTotal:
      typeof source.usageTotal === "number" ? source.usageTotal : DEFAULT_SETTINGS.usageTotal,
    version:
      typeof source.version === "string" && source.version.trim()
        ? source.version
        : DEFAULT_SETTINGS.version,
  };
}

function loadFileDB() {
  if (!existsSync(DB_PATH)) return { reports: [], watchlist: [], settings: DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(readFileSync(DB_PATH, "utf-8"));
    const reports = Array.isArray(parsed?.reports)
      ? parsed.reports.map(normalizeReport).filter(Boolean)
      : [];
    const watchlist = Array.isArray(parsed?.watchlist)
      ? parsed.watchlist.map(normalizeWatchlistEntry).filter(Boolean)
      : [];
    const settings = normalizeSettings(parsed?.settings);

    return { reports, watchlist, settings };
  } catch {
    return { reports: [], watchlist: [], settings: DEFAULT_SETTINGS };
  }
}

function saveFileDB(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function ensureWatchlistEntry(db, company, options = {}) {
  const companyKey = company.toLowerCase();
  const existing = db.watchlist.find((item) => item.company.toLowerCase() === companyKey);

  if (existing) {
    if (options.status) existing.status = options.status;
    if (typeof options.alertThreshold === "number") {
      existing.alertThreshold = options.alertThreshold;
    }
    return existing;
  }

  const entry = normalizeWatchlistEntry({
    company,
    status: options.status ?? "active",
    alertThreshold: options.alertThreshold ?? 70,
    createdAt: new Date().toISOString(),
  });

  db.watchlist.unshift(entry);
  return entry;
}

async function withDb(fn, fallback) {
  if (!hasDatabaseConfig()) return fallback();
  await ensureDatabaseSchema();
  return fn(getSql());
}

export async function saveReport({ company, score, signals, scoreBreakdown, memo, keyInsight, confidence, recommendation }) {
  return withDb(
    async (sql) => {
      const previous = await sql`
        select score
        from app_reports
        where lower(company) = lower(${company})
        order by created_at desc
        limit 1
      `;

      const report = normalizeReport({
        id: randomUUID(),
        company,
        score,
        prevScore: previous[0]?.score ?? score,
        recommendation:
          recommendation ||
          memo?.recommendation ||
          (score >= 70 ? "Monitor closely" : "Insufficient signals"),
        confidence: confidence || memo?.confidence || "medium",
        signals: signals || [],
        signalCount: signals?.length || 0,
        scoreBreakdown: scoreBreakdown || null,
        memo: memo || null,
        keyInsight: keyInsight || null,
        hasAlert: score >= 65,
        createdAt: new Date().toISOString(),
      });

      await sql`
        insert into app_reports (
          id, company, score, prev_score, recommendation, confidence, signals,
          signal_count, score_breakdown, memo, key_insight, has_alert, created_at
        ) values (
          ${report.id},
          ${report.company},
          ${report.score},
          ${report.prevScore},
          ${report.recommendation},
          ${report.confidence},
          ${sql.json(report.signals)},
          ${report.signalCount},
          ${sql.json(report.scoreBreakdown)},
          ${sql.json(report.memo)},
          ${report.keyInsight},
          ${report.hasAlert},
          ${report.createdAt}
        )
      `;

      await sql`
        insert into app_watchlist (company, status, alert_threshold, created_at)
        values (${company}, 'active', 70, now())
        on conflict (company) do nothing
      `;

      return report;
    },
    async () => {
      const db = loadFileDB();
      const previous = db.reports.find(
        (item) => item.company?.toLowerCase() === company.toLowerCase(),
      );
      const report = normalizeReport({
        id: randomUUID(),
        company,
        score,
        prevScore: previous?.score ?? score,
        recommendation:
          recommendation ||
          memo?.recommendation ||
          (score >= 70 ? "Monitor closely" : "Insufficient signals"),
        confidence: confidence || memo?.confidence || "medium",
        signals: signals || [],
        signalCount: signals?.length || 0,
        scoreBreakdown: scoreBreakdown || null,
        memo: memo || null,
        keyInsight: keyInsight || null,
        hasAlert: score >= 65,
        createdAt: new Date().toISOString(),
      });

      db.reports.unshift(report);
      db.reports = db.reports.slice(0, 200);
      ensureWatchlistEntry(db, company);
      saveFileDB(db);
      return report;
    },
  );
}

export async function getReports(limit = 20) {
  return withDb(
    async (sql) => {
      const rows = await sql`
        select *
        from app_reports
        order by created_at desc
        limit ${limit}
      `;

      return rows.map((row) =>
        normalizeReport({
          id: row.id,
          company: row.company,
          score: row.score,
          prevScore: row.prev_score,
          recommendation: row.recommendation,
          confidence: row.confidence,
          signals: row.signals,
          signalCount: row.signal_count,
          scoreBreakdown: row.score_breakdown,
          memo: row.memo,
          keyInsight: row.key_insight,
          hasAlert: row.has_alert,
          createdAt: row.created_at,
        }),
      );
    },
    async () => {
      const db = loadFileDB();
      return db.reports.slice(0, limit);
    },
  );
}

export async function getReport(company) {
  return withDb(
    async (sql) => {
      const rows = await sql`
        select *
        from app_reports
        where lower(company) = lower(${company})
        order by created_at desc
        limit 1
      `;

      if (!rows[0]) return null;

      return normalizeReport({
        id: rows[0].id,
        company: rows[0].company,
        score: rows[0].score,
        prevScore: rows[0].prev_score,
        recommendation: rows[0].recommendation,
        confidence: rows[0].confidence,
        signals: rows[0].signals,
        signalCount: rows[0].signal_count,
        scoreBreakdown: rows[0].score_breakdown,
        memo: rows[0].memo,
        keyInsight: rows[0].key_insight,
        hasAlert: rows[0].has_alert,
        createdAt: rows[0].created_at,
      });
    },
    async () => {
      const db = loadFileDB();
      return (
        db.reports.find(
          (report) => report.company.toLowerCase() === company.toLowerCase(),
        ) || null
      );
    },
  );
}

export async function getWatchlist() {
  return withDb(
    async (sql) => {
      const rows = await sql`
        select company, status, alert_threshold, created_at
        from app_watchlist
        order by created_at desc
      `;

      return rows.map((row) =>
        normalizeWatchlistEntry({
          company: row.company,
          status: row.status,
          alertThreshold: row.alert_threshold,
          createdAt: row.created_at,
        }),
      );
    },
    async () => {
      const db = loadFileDB();
      return db.watchlist;
    },
  );
}

export async function addWatchlistCompany(company, alertThreshold = 70) {
  return withDb(
    async (sql) => {
      await sql`
        insert into app_watchlist (company, status, alert_threshold, created_at)
        values (${company}, 'active', ${alertThreshold}, now())
        on conflict (company) do update
        set status = 'active', alert_threshold = excluded.alert_threshold
      `;

      return normalizeWatchlistEntry({
        company,
        status: "active",
        alertThreshold,
        createdAt: new Date().toISOString(),
      });
    },
    async () => {
      const db = loadFileDB();
      const entry = ensureWatchlistEntry(db, company, { status: "active", alertThreshold });
      saveFileDB(db);
      return entry;
    },
  );
}

export async function updateWatchlistStatus(company, status) {
  return withDb(
    async (sql) => {
      await sql`
        insert into app_watchlist (company, status, alert_threshold, created_at)
        values (${company}, ${status}, 70, now())
        on conflict (company) do update
        set status = excluded.status
      `;

      const rows = await sql`
        select company, status, alert_threshold, created_at
        from app_watchlist
        where company = ${company}
        limit 1
      `;

      return normalizeWatchlistEntry({
        company: rows[0].company,
        status: rows[0].status,
        alertThreshold: rows[0].alert_threshold,
        createdAt: rows[0].created_at,
      });
    },
    async () => {
      const db = loadFileDB();
      const entry = ensureWatchlistEntry(db, company, { status });
      saveFileDB(db);
      return entry;
    },
  );
}

export async function removeWatchlistCompany(company) {
  return withDb(
    async (sql) => {
      await sql`
        delete from app_watchlist
        where lower(company) = lower(${company})
      `;
      return true;
    },
    async () => {
      const db = loadFileDB();
      const companyKey = company.toLowerCase();
      db.watchlist = db.watchlist.filter((item) => item.company.toLowerCase() !== companyKey);
      saveFileDB(db);
      return true;
    },
  );
}

export async function getSettings() {
  return withDb(
    async (sql) => {
      const rows = await sql`
        select data
        from app_settings
        where id = 1
        limit 1
      `;

      if (!rows[0]) {
        await sql`
          insert into app_settings (id, data, updated_at)
          values (1, ${sql.json(DEFAULT_SETTINGS)}, now())
          on conflict (id) do nothing
        `;
        return DEFAULT_SETTINGS;
      }

      return normalizeSettings(rows[0].data);
    },
    async () => {
      const db = loadFileDB();
      return db.settings;
    },
  );
}

export async function updateSettings(partialSettings) {
  return withDb(
    async (sql) => {
      const nextSettings = normalizeSettings({
        ...(await getSettings()),
        ...partialSettings,
      });

      await sql`
        insert into app_settings (id, data, updated_at)
        values (1, ${sql.json(nextSettings)}, now())
        on conflict (id) do update
        set data = excluded.data, updated_at = now()
      `;

      return nextSettings;
    },
    async () => {
      const db = loadFileDB();
      db.settings = normalizeSettings({
        ...db.settings,
        ...partialSettings,
      });
      saveFileDB(db);
      return db.settings;
    },
  );
}
