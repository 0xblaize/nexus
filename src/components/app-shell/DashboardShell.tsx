import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-shell/AppSidebar";
import { AppTopbar } from "@/components/app-shell/AppTopbar";

interface DashboardShellProps {
  activeTab?: string;
  activeAlerts: number;
  monitoredCompanies: number;
  reportCount: number;
  children: ReactNode;
}

const SIDEBAR_WIDTH = 320;
const TOPBAR_HEIGHT = 72;
const CONTENT_GUTTER = 42;

export function DashboardShell({
  activeTab = "Analyze",
  activeAlerts,
  monitoredCompanies,
  reportCount,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <AppSidebar
        activeItem={activeTab}
        stats={{
          activeAlerts,
          monitoredCompanies,
          reportCount,
        }}
        width={SIDEBAR_WIDTH}
      />
      <AppTopbar activeLabel={activeTab} leftOffset={SIDEBAR_WIDTH} height={TOPBAR_HEIGHT} />
      <main
        className="grid-bg min-h-screen overflow-y-auto pb-20"
        style={{
          marginLeft: SIDEBAR_WIDTH,
          paddingTop: TOPBAR_HEIGHT,
        }}
      >
        <div
          className="w-full py-12 pr-10 xl:pr-12"
          style={{ paddingLeft: CONTENT_GUTTER }}
        >
          {children}
        </div>
      </main>
      <div
        className="fixed bottom-0 right-0 z-30 border-t border-[#121217] bg-black/95 py-3 text-center font-mono text-[12px] uppercase tracking-[0.35em] text-[#17171c]"
        style={{ left: SIDEBAR_WIDTH }}
      >
        TAB {activeTab === "Analyze" ? "1" : "2"} - {activeTab.toUpperCase()}
      </div>
    </div>
  );
}
