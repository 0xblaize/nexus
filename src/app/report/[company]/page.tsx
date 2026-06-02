"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Signal {
  id: string;
  type: string;
  label: string;
  title: string;
  detail: string;
  rawUrl?: string;
  source?: string;
  weight?: number;
  scrapedAt?: string;
}

interface ScoreBreakdownItem {
  signals: number;
  contribution: number;
  maxScore: number;
  weight: number;
}

interface Memo {
  text: string;
  recommendation: string;
  confidence: string;
  generatedAt: string;
}

interface ReportPayload {
  id: string;
  company: string;
  score: number;
  recommendation: string;
  confidence: string;
  signals: Signal[];
  scoreBreakdown?: {
    regulatory?: ScoreBreakdownItem;
    personnel?: ScoreBreakdownItem;
    hiring?: ScoreBreakdownItem;
    patents?: ScoreBreakdownItem;
    news?: ScoreBreakdownItem;
    ir_traffic?: ScoreBreakdownItem;
  };
  memo?: Memo;
  keyInsight?: string;
  createdAt: string;
}

export default function ReportLayout() {
  const params = useParams();
  const companyName = decodeURIComponent(params.company as string);

  const [reportData, setReportData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/get?company=${encodeURIComponent(companyName)}`);
        if (response.ok) {
          const json = await response.json();
          setReportData(json);
        } else {
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || "Failed to load target audit report.");
        }
      } catch (err) {
        console.error("Failed to load target data matrix:", err);
        setError("Network error: Failed to connect to NEXUS ingestion backend.");
      } finally {
        setLoading(false);
      }
    }
    if (companyName) fetchReport();
  }, [companyName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black font-mono text-lime-500">
        <div className="flex items-center space-x-2 text-lg animate-pulse">
          <span>⚙️</span>
          <span>INGESTING TARGET PIPELINE STATE...</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black font-mono text-[#ff2d2d] p-6 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-xl font-bold uppercase tracking-wider mb-2">Audit Report Unreachable</h2>
        <p className="text-sm text-neutral-500 max-w-md mb-6">{error || "No active telemetry payload found for this company target."}</p>
        <Link href="/reports" className="border border-[#ff2d2d]/40 px-6 py-2 text-xs uppercase tracking-widest text-[#ff2d2d] hover:bg-[#ff2d2d] hover:text-black transition-all">
          Return to History
        </Link>
      </div>
    );
  }

  const score = reportData.score;
  const ratingColor = score >= 70 ? "#ff2d2d" : score >= 50 ? "#ff9900" : "#c8ff00";

  // Safe fallback values matching our 6-category architecture point caps
  const breakdown = reportData.scoreBreakdown || {};
  const regScore = breakdown.regulatory?.contribution ?? 0;
  const regMax = breakdown.regulatory?.maxScore ?? 25;
  const execScore = breakdown.personnel?.contribution ?? 0;
  const execMax = breakdown.personnel?.maxScore ?? 15;
  const hireScore = breakdown.hiring?.contribution ?? 0;
  const hireMax = breakdown.hiring?.maxScore ?? 15;
  const patScore = breakdown.patents?.contribution ?? 0;
  const patMax = breakdown.patents?.maxScore ?? 15;
  const newsScore = breakdown.news?.contribution ?? 0;
  const newsMax = breakdown.news?.maxScore ?? 15;
  const irScore = breakdown.ir_traffic?.contribution ?? 0;
  const irMax = breakdown.ir_traffic?.maxScore ?? 15;

  const signalsList = reportData.signals || [];
  const memoText = reportData.memo?.text || reportData.keyInsight || "No custom memos compiled.";

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-mono p-6 lg:p-12 selection:bg-lime-500 selection:text-black">
      {/* Dynamic Header Pathing */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center text-xs tracking-widest">
        <div className="text-neutral-500 uppercase">
          <Link href="/reports" className="hover:text-lime-500 transition-colors">/ reports</Link> /{" "}
          <span className="text-lime-500">{companyName.toLowerCase()}</span>
        </div>
        <Link href="/reports" className="text-neutral-500 hover:text-white transition-colors border border-neutral-800 px-3 py-1 rounded">
          ← BACK
        </Link>
      </div>

      <div className="max-w-7xl mx-auto space-y-10">
        <div className="border-b border-neutral-900 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: ratingColor }} />
              <span className="text-[10px] text-neutral-500 tracking-[0.2em] uppercase">Target Intelligence Assessment</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase mt-2">{companyName} Audit</h1>
            <p className="text-xs text-neutral-500 mt-2 font-mono">
              NEXUS multi-agent pipeline extraction data. Generated on {new Date(reportData.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-neutral-950/80 border border-neutral-900 px-6 py-4 rounded">
            <div className="text-right">
              <div className="text-[10px] text-neutral-500 uppercase tracking-widest">VERDICT SCORE</div>
              <div className="text-xs font-bold mt-1 uppercase" style={{ color: ratingColor }}>
                {reportData.recommendation}
              </div>
            </div>
            <div className="text-4xl font-black border-l border-neutral-800 pl-4" style={{ color: ratingColor }}>
              {score}<span className="text-xs text-neutral-600 font-normal">/100</span>
            </div>
          </div>
        </div>

        {/* 1. SCOREBOARD SECTION */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">1. Macro Risk Scoreboard</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Regulatory Filings */}
            <div className="bg-[#0b0c10] border border-neutral-900/60 p-4 rounded hover:border-[#ff2d2d]/30 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">REGULATORY</span>
                <span className="text-sm">⚖️</span>
              </div>
              <div className="text-2xl font-bold mt-3 text-white">
                {regScore.toFixed(1)} <span className="text-[10px] text-neutral-600 font-normal">/ {regMax} max</span>
              </div>
              <div className="w-full bg-neutral-950 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-[#ff2d2d] h-full transition-all" style={{ width: `${(regScore / regMax) * 100}%` }} />
              </div>
            </div>

            {/* Executive Movement */}
            <div className="bg-[#0b0c10] border border-neutral-900/60 p-4 rounded hover:border-[#ff9900]/30 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">EXECUTIVE</span>
                <span className="text-sm">👤</span>
              </div>
              <div className="text-2xl font-bold mt-3 text-white">
                {execScore.toFixed(1)} <span className="text-[10px] text-neutral-600 font-normal">/ {execMax} max</span>
              </div>
              <div className="w-full bg-neutral-950 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-[#ff9900] h-full transition-all" style={{ width: `${(execScore / execMax) * 100}%` }} />
              </div>
            </div>

            {/* Hiring Pattern Shifts */}
            <div className="bg-[#0b0c10] border border-neutral-900/60 p-4 rounded hover:border-[#c8ff00]/30 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">HIRING SLOW</span>
                <span className="text-sm">📋</span>
              </div>
              <div className="text-2xl font-bold mt-3 text-white">
                {hireScore.toFixed(1)} <span className="text-[10px] text-neutral-600 font-normal">/ {hireMax} max</span>
              </div>
              <div className="w-full bg-neutral-950 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-[#c8ff00] h-full transition-all" style={{ width: `${(hireScore / hireMax) * 100}%` }} />
              </div>
            </div>

            {/* Patent Clusters */}
            <div className="bg-[#0b0c10] border border-neutral-900/60 p-4 rounded hover:border-[#cc33ff]/30 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">PATENTS</span>
                <span className="text-sm">🔬</span>
              </div>
              <div className="text-2xl font-bold mt-3 text-white">
                {patScore.toFixed(1)} <span className="text-[10px] text-neutral-600 font-normal">/ {patMax} max</span>
              </div>
              <div className="w-full bg-neutral-950 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-[#cc33ff] h-full transition-all" style={{ width: `${(patScore / patMax) * 100}%` }} />
              </div>
            </div>

            {/* News Velocity */}
            <div className="bg-[#0b0c10] border border-neutral-900/60 p-4 rounded hover:border-[#4488ff]/30 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">NEWS SPEED</span>
                <span className="text-sm">📰</span>
              </div>
              <div className="text-2xl font-bold mt-3 text-white">
                {newsScore.toFixed(1)} <span className="text-[10px] text-neutral-600 font-normal">/ {newsMax} max</span>
              </div>
              <div className="w-full bg-neutral-950 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-[#4488ff] h-full transition-all" style={{ width: `${(newsScore / newsMax) * 100}%` }} />
              </div>
            </div>

            {/* IR Page Traffic */}
            <div className="bg-[#0b0c10] border border-neutral-900/60 p-4 rounded hover:border-[#00ffd5]/30 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">IR TRAFFIC</span>
                <span className="text-sm">📊</span>
              </div>
              <div className="text-2xl font-bold mt-3 text-white">
                {irScore.toFixed(1)} <span className="text-[10px] text-neutral-600 font-normal">/ {irMax} max</span>
              </div>
              <div className="w-full bg-neutral-950 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-[#00ffd5] h-full transition-all" style={{ width: `${(irScore / irMax) * 100}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* 2. EXECUTIVE MEMO */}
        {memoText && (
          <section className="bg-neutral-950 border-l-2 border-lime-500 border-y border-r border-neutral-900 p-6 rounded text-xs leading-relaxed text-neutral-400">
            <span className="text-lime-500 font-bold block uppercase tracking-wider mb-2">2. Executive Summary Intelligence Memo</span>
            <div className="whitespace-pre-line text-neutral-300 max-w-4xl">{memoText}</div>
          </section>
        )}

        {/* 3. CATEGORIZED SIGNAL FEED */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">3. Categorized Telemetry Event Feed</h3>
          <div className="space-y-3">
            {signalsList.length > 0 ? (
              signalsList.map((signal, idx) => {
                let borderColor = "border-neutral-900";
                let badgeStyle = "bg-neutral-900/40 text-neutral-400 border border-neutral-800";

                if (signal.type === "regulatory") {
                  borderColor = "border-l-4 border-l-[#ff2d2d] border-y border-r border-neutral-900/80";
                  badgeStyle = "bg-[#ff2d2d]/10 text-[#ff2d2d] border border-[#ff2d2d]/30";
                } else if (signal.type === "personnel") {
                  borderColor = "border-l-4 border-l-[#ff9900] border-y border-r border-neutral-900/80";
                  badgeStyle = "bg-[#ff9900]/10 text-[#ff9900] border border-[#ff9900]/30";
                } else if (signal.type === "hiring") {
                  borderColor = "border-l-4 border-l-[#c8ff00] border-y border-r border-neutral-900/80";
                  badgeStyle = "bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/30";
                } else if (signal.type === "patents") {
                  borderColor = "border-l-4 border-l-[#cc33ff] border-y border-r border-neutral-900/80";
                  badgeStyle = "bg-[#cc33ff]/10 text-[#cc33ff] border border-[#cc33ff]/30";
                } else if (signal.type === "news") {
                  borderColor = "border-l-4 border-l-[#4488ff] border-y border-r border-neutral-900/80";
                  badgeStyle = "bg-[#4488ff]/10 text-[#4488ff] border border-[#4488ff]/30";
                } else if (signal.type === "ir_traffic") {
                  borderColor = "border-l-4 border-l-[#00ffd5] border-y border-r border-neutral-900/80";
                  badgeStyle = "bg-[#00ffd5]/10 text-[#00ffd5] border border-[#00ffd5]/30";
                }

                return (
                  <div key={signal.id || idx} className={`bg-neutral-950 p-5 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${borderColor}`}>
                    <div className="space-y-2 max-w-4xl">
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${badgeStyle}`}>
                          {signal.label || signal.type}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-tight">{signal.title}</h4>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{signal.detail}</p>
                    </div>
                    {signal.rawUrl && (
                      <div className="flex items-center shrink-0">
                        <a href={signal.rawUrl} target="_blank" rel="noreferrer" className="text-[10px] text-lime-500 border border-lime-900/40 bg-lime-950/10 px-4 py-1.5 rounded hover:bg-lime-500 hover:text-black transition-all">
                          [LINK] OUT_SOURCE
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-neutral-600 italic p-6 border border-dashed border-neutral-900 rounded text-center">
                No telemetry signals collected for this target monitor session.
              </div>
            )}
          </div>
        </section>

        {/* 4. SOURCE INGESTION MATRIX */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">4. Source Ingestion Matrix</h3>
          <div className="bg-[#060608] border border-neutral-900 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 bg-neutral-950/60">
                    <th className="p-4 font-semibold uppercase tracking-wider">Source Domain</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-center">Weight Vector</th>
                    <th className="p-4 font-semibold uppercase tracking-wider">Timestamp</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-right">Origin URL</th>
                  </tr>
                </thead>
                <tbody>
                  {signalsList.length > 0 ? (
                    signalsList.map((signal, idx) => {
                      let sourceDomain = signal.source || "Ingested Web Stream";
                      try {
                        if (signal.rawUrl) {
                          sourceDomain = new URL(signal.rawUrl).hostname.replace(/^www\./, "");
                        }
                      } catch (e) {}

                      return (
                        <tr key={signal.id || idx} className="border-b border-neutral-900/60 hover:bg-neutral-950/40 transition-colors">
                          <td className="p-4 font-medium text-white">{sourceDomain}</td>
                          <td className="p-4 text-center font-mono text-[#c8ff00] font-semibold">{signal.weight || "0.45"}</td>
                          <td className="p-4 text-neutral-500">{signal.scrapedAt ? new Date(signal.scrapedAt).toLocaleTimeString() : "Live Telemetry"}</td>
                          <td className="p-4 text-right">
                            {signal.rawUrl ? (
                              <a href={signal.rawUrl} target="_blank" rel="noreferrer" className="text-[10px] text-lime-500 hover:underline">
                                [LINK]
                              </a>
                            ) : (
                              <span className="text-neutral-700 italic">none</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-neutral-600 italic">
                        No telemetry feed ingested to build matrix mapping.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
