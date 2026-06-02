import { NextResponse } from "next/server";
import { getReport } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company");

    if (!company) {
      return NextResponse.json({ error: "Missing company query parameter" }, { status: 400 });
    }

    const decodedCompany = decodeURIComponent(company);
    const report = await getReport(decodedCompany);

    if (!report) {
      return NextResponse.json({ error: `Report not found for target: ${decodedCompany}` }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load report";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
