import type {
  AgentCode,
  DashboardData,
  DashboardOverview,
  DashboardSignalSummary,
  DashboardWatchlistRow,
  Report,
  Signal,
  SignalFeedItem,
  SignalType,
  StoredWatchlistEntry,
  WatchlistItem,
} from "@/types/nexus";

export function getScoreColor(score: number) {
  if (score >= 70) {
    return "#ff2d2d";
  }

  if (score >= 50) {
    return "#ff9900";
  }

  return "#c8ff00";
}

export function getScoreLabel(score: number) {
  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 50) {
    return "MED";
  }

  return "LOW";
}

export function getSignalColor(type: SignalType) {
  if (type === "regulatory") {
    return "#ff2d2d";
  }

  if (type === "personnel") {
    return "#ff9900";
  }

  if (type === "hiring") {
    return "#c8ff00";
  }

  return "#4488ff";
}

export function getAgentColor(agent: AgentCode) {
  if (agent === "A") {
    return "#4488ff";
  }

  if (agent === "B") {
    return "#ff9900";
  }

  if (agent === "C") {
    return "#c8ff00";
  }

  return "#888";
}

export function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAgo(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  return `${Math.floor(seconds / 3600)}h ago`;
}

export function buildScoreSeries(reports: Report[], company: string) {
  return reports
    .filter((report) => report.company.toLowerCase() === company.toLowerCase())
    .slice()
    .reverse()
    .map((report) => ({
      label: new Date(report.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: report.score,
    }));
}

function uniqueByCompany(reports: Report[]) {
  const seen = new Set<string>();
  const rows: Report[] = [];

  for (const report of reports) {
    const key = report.company.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(report);
  }

  return rows;
}

function buildWatchlistFromReports(
  reports: Report[],
  storedWatchlist: StoredWatchlistEntry[] = [],
): DashboardWatchlistRow[] {
  const latestReportsByCompany = new Map(
    uniqueByCompany(reports).map((report) => [report.company.toLowerCase(), report]),
  );

  return storedWatchlist.map((storedEntry) => {
    const report = latestReportsByCompany.get(storedEntry.company.toLowerCase());
    const signals = Array.isArray(report?.signals) ? report.signals : [];

    return {
      id: `watch-${storedEntry.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      company: report?.company ?? storedEntry.company,
      score: report?.score ?? 0,
      prevScore: report?.prevScore ?? report?.score ?? 0,
      lastChecked: report?.createdAt ?? storedEntry.createdAt,
      status: storedEntry.status,
      alertThreshold: storedEntry.alertThreshold,
      recommendation: report?.recommendation ?? "Insufficient signals",
      confidence: report?.confidence ?? "low",
      latestReportId: report?.id ?? null,
      latestMemo: report?.memo ?? null,
      latestSignals: signals,
      signalCount:
        typeof report?.signalCount === "number" ? report.signalCount : signals.length,
      scoreBreakdown: report?.scoreBreakdown ?? null,
    };
  });
}

function buildSignalFeed(reports: Report[]): SignalFeedItem[] {
  return reports
    .flatMap((report) =>
      (Array.isArray(report.signals) ? report.signals : []).map((signal) => ({
        id: signal.id,
        company: report.company,
        type: signal.type,
        source: signal.source,
        title: signal.title,
        detail: signal.detail,
        weight: signal.weight,
        scrapedAt: signal.scrapedAt,
      })),
    )
    .sort(
      (left, right) =>
        new Date(right.scrapedAt).getTime() - new Date(left.scrapedAt).getTime(),
    )
    .slice(0, 80);
}

function buildSignalSummary(feed: SignalFeedItem[]): DashboardSignalSummary[] {
  return (["regulatory", "personnel", "hiring", "news"] as SignalType[]).map((type) => {
    const items = feed.filter((signal) => signal.type === type);
    const companies = new Set(items.map((signal) => signal.company.toLowerCase()));

    return {
      type,
      totalSignals: items.length,
      watchedCompanies: companies.size,
      latestCompany: items[0]?.company ?? null,
    };
  });
}

function buildOverview(reports: Report[], watchlist: DashboardWatchlistRow[]): DashboardOverview {
  const totalScore = watchlist.reduce((sum, item) => sum + item.score, 0);

  return {
    totalReports: reports.length,
    watchedCompanies: watchlist.length,
    activeAlerts: watchlist.filter((item) => item.score >= item.alertThreshold).length,
    averageScore: watchlist.length ? Math.round(totalScore / watchlist.length) : 0,
    lastRunAt: reports[0]?.createdAt ?? null,
    topCompany: watchlist[0]?.company ?? null,
  };
}

export function buildDashboardData(
  reports: Report[],
  storedWatchlist: StoredWatchlistEntry[] = [],
): DashboardData {
  const sortedReports = reports
    .filter((report) => report && report.company)
    .slice()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  const watchlist = buildWatchlistFromReports(sortedReports, storedWatchlist).sort(
    (left, right) => right.score - left.score,
  );
  const signalFeed = buildSignalFeed(sortedReports);
  const signalSummary = buildSignalSummary(signalFeed);
  const overview = buildOverview(sortedReports, watchlist);

  return {
    reports: sortedReports,
    watchlist,
    signalFeed,
    signalSummary,
    overview,
  };
}
