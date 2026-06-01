import type { AnalyzeStage } from "@/components/analyze/analyze-types";
import { getAgentColor } from "@/components/analyze/analyze-utils";
import type { AgentLog } from "@/types/nexus";

const agents = [
  { code: "A", name: "AGENT-A", role: "Signal Collector", stage: "agent-a" },
  { code: "B", name: "AGENT-B", role: "Probability Scorer", stage: "agent-b" },
  { code: "C", name: "AGENT-C", role: "Memo Drafter", stage: "agent-c" },
] as const;

export function AgentPipeline({ logs, stage }: { logs: AgentLog[]; stage: AnalyzeStage }) {
  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {agents.map((agent) => {
        const color = getAgentColor(agent.code);
        const agentLogs = logs.filter((log) => log.agent === agent.code);
        const isDone = agentLogs.some(
          (log) => log.type === "success" || log.type === "warn" || log.type === "highlight",
        );
        const isRunning = stage === agent.stage && !isDone;
        const statusLabel = isDone ? "DONE" : isRunning ? "RUN" : "IDLE";

        return (
          <div
            className="min-h-[128px] border px-6 py-7"
            key={agent.code}
            style={{
              backgroundColor: `${color}08`,
              borderColor: isRunning || isDone ? `${color}aa` : `${color}66`,
              boxShadow: isRunning ? `inset 0 0 0 1px ${color}44` : "none",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="font-mono text-[16px] uppercase tracking-[0.18em]"
                  style={{ color }}
                >
                  {agent.name}
                </div>
                <div className="mt-3 font-mono text-[16px] text-[#4d4d54]">{agent.role}</div>
              </div>
              <div className="pt-1 font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color }}>
                {statusLabel}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
