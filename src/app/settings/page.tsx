import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { TabSettings } from "@/components/settings/TabSettings";
import { getDashboardPageData } from "@/lib/dashboard-page-data";
import { getSettings } from "@/lib/db";

export default async function SettingsPage() {
  const { activeAlerts, monitoredCompanies, reportCount } = await getDashboardPageData();
  const settings = await getSettings();

  return (
    <DashboardShell
      activeTab="Settings"
      activeAlerts={activeAlerts}
      monitoredCompanies={monitoredCompanies}
      reportCount={reportCount}
    >
      <TabSettings initialSettings={settings} />
    </DashboardShell>
  );
}
