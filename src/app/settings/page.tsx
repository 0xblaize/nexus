import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { TabSettings } from "@/components/settings/TabSettings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardPageData } from "@/lib/dashboard-page-data";
import { getSettings } from "@/lib/db";

export default async function SettingsPage() {
  const { activeAlerts, monitoredCompanies, reportCount } = await getDashboardPageData();
  const session = await getServerSession(authOptions);
  const settings = await getSettings();
  const sessionUser = session?.user
    ? {
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        plan: String((session.user as Record<string, unknown>).plan || "FREE_DEVELOPER"),
      }
    : null;

  return (
    <DashboardShell
      activeTab="Settings"
      activeAlerts={activeAlerts}
      monitoredCompanies={monitoredCompanies}
      reportCount={reportCount}
    >
      <TabSettings initialSettings={settings} sessionUser={sessionUser} />
    </DashboardShell>
  );
}
