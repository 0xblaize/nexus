import { NextResponse } from "next/server";
import { getReport } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { company } = await params;
    const report = await getReport(decodeURIComponent(company));

    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
