"use client";

import { useEffect, useState } from "react";

import { getCurrentTime } from "@/components/analyze/analyze-utils";

export function AppTopbar({
  activeLabel = "Analyze",
  leftOffset = 360,
  height = 72,
}: {
  activeLabel?: string;
  leftOffset?: number;
  height?: number;
}) {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    setTime(getCurrentTime());
    const timer = window.setInterval(() => setTime(getCurrentTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header
      className="fixed right-0 top-0 z-30 flex items-center justify-between border-b border-[#1a1a22] bg-[#050507] px-8"
      style={{ left: leftOffset, height }}
    >
      <div className="flex items-center gap-3 font-mono text-[13px] uppercase tracking-[0.22em] text-[#595961]">
        <img
          alt="NEXUS logo"
          className="h-8 w-8 object-contain"
          src="/logo-mark.png"
        />
        <span className="px-2 text-[#333]">/</span>
        <span className="text-[#c8ff00]">{activeLabel}</span>
      </div>
      <div className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#3f3f46]">{time}</div>
    </header>
  );
}
