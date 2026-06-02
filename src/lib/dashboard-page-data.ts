import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { buildDashboardData } from "@/lib/dashboard-helpers";
import { getReports, getWatchlist } from "@/lib/db";
import type { Report } from "@/types/nexus";

export async function getDashboardPageData() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const reports = (await getReports(50)) as Report[];
  const watchlistState = await getWatchlist();
  const dashboardData = buildDashboardData(reports, watchlistState);

  return {
    activeAlerts: dashboardData.overview.activeAlerts,
    monitoredCompanies: dashboardData.watchlist.length,
    reportCount: reports.length,
    dashboardData,
  };
}
