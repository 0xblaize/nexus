export type SignalType = "regulatory" | "personnel" | "hiring" | "news";
export type LlmProvider = "gemini";
export type RecommendationType =
  | "Buy interest"
  | "Monitor closely"
  | "Insufficient signals";
export type ConfidenceLevel = "low" | "medium" | "high";
export type AgentCode = "A" | "B" | "C" | "SYS";
export type AgentLogTone = "info" | "success" | "warn" | "highlight";

export interface Signal {
  id: string;
  type: SignalType;
  label?: string;
  source: string;
  title: string;
  detail: string;
  content?: string;
  weight: number;
  company: string;
  rawUrl?: string;
  scrapedAt: string;
}

export interface ScoreBreakdownItem {
  signals: number;
  contribution: number;
  maxScore?: number;
  weight: number;
  avgSignalWeight?: number;
  volumeBonus?: number;
}

export interface ScoreBreakdown {
  regulatory: ScoreBreakdownItem;
  personnel: ScoreBreakdownItem;
  hiring: ScoreBreakdownItem;
  news: ScoreBreakdownItem;
}

export interface Memo {
  company: string;
  score: number;
  recommendation: RecommendationType;
  confidence: ConfidenceLevel;
  text: string;
  generatedAt: string;
  signalCount: number;
  adaptiveCard: TeamsAdaptiveCardPayload;
}

export interface TeamsAdaptiveCardPayload {
  type: "message";
  attachments: Array<{
    contentType: "application/vnd.microsoft.card.adaptive";
    content: {
      $schema: string;
      type: "AdaptiveCard";
      version: string;
      body: unknown[];
      actions?: unknown[];
      msTeams?: Record<string, unknown>;
    };
  }>;
}

export interface Report {
  id: string;
  company: string;
  score: number;
  prevScore?: number;
  recommendation: RecommendationType;
  confidence: ConfidenceLevel;
  signals: Signal[];
  signalCount: number;
  scoreBreakdown: ScoreBreakdown | null;
  memo: Memo | null;
  keyInsight?: string | null;
  createdAt: string;
  hasAlert: boolean;
}

export interface DashboardSignalSummary {
  type: SignalType;
  totalSignals: number;
  watchedCompanies: number;
  latestCompany: string | null;
}

export interface DashboardWatchlistRow extends WatchlistItem {
  recommendation: RecommendationType;
  confidence: ConfidenceLevel;
  latestReportId: string | null;
  latestMemo: Memo | null;
  latestSignals: Signal[];
  signalCount: number;
  scoreBreakdown: ScoreBreakdown | null;
}

export interface DashboardOverview {
  totalReports: number;
  watchedCompanies: number;
  activeAlerts: number;
  averageScore: number;
  lastRunAt: string | null;
  topCompany: string | null;
}

export interface DashboardData {
  reports: Report[];
  watchlist: DashboardWatchlistRow[];
  signalFeed: SignalFeedItem[];
  signalSummary: DashboardSignalSummary[];
  overview: DashboardOverview;
}

export interface WatchlistItem {
  id: string;
  company: string;
  score: number;
  prevScore: number;
  lastChecked: string;
  status: "active" | "paused";
  alertThreshold: number;
}

export interface StoredWatchlistEntry {
  company: string;
  status: "active" | "paused";
  alertThreshold: number;
  createdAt: string;
}

export interface SettingsData {
  displayName: string;
  email: string;
  scoreThreshold: number;
  refreshInterval: "1h" | "3h" | "6h" | "12h" | "24h";
  weeklyDigest: boolean;
  teamsEnabled: boolean;
  teamsWebhook: string;
  emailAlerts: boolean;
  slackAlerts: boolean;
  darkMode: boolean;
  language: string;
  currentPlan: string;
  usageUsed: number;
  usageTotal: number;
  version: string;
}

export interface SignalFeedItem {
  id: string;
  company: string;
  type: SignalType;
  source: string;
  title: string;
  detail: string;
  weight: number;
  scrapedAt: string;
}

export interface AgentLog {
  agent: AgentCode;
  message: string;
  type: AgentLogTone;
  timestamp: string;
}

export interface McpArchiveRecord {
  schema: "mcp.telemetry.run.v1";
  provider: "gemini";
  target: string;
  generatedAt: string;
  run: {
    score: number;
    confidence: ConfidenceLevel;
    recommendation: RecommendationType;
    signalCount: number;
  };
  context: {
    keyInsight?: string;
    reportId?: string;
  };
}

export interface PipelineResult {
  score: number;
  baseScore?: number;
  llmValidatedScore?: number;
  scoreBreakdown: ScoreBreakdown | null;
  confidence: ConfidenceLevel;
  keyInsight?: string;
  redFlags?: string[];
  recommendation: RecommendationType;
  signals: Signal[];
  memo: Memo | null;
  reportId?: string;
  provider?: LlmProvider;
  archivalRecord?: McpArchiveRecord;
}

export interface AnalyzeResponse {
  success: true;
  company: string;
  result: PipelineResult;
  logs?: AgentLog[];
  provider?: LlmProvider;
  archivalRecord?: McpArchiveRecord;
}

export interface SavedReportResponse {
  report: Report | null;
}
