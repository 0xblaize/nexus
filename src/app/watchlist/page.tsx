import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { TabWatchlist } from "@/components/watchlist/TabWatchlist";
import { getDashboardPageData } from "@/lib/dashboard-page-data";

export default async function WatchlistPage() {
  const { activeAlerts, monitoredCompanies, reportCount, dashboardData } =
    await getDashboardPageData();

  return (
    <DashboardShell
      activeTab="Watchlist"
      activeAlerts={activeAlerts}
      monitoredCompanies={monitoredCompanies}
      reportCount={reportCount}
    >
      <TabWatchlist rows={dashboardData.watchlist} />
    </DashboardShell>
  );
}
