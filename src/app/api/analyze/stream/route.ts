import { runNexusPipeline } from "@/agents/orchestrator";
import type { AgentLog } from "@/types/nexus";

export const runtime = "nodejs";

function encodeEvent(payload: unknown) {
  return new TextEncoder().encode(`${JSON.stringify(payload)}\n`);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const threshold = Number.isFinite(Number(body.threshold))
    ? Number(body.threshold)
    : 65;

  if (!company) {
    return Response.json({ error: "company name required" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encodeEvent(payload));
      };

      try {
        const pipeline = await runNexusPipeline(company, {
          threshold,
          deliverToTeams: false,
          logger: (log: AgentLog) => send({ type: "log", log }),
        });
        const { logs: _logs = [], ...result } = pipeline;

        send({
          type: "result",
          company,
          result,
        });
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "analysis failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/x-ndjson; charset=utf-8",
    },
  });
}
