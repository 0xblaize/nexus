import type { AgentCode, AgentLogTone, ScoreBreakdown, SignalType } from "@/types/nexus";

export const SIGNAL_TYPES: SignalType[] = ["regulatory", "personnel", "hiring", "news"];

export const SIGNAL_POINT_CAPS: Record<SignalType, number> = {
  regulatory: 36,
  personnel: 23,
  hiring: 18,
  news: 23,
};

export const SIGNAL_LABELS: Record<SignalType, string> = {
  regulatory: "REGULATORY",
  personnel: "PERSONNEL",
  hiring: "HIRING",
  news: "NEWS",
};

export function getSignalColor(type: SignalType) {
  if (type === "regulatory") return "#ff2d2d";
  if (type === "personnel") return "#ff9900";
  if (type === "hiring") return "#c8ff00";
  return "#4488ff";
}

export function getAgentColor(agent: AgentCode) {
  if (agent === "A") return "#4488ff";
  if (agent === "B") return "#ff9900";
  if (agent === "C") return "#c8ff00";
  return "#888";
}

export function getScoreColor(score: number) {
  if (score >= 70) return "#ff2d2d";
  if (score >= 50) return "#ff9900";
  return "#28c840";
}

export function getScoreLabel(score: number) {
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MED";
  return "LOW";
}

export function getPromptSymbol(type: AgentLogTone) {
  if (type === "success") return "OK";
  if (type === "warn") return "!!";
  if (type === "highlight") return ">>";
  return "$";
}

export function getLogToneClass(type: AgentLogTone) {
  if (type === "success") return "text-[#28c840]";
  if (type === "warn") return "text-[#ff9900]";
  if (type === "highlight") return "text-[#c8ff00]";
  return "text-[#d9d9d9]";
}

export function normalizeContribution(value: number | undefined) {
  if (!Number.isFinite(value)) return 0;
  const safeValue = Number(value);
  return safeValue <= 1 ? Math.round(safeValue * 100) : Math.round(safeValue);
}

export function getBreakdownMax(breakdown: ScoreBreakdown | null | undefined) {
  if (!breakdown) return 1;
  return Math.max(
    1,
    ...SIGNAL_TYPES.map((type) => breakdown[type]?.maxScore ?? SIGNAL_POINT_CAPS[type]),
  );
}

export function getCurrentTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
