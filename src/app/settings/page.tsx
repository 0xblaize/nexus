import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { TabSettings } from "@/components/settings/TabSettings";
import { getDashboardPageData } from "@/lib/dashboard-page-data";

export default async function SettingsPage() {
  const { activeAlerts, monitoredCompanies, reportCount } = await getDashboardPageData();

  return (
    <DashboardShell
      activeTab="Settings"
      activeAlerts={activeAlerts}
      monitoredCompanies={monitoredCompanies}
      reportCount={reportCount}
    >
      <TabSettings />
    </DashboardShell>
  );
}
