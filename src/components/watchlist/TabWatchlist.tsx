"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { DashboardWatchlistRow } from "@/types/nexus";
import { formatShortDate, getScoreColor } from "@/lib/dashboard-helpers";

interface TabWatchlistProps {
  rows: DashboardWatchlistRow[];
}

export function TabWatchlist({ rows }: TabWatchlistProps) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const alertRows = rows.filter((row) => row.score >= row.alertThreshold);
  const risingRows = rows.filter((row) => row.score - row.prevScore > 0);

  async function addCompany() {
    const trimmed = company.trim();
    if (!trimmed) {
      setLocalError("Enter a company name first.");
      return;
    }

    setIsSaving(true);
    setLocalError("");

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: trimmed }),
      });

      if (!response.ok) {
        throw new Error("Unable to add company.");
      }

      setCompany("");
      router.refresh();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Unable to add company.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full max-w-[994px]" style={{ paddingTop: 2, zoom: 0.9 }}>
      <div className="mb-10 flex items-start justify-between gap-6">
        <header className="min-w-0">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-10 bg-[#c8ff00]" />
            <span className="font-mono text-[16px] font-medium uppercase tracking-[0.36em] text-[#c8ff00]">
              Watchlist
            </span>
          </div>
          <h1
            className="font-hand whitespace-nowrap tracking-[0.01em] text-white"
            style={{
              fontSize: "clamp(52px, 5.8vw, 78px)",
              lineHeight: 1.12,
              maxWidth: "100%",
            }}
          >
            MONITORED TARGETS
          </h1>
          <p className="mt-2 font-mono text-[16px] tracking-[0.01em] text-[#56565d]">
            {rows.length} active - {alertRows.length} in alert zone
          </p>
        </header>

        <div className="mt-12 flex shrink-0 items-stretch gap-3">
          <input
            className="h-[72px] min-w-[260px] border border-[#23232c] bg-[#101015] px-5 font-mono text-[16px] tracking-[0.02em] text-[#b7b7bd] outline-none placeholder:text-[#555]"
            placeholder="Enter company name"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
          <button
            className="h-[72px] bg-[#c8ff00] px-8 font-mono text-[16px] font-bold uppercase tracking-[0.14em] text-black disabled:opacity-50"
            disabled={isSaving}
            onClick={addCompany}
            type="button"
          >
            + ADD COMPANY
          </button>
        </div>
      </div>

      {localError ? (
        <div className="mb-6 border border-[#ff2d2d]/40 bg-[#ff2d2d]/5 px-5 py-4 font-mono text-[12px] tracking-[0.04em] text-[#ff9999]">
          {localError}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricCard label="Total Monitored" value={rows.length} tone="#888" />
        <MetricCard label="Alert Zone (70+)" value={alertRows.length} tone="#ff2d2d" />
        <MetricCard label="Score Rising" value={risingRows.length} tone="#ff9900" />
      </section>

      <section className="mt-7 overflow-hidden border border-[#23232c] bg-black/25">
        <div className="grid grid-cols-[1.3fr_120px_120px_180px_120px_160px] border-b border-[#1a1a22] bg-[#101015] px-6 py-5 font-mono text-[13px] uppercase tracking-[0.18em] text-[#444]">
          <span>Company</span>
          <span>Score</span>
          <span>Change</span>
          <span>Last Run</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {rows.length ? (
          rows.map((row) => <WatchlistTableRow key={row.id} row={row} />)
        ) : (
          <div className="grid min-h-[220px] place-items-center px-6 py-10 text-center">
            <div>
              <div className="font-mono text-[18px] tracking-[0.08em] text-[#666]">
                NO MONITORED TARGETS
              </div>
              <div className="mt-3 font-mono text-[13px] tracking-[0.12em] text-[#3f5166]">
                RUN ANALYZE OR ADD A COMPANY TO START WATCHING IT
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="min-h-[156px] border border-[#23232c] bg-[#101015] px-6 py-6">
      <div className="font-mono text-[13px] uppercase tracking-[0.2em] text-[#444]">{label}</div>
      <div className="mt-7 font-hand text-[64px] leading-none" style={{ color: tone }}>
        {value}
      </div>
    </div>
  );
}

function WatchlistTableRow({ row }: { row: DashboardWatchlistRow }) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<"" | "pause" | "delete">("");
  const scoreColor = getScoreColor(row.score);
  const change = row.score - row.prevScore;
  const changeLabel = change > 0 ? `+${change}` : String(change);
  const statusColor = row.status === "active" ? "#c8ff00" : "#777";

  async function updateStatus(nextStatus: "active" | "paused") {
    setBusyAction("pause");

    try {
      await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: row.company, status: nextStatus }),
      });
      router.refresh();
    } finally {
      setBusyAction("");
    }
  }

  async function removeCompany() {
    setBusyAction("delete");

    try {
      await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: row.company }),
      });
      router.refresh();
    } finally {
      setBusyAction("");
    }
  }

  return (
    <div className="grid min-h-[76px] grid-cols-[1.3fr_120px_120px_180px_120px_160px] items-center border-b border-[#111] px-6 font-mono text-[15px] last:border-b-0">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className="h-3 w-3 shrink-0 rounded-full shadow-[0_0_16px_currentColor]"
          style={{ color: scoreColor, backgroundColor: scoreColor }}
        />
        <span className="truncate font-bold tracking-[0.02em] text-white">{row.company}</span>
      </div>

      <div>
        <span
          className="inline-flex border px-3 py-2 text-[13px]"
          style={{ borderColor: `${scoreColor}66`, color: scoreColor }}
        >
          {row.score}/100
        </span>
      </div>

      <div className="text-[15px]" style={{ color: change >= 0 ? "#28c840" : "#ff2d2d" }}>
        {change >= 0 ? "^" : "v"} {changeLabel}
      </div>

      <div className="text-[#4d4d54]">{formatShortDate(row.lastChecked)}</div>

      <div>
        <span
          className="inline-flex border px-3 py-2 text-[13px] uppercase"
          style={{
            borderColor: `${statusColor}55`,
            color: statusColor,
          }}
        >
          {row.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[12px] text-[#3f3f46]">
        <a className="transition-colors hover:text-white" href={`/report/${encodeURIComponent(row.company)}`}>
          VIEW
        </a>
        <button
          className="transition-colors hover:text-white disabled:opacity-50"
          disabled={busyAction === "pause"}
          onClick={() => updateStatus(row.status === "active" ? "paused" : "active")}
          type="button"
        >
          {row.status === "active" ? "PAUSE" : "RESUME"}
        </button>
        <button
          className="transition-colors hover:text-[#ff2d2d] disabled:opacity-50"
          disabled={busyAction === "delete"}
          onClick={removeCompany}
          type="button"
        >
          DEL
        </button>
      </div>
    </div>
  );
}
