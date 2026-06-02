"use client";

import { FormEvent, useEffect, useRef } from "react";

import { AgentPipeline } from "@/components/analyze/AgentPipeline";
import { AnalyzeResults } from "@/components/analyze/AnalyzeResults";
import { AnalyzeTerminal } from "@/components/analyze/AnalyzeTerminal";
import type { AnalyzeInitialState } from "@/components/analyze/analyze-types";
import { useAnalyzeRun } from "@/components/analyze/useAnalyzeRun";

export function TabAnalyze({ initialState }: { initialState?: AnalyzeInitialState | null }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    query,
    setQuery,
    stage,
    result,
    logs,
    error,
    company,
    isRunning,
    hasCompleted,
    run,
    reset,
  } = useAnalyzeRun(initialState);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key.toLowerCase() === "r" && !isTyping) {
        event.preventDefault();
        void run();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [run]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run();
  }

  return (
    <div className="w-full max-w-[994px]" style={{ paddingTop: 2, zoom: 0.9 }}>
      <header className="max-w-[960px]">
        <div className="mb-4 flex items-center gap-4">
          <span className="h-px w-10 bg-[#c8ff00]" />
          <span className="font-mono text-[16px] font-medium uppercase tracking-[0.36em] text-[#c8ff00]">
            Analyze
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
          TARGET INTELLIGENCE
        </h1>
        <p className="mt-2 font-mono text-[16px] tracking-[0.01em] text-[#56565d]">
          Enter a company name. Three agents execute in sequence.
        </p>
      </header>

      <form className="mt-7 space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_134px_122px]">
          <div className="flex h-[72px] min-w-0 border border-[#23232c] bg-[#101015] focus-within:border-[#43434f]">
            <div className="grid w-[66px] shrink-0 place-items-center">
              <span className="font-mono text-[18px] text-[#3f3f45]">$</span>
            </div>
            <input
              className="min-w-0 flex-1 bg-transparent px-2 font-mono text-[18px] tracking-[0.02em] text-[#b7b7bd] outline-none placeholder:text-[#555]"
              disabled={isRunning}
              placeholder="Enter a company name"
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <button
            className="h-[72px] bg-[#c8ff00] font-mono text-[16px] font-bold uppercase tracking-[0.14em] text-black disabled:opacity-40"
            disabled={isRunning || !query.trim()}
            type="submit"
          >
            RUN
          </button>

          <button
            className="h-[72px] border border-[#27272f] font-mono text-[16px] uppercase tracking-[0.14em] text-[#666] transition-colors hover:border-[#555] hover:text-white disabled:border-[#1e1e24] disabled:text-[#3b3b42]"
            disabled={!hasCompleted && !query.trim()}
            onClick={reset}
            type="button"
          >
            RESET
          </button>
        </div>

        {error ? (
          <div className="border border-[#ff2d2d]/40 bg-[#ff2d2d]/5 px-5 py-4 text-left font-mono text-[12px] tracking-[0.04em] text-[#ff9999]">
            {error}
          </div>
        ) : null}

        {isRunning ? (
          <div className="border border-[#2a2f14] bg-[rgba(20,24,7,0.22)] px-5 py-4 font-mono text-[12px] uppercase tracking-[0.16em] text-[#c8ff00]">
            Live pipeline running...
          </div>
        ) : null}
      </form>

      <div aria-hidden="true" style={{ height: 28 }} />
      <AgentPipeline logs={logs} stage={stage} />
      <div aria-hidden="true" style={{ height: 28 }} />
      <AnalyzeTerminal isRunning={isRunning} logs={logs} />

      {result ? (
        <div className="mt-7">
          <AnalyzeResults company={company} result={result} />
        </div>
      ) : null}
    </div>
  );
}
