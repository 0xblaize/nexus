import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { TabSettings } from "@/components/settings/TabSettings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardPageData } from "@/lib/dashboard-page-data";
import { getSettings } from "@/lib/db";
import { hydrateUserSession } from "@/lib/user-profile";

export default async function SettingsPage() {
  const { activeAlerts, monitoredCompanies, reportCount } = await getDashboardPageData();
  const session = await getServerSession(authOptions);
  const settings = await getSettings();
  const hydratedUser = hydrateUserSession(session?.user?.email, session?.user?.name);
  const sessionUser = session?.user
    ? {
        name: hydratedUser.displayName,
        email: hydratedUser.emailAddress,
        plan: hydratedUser.planTier,
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
