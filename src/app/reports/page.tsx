import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { TabReports } from "@/components/reports/TabReports";
import { getDashboardPageData } from "@/lib/dashboard-page-data";

export default async function ReportsPage() {
  const { activeAlerts, monitoredCompanies, reportCount, dashboardData } =
    await getDashboardPageData();

  return (
    <DashboardShell
      activeTab="Reports"
      activeAlerts={activeAlerts}
      monitoredCompanies={monitoredCompanies}
      reportCount={reportCount}
    >
      <TabReports reports={dashboardData.reports} />
    </DashboardShell>
  );
}
