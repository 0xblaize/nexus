import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { TabSignals } from "@/components/signals/TabSignals";
import { getDashboardPageData } from "@/lib/dashboard-page-data";

export default async function SignalsPage() {
  const { activeAlerts, monitoredCompanies, reportCount, dashboardData } =
    await getDashboardPageData();

  return (
    <DashboardShell
      activeTab="Signals Feed"
      activeAlerts={activeAlerts}
      monitoredCompanies={monitoredCompanies}
      reportCount={reportCount}
    >
      <TabSignals feed={dashboardData.signalFeed} summary={dashboardData.signalSummary} />
    </DashboardShell>
  );
}
