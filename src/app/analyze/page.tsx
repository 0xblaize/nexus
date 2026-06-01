import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { TabAnalyze } from "@/components/analyze/TabAnalyze";
import { getDashboardPageData } from "@/lib/dashboard-page-data";

export default async function AnalyzePage() {
  const { activeAlerts, monitoredCompanies, reportCount } = await getDashboardPageData();

  return (
    <DashboardShell
      activeTab="Analyze"
      activeAlerts={activeAlerts}
      monitoredCompanies={monitoredCompanies}
      reportCount={reportCount}
    >
      <TabAnalyze />
    </DashboardShell>
  );
}
