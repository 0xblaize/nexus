import type { Report, SignalType } from "@/types/nexus";
import { getScoreColor, getScoreLabel, getSignalColor, SIGNAL_LABELS } from "@/components/analyze/analyze-utils";

interface TabReportsProps {
  reports: Report[];
}

const FILTERS = ["ALL", "HIGH", "MED", "LOW"] as const;
const BREAKDOWN_ORDER: SignalType[] = ["regulatory", "personnel", "hiring", "news"];

export function TabReports({ reports }: TabReportsProps) {
  return (
    <div className="w-full max-w-[994px]" style={{ paddingTop: 2, zoom: 0.9 }}>
      <div className="mb-10 flex items-start justify-between gap-6">
        <header className="min-w-0">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-10 bg-[#c8ff00]" />
            <span className="font-mono text-[16px] font-medium uppercase tracking-[0.36em] text-[#c8ff00]">
              Reports
            </span>
          </div>
          <h1
            className="font-hand leading-[0.95] tracking-[0.01em] text-white"
            style={{ fontSize: "clamp(52px, 5.8vw, 78px)" }}
          >
            ANALYSIS
            <br />
            HISTORY
          </h1>
          <p className="mt-2 font-mono text-[16px] tracking-[0.01em] text-[#56565d]">
            {reports.length} total reports - sorted by recency
          </p>
        </header>

        <div className="mt-6 flex shrink-0 gap-3">
          {FILTERS.map((filter, index) => (
            <button
              className={[
                "h-[48px] min-w-[88px] border px-6 font-mono text-[15px] uppercase tracking-[0.12em]",
                index === 0
                  ? "border-[#4f5b13] bg-[#182000] text-[#dfff4c]"
                  : "border-[#23232c] text-[#444]",
              ].join(" ")}
              key={filter}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report, index) => (
          <ReportCard expanded={index === 0} key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}

function ReportCard({ report, expanded }: { report: Report; expanded: boolean }) {
  const scoreColor = getScoreColor(report.score);
  const signalCount = Array.isArray(report.signals) ? report.signals.length : 0;
  const sparkPoints = buildSparklinePoints(report.score, report.prevScore ?? report.score);
  const memoText = report.memo?.text ?? report.keyInsight ?? "No memo generated.";

  return (
    <article
      className={[
        "border bg-black/20",
        expanded ? "border-[#3e5300]" : "border-[#23232c]",
      ].join(" ")}
    >
      <div className="grid min-h-[92px] grid-cols-[1.6fr_44px_180px_160px_180px_110px_34px] items-center gap-4 px-6">
        <div className="flex min-w-0 items-center gap-5">
          <span
            className="h-4 w-4 shrink-0 rounded-full shadow-[0_0_16px_currentColor]"
            style={{ color: scoreColor, backgroundColor: scoreColor }}
          />
          <span className="truncate font-syne text-[18px] font-semibold text-white">{report.company}</span>
        </div>

        <div className="text-center font-mono text-[18px]" style={{ color: scoreColor }}>
          []
        </div>

        <div className="h-[56px]">
          <svg className="h-full w-full" viewBox="0 0 180 56" xmlns="http://www.w3.org/2000/svg">
            <polyline
              fill="none"
              points={sparkPoints}
              stroke={scoreColor}
              strokeWidth="3"
            />
            <line x1="0" x2="180" y1="52" y2="52" stroke={scoreColor} strokeOpacity="0.28" />
          </svg>
        </div>

        <div
          className="inline-flex justify-center border px-4 py-3 font-mono text-[15px] tracking-[0.06em]"
          style={{ borderColor: `${scoreColor}55`, color: scoreColor }}
        >
          {report.score}/100 - {getScoreLabel(report.score)}
        </div>

        <div
          className="inline-flex justify-center border px-4 py-3 font-mono text-[15px] tracking-[0.04em]"
          style={{ borderColor: `${scoreColor}44`, color: scoreColor }}
        >
          {report.recommendation}
        </div>

        <div className="font-mono text-[15px] text-[#56565d]">{signalCount} signals</div>

        <div className="text-right font-mono text-[18px] text-[#4b4b50]">
          {expanded ? "-" : "+"}
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[#171a0d] px-6 py-6">
          <div className="grid gap-4 lg:grid-cols-4">
            {BREAKDOWN_ORDER.map((type) => {
              const item = report.scoreBreakdown?.[type];
              const count = item?.signals ?? 0;
              const tone = getSignalColor(type);

              return (
                <div className="min-h-[148px] border border-[#1a1a22] bg-[#0d0f13] px-5 py-5" key={type}>
                  <span
                    className="inline-flex border px-3 py-2 font-mono text-[12px] uppercase tracking-[0.1em]"
                    style={{ borderColor: `${tone}66`, color: tone }}
                  >
                    {signalLabelForReport(type)}
                  </span>
                  <div className="mt-5 font-hand text-[46px] leading-none text-white">{count}</div>
                  <div className="mt-2 font-mono text-[13px] tracking-[0.1em] text-[#555]">signals</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border border-[#314100] bg-[rgba(11,14,7,0.48)] px-6 py-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="font-mono text-[18px] uppercase tracking-[0.2em] text-[#d6ff1b]">
                INVESTMENT MEMO
              </div>
              <div className="flex gap-3">
                <button className="border border-[#23283f] px-5 py-3 font-mono text-[13px] uppercase tracking-[0.1em] text-[#4b4f66]" type="button">
                  TEAMS
                </button>
                <button className="border border-[#23283f] px-5 py-3 font-mono text-[13px] uppercase tracking-[0.1em] text-[#4b4f66]" type="button">
                  PDF
                </button>
              </div>
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap font-mono text-[14px] leading-8 text-[#68686e]">
              {memoText}
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function buildSparklinePoints(score: number, prevScore: number) {
  const values = [
    Math.max(12, Math.min(96, prevScore - 8)),
    Math.max(12, Math.min(96, prevScore)),
    Math.max(12, Math.min(96, Math.round((prevScore + score) / 2))),
    Math.max(12, Math.min(96, score)),
  ];

  return values
    .map((value, index) => {
      const x = [0, 60, 110, 180][index];
      const y = 56 - Math.round((value / 100) * 48);
      return `${x},${y}`;
    })
    .join(" ");
}

function signalLabelForReport(type: SignalType) {
  if (type === "regulatory") return "REG";
  if (type === "personnel") return "EXEC";
  if (type === "hiring") return "HIRE";
  return "NEWS";
}
