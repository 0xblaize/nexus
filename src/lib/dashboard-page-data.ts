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
  const uniqueCompanies = new Set(
    reports
      .filter((report) => report?.company)
      .map((report) => report.company.toLowerCase()),
  );

  return {
    activeAlerts: reports.filter((report) => report.hasAlert).length,
    monitoredCompanies: uniqueCompanies.size,
    reportCount: reports.length,
    dashboardData: buildDashboardData(reports, watchlistState),
  };
}
