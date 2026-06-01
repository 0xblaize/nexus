import type { AgentLog, AnalyzeResponse, PipelineResult, Report } from "@/types/nexus";

export type AnalyzeStage = "idle" | "agent-a" | "agent-b" | "agent-c" | "done" | "error";

export interface AnalyzeState {
  stage: AnalyzeStage;
  result: PipelineResult | null;
  logs: AgentLog[];
  error: string | null;
  company: string;
}

export interface AnalyzeInitialState {
  company: string;
  result: PipelineResult | null;
}

export type AnalyzeApiResponse =
  | AnalyzeResponse
  | {
      error: string;
    };

export type AnalyzeStreamEvent =
  | {
      type: "log";
      log: AgentLog;
    }
  | {
      type: "result";
      company: string;
      result: PipelineResult;
    }
  | {
      type: "error";
      error: string;
    };

export function reportToInitialAnalyzeState(report: Report | null | undefined): AnalyzeInitialState | null {
  if (!report) return null;

  return {
    company: report.company,
    result: {
      score: report.score,
      scoreBreakdown: report.scoreBreakdown,
      confidence: report.confidence,
      keyInsight: report.keyInsight ?? undefined,
      recommendation: report.recommendation,
      signals: Array.isArray(report.signals) ? report.signals : [],
      memo: report.memo,
      reportId: report.id,
    },
  };
}
