import type { AgentLog } from "@/types/nexus";
import {
  getLogToneClass,
  getPromptSymbol,
} from "@/components/analyze/analyze-utils";

export function AnalyzeTerminal({
  logs,
  isRunning,
}: {
  logs: AgentLog[];
  isRunning: boolean;
}) {
  return (
    <section className="overflow-hidden border border-[#1a1a22] bg-[#080808]">
      <div className="flex h-[58px] items-center gap-3 border-b border-[#1a1a22] px-6">
        <span className="h-[18px] w-[18px] rounded-full bg-[#ff6b57]" />
        <span className="h-[18px] w-[18px] rounded-full bg-[#ffc247]" />
        <span className="h-[18px] w-[18px] rounded-full bg-[#33d35b]" />
        <span className="ml-3 font-mono text-[16px] tracking-[0.02em] text-[#444]">
          nexus-agent • live execution
        </span>
      </div>

      <div className="min-h-[216px] space-y-4 px-6 py-7 font-mono text-[15px] leading-relaxed">
        {logs.length ? (
          logs.map((log, index) => (
            <div className="flex items-start gap-4" key={`${log.timestamp}-${log.message}-${index}`}>
              <span className="mt-[1px] min-w-5 text-[#d6ff1b]">{getPromptSymbol(log.type)}</span>
              <span className={getLogToneClass(log.type)}>{log.message}</span>
            </div>
          ))
        ) : (
          <div className="flex h-[170px] items-center justify-center text-center">
            <div>
              <div className="font-mono text-[18px] tracking-[0.08em] text-[#666]">
                NO EXECUTION STREAM YET
              </div>
              <div className="mt-3 font-mono text-[13px] tracking-[0.12em] text-[#3f5166]">
                ENTER A COMPANY AND RUN THE AGENT PIPELINE
              </div>
            </div>
          </div>
        )}
        {isRunning ? <span className="inline-block h-5 w-2 animate-blink bg-[#c8ff00]" /> : null}
      </div>
    </section>
  );
}
