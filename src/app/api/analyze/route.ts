import { NextResponse } from "next/server";
import { runNexusPipeline } from "@/agents/orchestrator";
import type { AnalyzeResponse, LlmProvider, McpArchiveRecord, PipelineResult } from "@/types/nexus";

export const runtime = "nodejs";

function normalizeProvider(input: unknown): LlmProvider {
  return "gemini";
}

function buildGeminiArchiveRecord(company: string, result: PipelineResult): McpArchiveRecord {
  return {
    schema: "mcp.telemetry.run.v1",
    provider: "gemini",
    target: company,
    generatedAt: new Date().toISOString(),
    run: {
      score: result.score,
      confidence: result.confidence,
      recommendation: result.recommendation,
      signalCount: result.signals.length,
    },
    context: {
      keyInsight: result.keyInsight,
      reportId: result.reportId,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      company?: string;
      target?: string;
      threshold?: number | string;
      provider?: string;
    };
    const requestedCompany =
      typeof body.company === "string"
        ? body.company.trim()
        : typeof body.target === "string"
          ? body.target.trim()
          : "";
    const threshold = Number.isFinite(Number(body.threshold))
      ? Number(body.threshold)
      : 65;
    const provider = normalizeProvider(body.provider);

    if (!requestedCompany) {
      return NextResponse.json({ error: "company name required" }, { status: 400 });
    }

    const pipeline = await runNexusPipeline(requestedCompany, {
      threshold,
      provider,
      deliverToTeams: false,
    });
    const { logs = [], ...result } = pipeline;
    const typedResult = result as PipelineResult;
    const archivalRecord = provider === "gemini"
      ? buildGeminiArchiveRecord(requestedCompany, typedResult)
      : undefined;
    const response: AnalyzeResponse = {
      success: true,
      company: requestedCompany,
      provider,
      result: {
        ...typedResult,
        archivalRecord,
      },
      logs,
      archivalRecord,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "analysis failed";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
