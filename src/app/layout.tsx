import type { ReactNode } from "react";

import "./globals.css";
import "../landing/landing.css";
import { GlobalCursor } from "@/components/shared/GlobalCursor";

export const metadata = {
  title: "NEXUS - Autonomous M&A Intelligence",
  description:
    "NEXUS monitors public web signals and surfaces M&A intelligence before announcements drop.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Patrick+Hand+SC&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GlobalCursor />
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-6 text-center md:hidden">
          <div className="relative max-w-sm overflow-hidden border border-[#1a1a22] bg-[#080808] p-8 font-mono">
            <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-[#c8ff00]" />
            <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-[#c8ff00]" />

            <h1 className="mb-4 font-sans text-3xl font-bold uppercase tracking-[0.18em] text-white">
              System Access
            </h1>
            <p className="mb-6 text-xs leading-relaxed text-neutral-400">
              Best viewed on desktop. NEXUS runs a dense multi-agent operations console with live
              telemetry, streaming logs, and workspace panels that require a wider viewport.
            </p>
            <div className="inline-block border border-[#c8ff00]/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[#c8ff00]">
              Desktop Viewport Required
            </div>
          </div>
        </div>

        <div className="hidden min-h-screen md:block">{children}</div>
      </body>
    </html>
  );
}
