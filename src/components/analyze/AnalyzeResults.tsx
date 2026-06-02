"use client";

import type { PipelineResult, ScoreBreakdown, Signal } from "@/types/nexus";
import {
  getBreakdownMax,
  getScoreColor,
  getScoreLabel,
  getSignalColor,
  SIGNAL_LABELS,
  SIGNAL_TYPES,
  normalizeContribution,
} from "@/components/analyze/analyze-utils";

interface AnalyzeResultsProps {
  company: string;
  result: PipelineResult;
}

export function AnalyzeResults({ company, result }: AnalyzeResultsProps) {
  const signals = Array.isArray(result.signals) ? result.signals : [];
  const redFlags = Array.isArray(result.redFlags) ? result.redFlags : [];

  return (
    <section className="space-y-6">
      <MetricStrip company={company} result={result} signals={signals} />
      <MemoPanel company={company} result={result} />
      <MonitoringFactors factors={redFlags} />
      <BreakdownChart breakdown={result.scoreBreakdown} />
      <SignalList signals={signals} />
    </section>
  );
}

function MetricStrip({
  company,
  result,
  signals,
}: {
  company: string;
  result: PipelineResult;
  signals: Signal[];
}) {
  return (
    <section className="grid grid-cols-1 border border-[#1a1a22] bg-black/35 lg:grid-cols-4">
      <MetricCell label="COMPANY">
        <div className="font-hand text-[32px] leading-none text-white">
          {company || result.memo?.company || "--"}
        </div>
      </MetricCell>
      <MetricCell label="SCORE">
        <div
          className="inline-flex border px-4 py-3 font-mono text-[14px] tracking-[0.06em]"
          style={{
            color: getScoreColor(result.score),
            borderColor: `${getScoreColor(result.score)}55`,
          }}
        >
          {result.score}/100 · {getScoreLabel(result.score)}
        </div>
      </MetricCell>
      <MetricCell label="RECOMMENDATION">
        <div className="font-syne text-[18px] font-semibold text-[#d6ff1b]">
          {result.recommendation}
        </div>
      </MetricCell>
      <MetricCell label="SIGNALS">
        <div className="font-mono text-[18px] text-white">{signals.length} detected</div>
      </MetricCell>
    </section>
  );
}

function MetricCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[120px] border-b border-[#1a1a22] px-7 py-6 lg:border-b-0 lg:border-r lg:border-r-[#1a1a22] last:border-r-0">
      <div className="font-mono text-[13px] tracking-[0.18em] text-[#4f4f56]">{label}</div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function MemoPanel({ company, result }: { company: string; result: PipelineResult }) {
  const memoText =
    result.memo?.text ||
    result.keyInsight ||
    "No investment memo was generated because the alert threshold was not crossed.";

  async function sendToTeams() {
    if (!result.memo) return;

    await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company,
        score: result.score,
        memo: result.memo,
      }),
    });
  }

  return (
    <div className="border border-[#425400] bg-[rgba(20,24,7,0.22)] px-7 py-6">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <h3 className="font-mono text-[18px] uppercase tracking-[0.22em] text-[#d6ff1b]">
          INVESTMENT INTELLIGENCE MEMO
        </h3>
        <button
          className="border border-[#2a2f14] px-6 py-3 font-mono text-[14px] uppercase tracking-[0.14em] text-[#666] disabled:text-[#353535]"
          disabled={!result.memo}
          onClick={sendToTeams}
          type="button"
        >
          SEND TO TEAMS
        </button>
      </div>

      <p className="whitespace-pre-wrap font-mono text-[14px] leading-8 text-[#7b7b80]">{memoText}</p>
    </div>
  );
}

function BreakdownChart({ breakdown }: { breakdown: ScoreBreakdown | null | undefined }) {
  const max = getBreakdownMax(breakdown);

  return (
    <div className="border border-[#1a1a22] bg-[#050505] px-7 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-mono text-[13px] tracking-[0.18em] text-[#666]">SIGNAL BREAKDOWN</h3>
      </div>

      <div className="space-y-4">
        {SIGNAL_TYPES.map((type) => {
          const item = breakdown?.[type];
          const contribution = normalizeContribution(item?.contribution);
          const width = Math.max(0, Math.min(100, (contribution / max) * 100));

          return (
            <div className="grid grid-cols-[120px_1fr_120px] items-center gap-4" key={type}>
              <span className="font-mono text-[12px] tracking-[0.12em] text-[#666]">
                {SIGNAL_LABELS[type]}
              </span>
              <div className="h-3 bg-[#111118]">
                <div
                  className="h-full"
                  style={{
                    width: `${width}%`,
                    background: getSignalColor(type),
                  }}
                />
              </div>
              <span className="text-right font-mono text-[12px] text-[#666]">
                {item?.signals ?? 0} / {contribution}pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonitoringFactors({ factors }: { factors: string[] }) {
  if (!factors.length) return null;

  return (
    <div className="border border-[#3d2f12] bg-[rgba(22,16,5,0.32)] px-7 py-6">
      <h3 className="mb-5 font-mono text-[13px] tracking-[0.18em] text-[#ff9900]">
        RISK / MONITORING FACTORS
      </h3>
      <ul className="space-y-3">
        {factors.map((factor, index) => (
          <li className="font-mono text-[14px] leading-7 text-[#9c8a6f]" key={`${factor}-${index}`}>
            {factor}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignalList({ signals }: { signals: Signal[] }) {
  if (!signals.length) return null;

  return (
    <div className="border border-[#1a1a22] bg-[#050505] px-7 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-mono text-[13px] tracking-[0.18em] text-[#666]">DETECTED SIGNALS</h3>
      </div>

      <div className="space-y-3">
        {signals.map((signal, index) => (
          <article
            className="grid gap-4 border border-[#15151c] bg-black p-4 lg:grid-cols-[120px_1fr_120px]"
            key={signal.id || `${signal.type}-${signal.title}-${index}`}
          >
            <div>
              <span
                className="inline-block border px-2 py-1 font-mono text-[10px] tracking-[0.14em]"
                style={{
                  borderColor: `${getSignalColor(signal.type)}66`,
                  color: getSignalColor(signal.type),
                }}
              >
                {SIGNAL_LABELS[signal.type]}
              </span>
            </div>
            <div>
              <h4 className="font-mono text-[13px] tracking-[0.08em] text-white">{signal.title}</h4>
              <p className="mt-2 font-syne text-[15px] leading-7 text-[#777]">{signal.detail}</p>
            </div>
            <div className="font-mono text-[12px] tracking-[0.08em] text-[#666] lg:text-right">
              <div>{signal.source}</div>
              <div className="mt-2 text-[#c8ff00]">w/{signal.weight}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
