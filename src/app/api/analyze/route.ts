import { NextResponse } from "next/server";
import { runNexusPipeline } from "@/agents/orchestrator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const threshold = Number.isFinite(Number(body.threshold))
    ? Number(body.threshold)
    : 65;

  if (!company) {
    return NextResponse.json({ error: "company name required" }, { status: 400 });
  }

  try {
    const pipeline = await runNexusPipeline(company, {
      threshold,
      deliverToTeams: false,
    });
    const { logs = [], ...result } = pipeline;
    return NextResponse.json({ success: true, company, result, logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "analysis failed";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
