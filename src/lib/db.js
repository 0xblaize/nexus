import { existsSync, readFileSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";
import { join } from "path";

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
      typeof source.scoreThreshold === "number" ? source.scoreThreshold : DEFAULT_SETTINGS.scoreThreshold,
    refreshInterval:
      ["1h", "3h", "6h", "12h", "24h"].includes(source.refreshInterval)
        ? source.refreshInterval
        : DEFAULT_SETTINGS.refreshInterval,
    weeklyDigest:
      typeof source.weeklyDigest === "boolean" ? source.weeklyDigest : DEFAULT_SETTINGS.weeklyDigest,
    teamsEnabled:
      typeof source.teamsEnabled === "boolean" ? source.teamsEnabled : DEFAULT_SETTINGS.teamsEnabled,
    teamsWebhook:
      typeof source.teamsWebhook === "string" ? source.teamsWebhook : DEFAULT_SETTINGS.teamsWebhook,
    emailAlerts:
      typeof source.emailAlerts === "boolean" ? source.emailAlerts : DEFAULT_SETTINGS.emailAlerts,
    slackAlerts:
      typeof source.slackAlerts === "boolean" ? source.slackAlerts : DEFAULT_SETTINGS.slackAlerts,
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

function loadDB() {
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

function saveDB(db) {
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

export async function saveReport({ company, score, signals, scoreBreakdown, memo }) {
  const db = loadDB();
  const previous = db.reports.find(
    (item) => item.company?.toLowerCase() === company.toLowerCase(),
  );
  const report = normalizeReport({
    id: randomUUID(),
    company,
    score,
    prevScore: previous?.score ?? score,
    recommendation:
      memo?.recommendation ||
      (score >= 70 ? "Monitor closely" : "Insufficient signals"),
    confidence: memo?.confidence || "medium",
    signals: signals || [],
    signalCount: signals?.length || 0,
    scoreBreakdown: scoreBreakdown || null,
    memo: memo || null,
    keyInsight: null,
    hasAlert: score >= 65,
    createdAt: new Date().toISOString(),
  });

  db.reports.unshift(report);
  db.reports = db.reports.slice(0, 200);
  ensureWatchlistEntry(db, company);
  saveDB(db);

  return report;
}

export async function getReports(limit = 20) {
  const db = loadDB();
  return db.reports.slice(0, limit);
}

export async function getReport(company) {
  const db = loadDB();
  return (
    db.reports.find(
      (report) => report.company.toLowerCase() === company.toLowerCase(),
    ) || null
  );
}

export async function getWatchlist() {
  const db = loadDB();
  return db.watchlist;
}

export async function addWatchlistCompany(company, alertThreshold = 70) {
  const db = loadDB();
  const entry = ensureWatchlistEntry(db, company, { status: "active", alertThreshold });
  saveDB(db);
  return entry;
}

export async function updateWatchlistStatus(company, status) {
  const db = loadDB();
  const entry = ensureWatchlistEntry(db, company, { status });
  saveDB(db);
  return entry;
}

export async function removeWatchlistCompany(company) {
  const db = loadDB();
  const companyKey = company.toLowerCase();
  db.watchlist = db.watchlist.filter((item) => item.company.toLowerCase() !== companyKey);
  saveDB(db);
  return true;
}

export async function getSettings() {
  const db = loadDB();
  return db.settings;
}

export async function updateSettings(partialSettings) {
  const db = loadDB();
  db.settings = normalizeSettings({
    ...db.settings,
    ...partialSettings,
  });
  saveDB(db);
  return db.settings;
}
