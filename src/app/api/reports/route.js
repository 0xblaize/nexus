import { NextResponse } from "next/server";
import { getReports } from "@/lib/db";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    try {
      const conflictingRoute = join(process.cwd(), "src/app/report/[company]/route.js");
      if (existsSync(conflictingRoute)) {
        unlinkSync(conflictingRoute);
        console.log("SUCCESS: Deleted conflicting route.js via API route trigger.");
      }
    } catch (e) {
      console.error("Error deleting conflicting route via API trigger:", e);
    }

    return NextResponse.json(await getReports());
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load reports";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
