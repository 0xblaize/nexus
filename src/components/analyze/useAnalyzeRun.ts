"use client";

import { useCallback, useState } from "react";

import type { AgentLog } from "@/types/nexus";
import type {
  AnalyzeInitialState,
  AnalyzeStage,
  AnalyzeState,
  AnalyzeStreamEvent,
} from "./analyze-types";

const EMPTY_STATE: AnalyzeState = {
  stage: "idle",
  result: null,
  logs: [],
  error: null,
  company: "",
};

function lifecycleLog(agent: AgentLog["agent"], message: string, type: AgentLog["type"] = "info") {
  return {
    agent,
    message,
    type,
    timestamp: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

export function useAnalyzeRun(initialState?: AnalyzeInitialState | null) {
  const initialCompany = initialState?.company ?? "";
  const [query, setQuery] = useState(initialCompany);
  const [state, setState] = useState<AnalyzeState>({
    stage: initialState?.result ? "done" : "idle",
    result: initialState?.result ?? null,
    logs: [],
    error: null,
    company: initialCompany,
  });

  const reset = useCallback(() => {
    setQuery(initialCompany);
    setState({
      ...EMPTY_STATE,
      stage: initialState?.result ? "done" : "idle",
      result: initialState?.result ?? null,
      company: initialCompany,
    });
  }, [initialCompany, initialState?.result]);

  const run = useCallback(async () => {
    const company = query.trim();
    if (!company || state.stage === "agent-a" || state.stage === "agent-b" || state.stage === "agent-c") {
      return;
    }

    setState({
      stage: "agent-a",
      result: null,
      logs: [],
      error: null,
      company,
    });

    try {
      const response = await fetch("/api/analyze/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Analysis failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AnalyzeStreamEvent;

          if (event.type === "log") {
            setState((current) => ({
              ...current,
              stage: getStageFromAgent(event.log.agent, current.stage),
              logs: [...current.logs, event.log],
            }));
          }

          if (event.type === "result") {
            setState((current) => ({
              ...current,
              stage: "done",
              result: event.result,
              error: null,
              company: event.company,
            }));
          }

          if (event.type === "error") {
            throw new Error(event.error);
          }
        }
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        stage: "error",
        result: null,
        logs: [
          ...current.logs,
          lifecycleLog(
            "SYS",
            error instanceof Error ? error.message : "Analysis failed",
            "warn",
          ),
        ],
        error: error instanceof Error ? error.message : "Analysis failed",
      }));
    }
  }, [query, state.stage]);

  return {
    query,
    setQuery,
    ...state,
    isRunning: state.stage === "agent-a" || state.stage === "agent-b" || state.stage === "agent-c",
    hasCompleted: state.stage === "done" || state.stage === "error",
    run,
    reset,
  };
}

function getStageFromAgent(agent: AgentLog["agent"], current: AnalyzeStage): AnalyzeStage {
  if (agent === "A") return "agent-a";
  if (agent === "B") return "agent-b";
  if (agent === "C") return "agent-c";
  return current;
}
