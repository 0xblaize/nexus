import { NextResponse } from "next/server";
import { getReports } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getReports());
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load reports";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
