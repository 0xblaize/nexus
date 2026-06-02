import { NextResponse } from "next/server";

import { deliverToTeams } from "@/lib/teams";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (!body?.memo) {
    return NextResponse.json({ error: "memo is required" }, { status: 400 });
  }

  try {
    await deliverToTeams({
      memo: body.memo,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Teams delivery failed",
      },
      { status: 500 },
    );
  }
}
