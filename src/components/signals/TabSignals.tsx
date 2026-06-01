import type { DashboardSignalSummary, SignalFeedItem, SignalType } from "@/types/nexus";
import { SIGNAL_LABELS, getSignalColor } from "@/components/analyze/analyze-utils";
import { formatAgo } from "@/lib/dashboard-helpers";

interface TabSignalsProps {
  feed: SignalFeedItem[];
  summary: DashboardSignalSummary[];
}

const FILTERS = [
  { label: "LIVE", tone: "#ff2d2d" },
  { label: "ALL", tone: "#c8ff00" },
  { label: "REG", tone: "#444" },
  { label: "EXEC", tone: "#444" },
  { label: "HIRE", tone: "#444" },
  { label: "NEWS", tone: "#444" },
] as const;

export function TabSignals({ feed, summary }: TabSignalsProps) {
  const totalSignals = feed.length;
  const newSignals = feed.filter((item) => {
    const ageMs = Date.now() - new Date(item.scrapedAt).getTime();
    return ageMs <= 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="w-full max-w-[994px]" style={{ paddingTop: 2, zoom: 0.9 }}>
      <div className="mb-10 flex items-start justify-between gap-6">
        <header className="min-w-0">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-10 bg-[#c8ff00]" />
            <span className="font-mono text-[16px] font-medium uppercase tracking-[0.36em] text-[#c8ff00]">
              Signals Feed
            </span>
          </div>
          <h1
            className="font-hand leading-[0.95] tracking-[0.01em] text-white"
            style={{ fontSize: "clamp(52px, 5.8vw, 78px)" }}
          >
            LIVE SIGNAL
            <br />
            STREAM
          </h1>
          <p className="mt-2 font-mono text-[16px] tracking-[0.01em] text-[#56565d]">
            <span className="text-[#ff2d2d]">LIVE</span> - {totalSignals} signals across all companies{" "}
            <span className="text-[#ffb300]">+{newSignals} new</span>
          </p>
        </header>

        <div className="mt-6 flex shrink-0 flex-wrap justify-end gap-3 max-w-[420px]">
          {FILTERS.map((filter, index) => (
            <button
              className={[
                "h-[48px] min-w-[88px] border px-6 font-mono text-[15px] uppercase tracking-[0.12em]",
                index === 0
                  ? "border-[#5c1212] bg-[rgba(66,11,11,0.25)] text-[#ff4040]"
                  : index === 1
                    ? "border-[#4f5b13] bg-[#182000] text-[#dfff4c]"
                    : "border-[#23232c] text-[#444]",
              ].join(" ")}
              key={filter.label}
              type="button"
            >
              {index === 0 ? "• " : ""}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {summary.map((item) => (
          <SignalMetricCard key={item.type} item={item} />
        ))}
      </section>

      <section className="mt-7 overflow-hidden border border-[#23232c] bg-black/20">
        {feed.map((item, index) => (
          <SignalFeedRow item={item} key={`${item.id}-${index}`} />
        ))}
      </section>
    </div>
  );
}

function SignalMetricCard({ item }: { item: DashboardSignalSummary }) {
  const color = getSignalColor(item.type);

  return (
    <div className="min-h-[156px] border border-[#23232c] bg-[#101015] px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <span
          className="inline-flex border px-3 py-2 font-mono text-[12px] uppercase tracking-[0.1em]"
          style={{ borderColor: `${color}66`, color }}
        >
          {signalShortLabel(item.type)}
        </span>
        <span className="font-mono text-[15px] tracking-[0.06em] text-[#555]">
          {SIGNAL_LABELS[item.type].toLowerCase().replace(/^\w/, (char) => char.toUpperCase())}
        </span>
      </div>
      <div className="font-hand text-[56px] leading-none" style={{ color }}>
        {item.totalSignals}
      </div>
    </div>
  );
}

function SignalFeedRow({ item }: { item: SignalFeedItem }) {
  const color = getSignalColor(item.type);

  return (
    <div className="grid min-h-[72px] grid-cols-[44px_90px_1.8fr_1fr_1fr] items-center border-b border-[#111] px-6 font-mono text-[15px] last:border-b-0">
      <div className="grid place-items-center">
        <span
          className="h-3 w-3 rounded-full shadow-[0_0_16px_currentColor]"
          style={{ color, backgroundColor: color }}
        />
      </div>

      <div>
        <span
          className="inline-flex border px-3 py-2 font-mono text-[12px] uppercase tracking-[0.1em]"
          style={{ borderColor: `${color}66`, color }}
        >
          {signalShortLabel(item.type)}
        </span>
      </div>

      <div className="pr-6 text-[15px] text-white">{item.title}</div>

      <div className="pr-6 text-[15px] text-white">{item.company}</div>

      <div className="text-right text-[14px] text-[#555]">
        {item.source} {formatAgo(item.scrapedAt)} w:{item.weight}
      </div>
    </div>
  );
}

function signalShortLabel(type: SignalType) {
  if (type === "regulatory") return "REG";
  if (type === "personnel") return "EXEC";
  if (type === "hiring") return "HIRE";
  return "NEWS";
}
